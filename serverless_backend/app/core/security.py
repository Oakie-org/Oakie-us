"""
JWT Token verification for Cognito tokens.
For local dev, we decode the JWT and extract claims.
In production (API Gateway), the JWT is already validated by the authorizer.
"""

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel

from app.core.config import settings

# Security scheme for FastAPI docs
security = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    """Decoded JWT payload from Cognito."""

    sub: str  # User ID (Cognito UUID)
    email: Optional[str] = None
    name: Optional[str] = None
    cognito_username: Optional[str] = None


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
    Verify JWT token and return decoded payload.
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

        return TokenPayload(
            sub=payload.get("sub", ""),
            email=payload.get("email"),
            name=payload.get("name"),
            cognito_username=payload.get("cognito:username"),
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
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_token(credentials.credentials)
