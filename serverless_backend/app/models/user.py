from pydantic import BaseModel, Field

from app.models.common import Label, ShortText


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    headline: ShortText = ""
    bio: str = Field(default="", max_length=1200)
    city: ShortText = ""
    uni: ShortText = ""
    skills: list[Label] = Field(default_factory=list, max_length=20)
    # What the member is open to, e.g. "Co-founder", "Side project".
    open_to: list[Label] = Field(default_factory=list, max_length=8)
    website: str = Field(default="", max_length=200)
    avatar_url: str | None = None
    banner_url: str | None = None


class UserUpdate(BaseModel):
    """Editable profile fields; anything omitted is left untouched."""

    name: str | None = Field(default=None, min_length=1, max_length=60)
    headline: ShortText | None = None
    bio: str | None = Field(default=None, max_length=1200)
    city: ShortText | None = None
    uni: ShortText | None = None
    skills: list[Label] | None = Field(default=None, max_length=20)
    open_to: list[Label] | None = Field(default=None, max_length=8)
    website: str | None = Field(default=None, max_length=200)
    avatar_url: str | None = None
    banner_url: str | None = None


class UserSummary(BaseModel):
    """Compact identity shown next to content the user authored."""

    id: str
    name: str
    headline: str = ""
    avatar_url: str | None = None
    city: str = ""
    uni: str = ""
    skills: list[str] = Field(default_factory=list)
    open_to: list[str] = Field(default_factory=list)


class UserPublic(UserBase):
    id: str
    num_projects: int = 0
    num_followers: int = 0
    num_following: int = 0
    created_at: str = ""
    # Whether the viewer follows this user; None for anonymous viewers.
    is_following: bool | None = None


class UserPrivate(UserPublic):
    email: str | None = None
    roles: list[str] = Field(default_factory=list)
