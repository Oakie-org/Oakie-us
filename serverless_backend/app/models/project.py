from pydantic import BaseModel, Field

from app.shared.enum import ProjectStatus


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


class ProjectCreate(ProjectBase):
    pass


class ProjectPublic(ProjectBase):
    id: str
    current_members: int
    likes: int
    follows: int
    created_at: str
    updated_at: str


class ProjectsListResponse(BaseModel):
    items: list[ProjectPublic]
    total: int
    page: int
    page_size: int


class ProjectListRequest(BaseModel):
    status: ProjectStatus | None = None
    category: str | None = None
    city: str | None = None
    uni: str | None = None
    tag: str | None = None
    q: str | None = None
