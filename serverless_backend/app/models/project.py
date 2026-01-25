from pydantic import BaseModel, Field

from app.shared.enum import ProjectStatus, ProjectVisibility


class ProjectBase(BaseModel):
    title: str
    subtitle: str | None = None
    description: str
    tags: list[str] = Field(default_factory=list)
    status: ProjectStatus = ProjectStatus.RECRUITING
    category: str = "General"
    uni: str = ""
    city: str = ""
    max_members: int = 5
    image: str = ""
    image_url: str | None = None
    # Access control fields
    visibility: ProjectVisibility = ProjectVisibility.PUBLIC
    owner_id: str | None = None  # Cognito sub of creator


class ProjectCreate(ProjectBase):
    pass


class ProjectPublic(ProjectBase):
    id: str
    current_members: int
    likes: int
    follows: int
    priority: int = 0  # Higher value = appears first in list
    created_at: str
    updated_at: str


class ProjectsCursorResponse(BaseModel):
    """Cursor-based pagination response for infinite scroll."""

    items: list[ProjectPublic]
    next_cursor: str | None = (
        None  # Base64-encoded cursor for next page, None if no more
    )
    has_more: bool = False
    page_size: int


class ProjectListRequest(BaseModel):
    status: ProjectStatus | None = None
    category: str | None = None
    city: str | None = None
    uni: str | None = None
    tag: str | None = None
    title: str | None = None
    owner_id: str | None = None
