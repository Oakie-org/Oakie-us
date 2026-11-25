from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.common import Label, ShortText

Accent = Literal[
    "", "sky", "lilac", "mint", "coral", "pink", "sun", "aqua", "orange", "leaf", "sand"
]


class ProfileLink(BaseModel):
    """A link the member chose to show: portfolio, GitHub, a resume, a reel."""

    label: Label
    url: str = Field(min_length=8, max_length=200)

    @field_validator("url")
    @classmethod
    def _web_only(cls, value: str) -> str:
        value = value.strip()
        if not value.lower().startswith(("https://", "http://")):
            raise ValueError("Links must start with https:// or http://")
        return value


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
    # Profile design: what the member chooses to put forward.
    links: list[ProfileLink] = Field(default_factory=list, max_length=6)
    accent: Accent = ""
    pinned_project_ids: list[str] = Field(default_factory=list, max_length=3)
    availability: ShortText = ""


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
    links: list[ProfileLink] | None = Field(default=None, max_length=6)
    accent: Accent | None = None
    pinned_project_ids: list[str] | None = Field(default=None, max_length=3)
    availability: ShortText | None = None


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
    availability: str = ""
    accent: str = ""
    # The account was confirmed with a school email address.
    verified_school: bool = False


class UserPublic(UserBase):
    id: str
    num_projects: int = 0
    num_followers: int = 0
    num_following: int = 0
    created_at: str = ""
    verified_school: bool = False
    # Whether the viewer follows this user; None for anonymous viewers.
    is_following: bool | None = None


class UserPrivate(UserPublic):
    email: str | None = None
    roles: list[str] = Field(default_factory=list)
