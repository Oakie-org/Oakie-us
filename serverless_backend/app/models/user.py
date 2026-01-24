from pydantic import BaseModel
from typing import Optional


class UserProfile(BaseModel):
    """Full public profile"""

    sub: str
    name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[list[str]] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    num_projects: int = 0
    num_followers: int = 0
    num_following: int = 0


class PublicUserProfile(UserProfile):
    """Public profile"""

    pass


class PrivateUserProfile(UserProfile):
    """Private profile"""

    email: Optional[str] = None
    created_at: Optional[str] = None


class UserProfileUpdate(UserProfile):
    pass


class UsersListResponse(BaseModel):
    items: list[PublicUserProfile]
