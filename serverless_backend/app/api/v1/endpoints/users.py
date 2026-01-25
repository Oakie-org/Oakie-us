from fastapi import APIRouter, Depends, HTTPException
from boto3.dynamodb.conditions import Attr
from app.core.security import get_current_user, TokenPayload
from app.db.dynamodb import get_users_db
from app.models.user import (
    PrivateUserProfile,
    PublicUserProfile,
    UsersListRequest,
    UserProfileUpdate,
    UsersListResponse,
)

router = APIRouter()


def _public_user_from_item(item: dict) -> PublicUserProfile:
    pk = str(item.get("PK") or "")
    user_id = (
        pk[len("USER#") :] if pk.startswith("USER#") else str(item.get("sub") or "")
    )
    name = item.get("name") or item.get("nickname") or ""

    return PublicUserProfile(
        sub=user_id,
        name=name,
        bio=item.get("bio"),
        location=(item.get("params") or {}).get("city"),
        uni=(item.get("params") or {}).get("uni"),
        skills=item.get("skills", []),
        avatar_url=item.get("avatar_url"),
        banner_url=item.get("banner_url"),
        num_projects=item.get("num_projects", 0),
        num_followers=item.get("num_followers", 0),
        num_following=item.get("num_following", 0),
    )


@router.get("", response_model=UsersListResponse)
def list_users(
    filters: UsersListRequest = Depends(),
) -> UsersListResponse:
    """
    List users, optionally filtered by a search query.
    """
    db = get_users_db()
    filter_expression = Attr("type").eq("USER")
    if filters.name:
        name_value = filters.name.strip()
        if name_value:
            filter_expression &= Attr("name").contains(name_value) | Attr(
                "nickname"
            ).contains(name_value)
    if filters.nickname:
        nickname_value = filters.nickname.strip()
        if nickname_value:
            filter_expression &= Attr("nickname").contains(nickname_value)
    if filters.bio:
        bio_value = filters.bio.strip()
        if bio_value:
            filter_expression &= Attr("bio").contains(bio_value)
    if filters.skill:
        skill_value = filters.skill.strip()
        if skill_value:
            filter_expression &= Attr("skills").contains(skill_value)

    items = db.scan(filter_expression=filter_expression)

    if filters.location or filters.uni:
        location_value = filters.location.strip() if filters.location else None
        uni_value = filters.uni.strip() if filters.uni else None
        filtered_items: list[dict] = []
        for item in items:
            params = item.get("params") or {}
            item_location = item.get("location") or params.get("city") or ""
            item_uni = item.get("uni") or params.get("uni") or ""
            if location_value and location_value not in str(item_location):
                continue
            if uni_value and uni_value not in str(item_uni):
                continue
            filtered_items.append(item)
        items = filtered_items

    users = [_public_user_from_item(item) for item in items]
    return UsersListResponse(items=users)


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
