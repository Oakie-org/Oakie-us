from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, TokenPayload
from app.db.dynamodb import get_users_db

router = APIRouter()


class UserProfile(BaseModel):
    """User profile response."""

    sub: str
    email: Optional[str] = None
    name: Optional[str] = None
    nickname: Optional[str] = None


@router.get("/me", response_model=UserProfile)
async def read_users_me(current_user: TokenPayload = Depends(get_current_user)):
    """
    Get current user profile.
    Requires Authorization: Bearer <token>
    """
    # Try to get additional info from DynamoDB
    db = get_users_db()
    db_user = db.get_item(f"USER#{current_user.sub}")

    if db_user:
        return UserProfile(
            sub=current_user.sub,
            email=db_user.get("email") or current_user.email,
            name=current_user.name,
            nickname=db_user.get("nickname"),
        )

    # Fallback to JWT claims only
    return UserProfile(
        sub=current_user.sub,
        email=current_user.email,
        name=current_user.name,
    )
