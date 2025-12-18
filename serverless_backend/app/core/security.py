"""
JWT Token verification for Cognito tokens with role-based access control.

For local dev, we decode the JWT and extract claims including cognito:groups.
In production (API Gateway), the JWT is validated by the authorizer,
but we still need to parse claims for permission checks.
"""

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel
from enum import Enum

from app.core.config import settings


class GlobalRole(str, Enum):
    """
    Global user roles managed via Cognito Groups.
    Lower precedence = higher priority in cognito:groups claim.
    """

    SUPER_ADMIN = "super_admin"  # Precedence 0: Full platform access
    ADMIN = "admin"  # Precedence 1: User & content management
    MODERATOR = "moderator"  # Precedence 2: Content review
    CREATOR = "creator"  # Precedence 10: Can create projects
    USER = "user"  # Precedence 100: Standard user (default)


# Security scheme for FastAPI docs
security = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    """
    Decoded JWT payload from Cognito with role information.

    Attributes:
        sub: User ID (Cognito UUID)
        email: User email
        name: User display name
        cognito_username: Cognito username (usually same as email)
        cognito_groups: List of Cognito groups user belongs to (roles)
    """

    sub: str  # User ID (Cognito UUID)
    email: Optional[str] = None
    name: Optional[str] = None
    cognito_username: Optional[str] = None
    cognito_groups: list[str] = []  # Roles from Cognito groups

    def has_role(self, role: GlobalRole) -> bool:
        """Check if user belongs to specified role group."""
        return role.value in self.cognito_groups

    def has_any_role(self, roles: list[GlobalRole]) -> bool:
        """Check if user belongs to any of the specified role groups."""
        role_values = {r.value for r in roles}
        return any(g in role_values for g in self.cognito_groups)

    @property
    def primary_role(self) -> GlobalRole:
        """
        Get user's highest priority role.
        cognito:groups is ordered by precedence (lowest first = highest priority).
        """
        if not self.cognito_groups:
            return GlobalRole.USER

        # Try to parse first group as GlobalRole
        first_group = self.cognito_groups[0]
        try:
            return GlobalRole(first_group)
        except ValueError:
            # Unknown group, default to USER
            return GlobalRole.USER

    def is_admin(self) -> bool:
        """Check if user is admin or super_admin."""
        return self.has_any_role([GlobalRole.ADMIN, GlobalRole.SUPER_ADMIN])

    def is_super_admin(self) -> bool:
        """Check if user is super_admin."""
        return self.has_role(GlobalRole.SUPER_ADMIN)

    def is_moderator_or_above(self) -> bool:
        """Check if user is moderator, admin, or super_admin."""
        return self.has_any_role(
            [GlobalRole.MODERATOR, GlobalRole.ADMIN, GlobalRole.SUPER_ADMIN]
        )

    def is_creator_or_above(self) -> bool:
        """Check if user can create projects (creator, moderator, admin, super_admin)."""
        return self.has_any_role(
            [
                GlobalRole.CREATOR,
                GlobalRole.MODERATOR,
                GlobalRole.ADMIN,
                GlobalRole.SUPER_ADMIN,
            ]
        )


# Cache for JWKS client
_jwks_client: Optional[PyJWKClient] = None


def get_jwks_client() -> PyJWKClient:
    """Get or create JWKS client for Cognito."""
    global _jwks_client
    if _jwks_client is None:
        if not settings.COGNITO_USER_POOL_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="COGNITO_USER_POOL_ID not configured",
            )
        region = settings.AWS_REGION
        pool_id = settings.COGNITO_USER_POOL_ID
        jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


def verify_token(token: str) -> TokenPayload:
    """
    Verify JWT token and return decoded payload with role information.
    Uses Cognito JWKS for signature verification.
    """
    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.COGNITO_CLIENT_ID,
            options={"verify_exp": True},
        )

        # Extract cognito:groups (list of role names)
        cognito_groups = payload.get("cognito:groups", [])
        if not isinstance(cognito_groups, list):
            cognito_groups = []

        return TokenPayload(
            sub=payload.get("sub", ""),
            email=payload.get("email"),
            name=payload.get("name"),
            cognito_username=payload.get("cognito:username"),
            cognito_groups=cognito_groups,
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> TokenPayload:
    """
    FastAPI dependency to get current authenticated user from JWT.
    Returns TokenPayload with user info and roles.

    Usage:
        @router.get("/protected")
        async def protected_route(user: TokenPayload = Depends(get_current_user)):
            print(user.sub, user.email, user.cognito_groups)
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_token(credentials.credentials)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[TokenPayload]:
    """
    FastAPI dependency that returns None for unauthenticated requests.
    Useful for endpoints that have different behavior for auth/unauth users.

    Usage:
        @router.get("/projects/{id}")
        async def get_project(
            id: str,
            user: Optional[TokenPayload] = Depends(get_current_user_optional)
        ):
            # Can check if user is member for private projects
    """
    if not credentials:
        return None

    try:
        return verify_token(credentials.credentials)
    except HTTPException:
        return None
