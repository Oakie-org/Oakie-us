"""Token verification and the authenticated principal.

API Gateway's JWT authorizer already rejects unauthenticated calls to protected
routes, but routes with optional auth (public pages that personalise for the
viewer) bypass it, so the application always verifies the token itself.
"""

from datetime import UTC, datetime, timedelta
from enum import StrEnum
from functools import lru_cache
from typing import Protocol

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.errors import Unauthorized

LOCAL_ISSUER = "oakie-local"


class GlobalRole(StrEnum):
    """Platform-wide roles, managed as Cognito groups."""

    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    CREATOR = "creator"
    USER = "user"


# Highest privilege first.
ROLE_ORDER = [
    GlobalRole.SUPER_ADMIN,
    GlobalRole.ADMIN,
    GlobalRole.MODERATOR,
    GlobalRole.CREATOR,
    GlobalRole.USER,
]


class Principal(BaseModel):
    """The caller, as established by a verified token."""

    sub: str
    email: str | None = None
    name: str | None = None
    groups: list[str] = Field(default_factory=list)

    @property
    def roles(self) -> list[GlobalRole]:
        known = {role.value for role in GlobalRole}
        roles = [GlobalRole(group) for group in self.groups if group in known]
        return roles or [GlobalRole.USER]

    def has_at_least(self, minimum: GlobalRole) -> bool:
        """True when any of the caller's roles ranks at or above `minimum`."""
        threshold = ROLE_ORDER.index(minimum)
        return any(ROLE_ORDER.index(role) <= threshold for role in self.roles)

    @property
    def is_admin(self) -> bool:
        return self.has_at_least(GlobalRole.ADMIN)


class TokenVerifier(Protocol):
    def verify(self, token: str) -> Principal: ...


def _principal_from_claims(claims: dict) -> Principal:
    groups = claims.get("cognito:groups") or []
    return Principal(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
        groups=groups if isinstance(groups, list) else [],
    )


class CognitoTokenVerifier:
    """Verifies Cognito access and ID tokens against the pool's JWKS."""

    def __init__(self, region: str, user_pool_id: str, client_id: str):
        self._issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
        self._client_id = client_id
        self._jwks = jwt.PyJWKClient(f"{self._issuer}/.well-known/jwks.json")

    def verify(self, token: str) -> Principal:
        try:
            signing_key = self._jwks.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self._issuer,
                # Access tokens carry `client_id` instead of `aud`; checked below.
                options={"verify_aud": False, "require": ["exp", "iss", "sub"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise Unauthorized("Token has expired") from exc
        except jwt.PyJWTError as exc:
            raise Unauthorized("Invalid token") from exc

        token_use = claims.get("token_use")
        client = claims.get("client_id") if token_use == "access" else claims.get("aud")
        if token_use not in ("access", "id") or client != self._client_id:
            raise Unauthorized("Invalid token")
        return _principal_from_claims(claims)


class LocalTokenVerifier:
    """HS256 tokens minted by the dev-only identity provider."""

    def __init__(self, secret: str):
        self._secret = secret

    def issue(self, principal: Principal, ttl_minutes: int) -> str:
        now = datetime.now(UTC)
        claims = {
            "iss": LOCAL_ISSUER,
            "sub": principal.sub,
            "email": principal.email,
            "name": principal.name,
            "cognito:groups": principal.groups,
            "iat": now,
            "exp": now + timedelta(minutes=ttl_minutes),
        }
        return jwt.encode(claims, self._secret, algorithm="HS256")

    def verify(self, token: str) -> Principal:
        try:
            claims = jwt.decode(
                token,
                self._secret,
                algorithms=["HS256"],
                issuer=LOCAL_ISSUER,
                options={"require": ["exp", "iss", "sub"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise Unauthorized("Token has expired") from exc
        except jwt.PyJWTError as exc:
            raise Unauthorized("Invalid token") from exc
        return _principal_from_claims(claims)


@lru_cache
def get_verifier() -> TokenVerifier:
    if settings.AUTH_MODE == "local":
        return LocalTokenVerifier(settings.LOCAL_JWT_SECRET)
    if not settings.COGNITO_USER_POOL_ID or not settings.COGNITO_CLIENT_ID:
        raise RuntimeError("COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required")
    return CognitoTokenVerifier(
        settings.AWS_REGION, settings.COGNITO_USER_POOL_ID, settings.COGNITO_CLIENT_ID
    )


_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal:
    if not credentials:
        raise Unauthorized("Sign in to continue")
    return get_verifier().verify(credentials.credentials)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal | None:
    """Anonymous callers get None. A present-but-invalid token is still a 401,
    so the client learns its session expired instead of silently browsing as a guest."""
    if not credentials:
        return None
    return get_verifier().verify(credentials.credentials)
