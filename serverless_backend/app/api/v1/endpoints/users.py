from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, TokenPayload
from app.db.dynamodb import get_users_db
from app.models.user import PrivateUserProfile, PublicUserProfile, UserProfileUpdate

router = APIRouter()


@router.get("/me", response_model=PrivateUserProfile)
def read_user_me(current_user: TokenPayload = Depends(get_current_user)):
    """
    Get current user's full private profile.
    """
    db = get_users_db()
    db_user = db.get_item(f"USER#{current_user.sub}")

    if not db_user:
        # Fallback to token info if not in DB yet
        return PrivateUserProfile(
            sub=current_user.sub,
            email=current_user.email,
            name=current_user.name or "",
            num_projects=0,
            num_followers=0,
            num_following=0,
        )

    return PrivateUserProfile(
        # Base fields
        sub=current_user.sub,
        name=db_user.get("name"),
        email=db_user.get("email"),
        bio=db_user.get("bio"),
        location=db_user.get("params", {}).get("city"),
        uni=db_user.get("params", {}).get("uni"),
        skills=db_user.get("skills", []),
        avatar_url=db_user.get("avatar_url"),
        banner_url=db_user.get("banner_url"),
        num_projects=db_user.get("num_projects", 0),
        num_followers=db_user.get("num_followers", 0),
        num_following=db_user.get("num_following", 0),
        # Private fields
        created_at=db_user.get("created_at"),
    )


@router.get("/{user_id}", response_model=PublicUserProfile)
def read_user_public(
    user_id: str,
):
    """
    Get public profile of any user.
    """
    db = get_users_db()
    db_user = db.get_item(f"USER#{user_id}")

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return PublicUserProfile(
        sub=user_id,
        name=db_user.get("name"),
        bio=db_user.get("bio"),
        location=db_user.get("params", {}).get("city"),
        uni=db_user.get("params", {}).get("uni"),
        skills=db_user.get("skills", []),
        avatar_url=db_user.get("avatar_url"),
        banner_url=db_user.get("banner_url"),
        num_projects=db_user.get("num_projects", 0),
        num_followers=db_user.get("num_followers", 0),
        num_following=db_user.get("num_following", 0),
    )


@router.put("/me", response_model=PrivateUserProfile)
def update_user_me(
    profile_update: UserProfileUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Update current user's profile (Upsert).
    """
    db = get_users_db()
    db_user = db.get_item(f"USER#{current_user.sub}")

    if not db_user:
        raise HTTPException(status_code=404, detail="User profile not initialized")

    update_data = profile_update.dict(exclude_unset=True)
    db_user.update(update_data)
    db.put_item(db_user)

    return PrivateUserProfile(
        sub=current_user.sub,
        name=db_user.get("name"),
        email=db_user.get("email"),
        bio=db_user.get("bio"),
        location=db_user.get("params", {}).get("city"),
        skills=db_user.get("skills", []),
        avatar_url=db_user.get("avatar_url"),
        banner_url=db_user.get("banner_url"),
        num_projects=db_user.get("num_projects", 0),
        num_followers=db_user.get("num_followers", 0),
        num_following=db_user.get("num_following", 0),
        created_at=db_user.get("created_at"),
    )
