from typing import Literal

from pydantic import BaseModel, Field

ProjectStatus = Literal["Recruiting", "In Progress", "Idea", "Completed"]


class ProjectCreate(BaseModel):
    title: str
    subtitle: str | None = None
    description: str
    tags: list[str] = Field(default_factory=list)
    status: ProjectStatus = "Recruiting"
    category: str = "General"
    uni: str = ""
    city: str = ""
    max_members: int = 5
    image: str = ""
    image_url: str | None = None


class ProjectPublic(BaseModel):
    id: str
    title: str
    subtitle: str | None = None
    description: str
    tags: list[str] = Field(default_factory=list)
    status: ProjectStatus
    category: str
    uni: str
    city: str
    current_members: int
    max_members: int
    likes: int
    follows: int
    image: str
    image_url: str | None = None
    created_at: str
    updated_at: str


class ProjectsListResponse(BaseModel):
    items: list[ProjectPublic]
    total: int
    page: int
    page_size: int
