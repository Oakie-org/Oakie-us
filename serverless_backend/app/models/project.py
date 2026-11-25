from pydantic import BaseModel, Field

from app.models.common import (
    ApplicationStatus,
    Label,
    ProjectRole,
    ProjectStatus,
    ProjectVisibility,
    ShortText,
    TaskStatus,
    TimelineKind,
)
from app.models.user import UserSummary


class OpenRole(BaseModel):
    """A seat the team is recruiting for."""

    title: Label
    skills: list[Label] = Field(default_factory=list, max_length=6)


class ProjectBase(BaseModel):
    title: str = Field(min_length=3, max_length=80)
    subtitle: ShortText = ""
    description: str = Field(min_length=1, max_length=6000)
    category: Label = "General"
    tags: list[Label] = Field(default_factory=list, max_length=8)
    status: ProjectStatus = ProjectStatus.RECRUITING
    uni: ShortText = ""
    city: ShortText = ""
    remote_ok: bool = True
    max_members: int = Field(default=5, ge=1, le=50)
    open_roles: list[OpenRole] = Field(default_factory=list, max_length=8)
    image_url: str | None = None
    visibility: ProjectVisibility = ProjectVisibility.PUBLIC


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=80)
    subtitle: ShortText | None = None
    description: str | None = Field(default=None, min_length=1, max_length=6000)
    category: Label | None = None
    tags: list[Label] | None = Field(default=None, max_length=8)
    status: ProjectStatus | None = None
    uni: ShortText | None = None
    city: ShortText | None = None
    remote_ok: bool | None = None
    max_members: int | None = Field(default=None, ge=1, le=50)
    open_roles: list[OpenRole] | None = Field(default=None, max_length=8)
    image_url: str | None = None
    visibility: ProjectVisibility | None = None


class ProjectPublic(ProjectBase):
    id: str
    owner_id: str
    current_members: int = 1
    likes: int = 0
    follows: int = 0
    priority: int = 0
    created_at: str
    updated_at: str


class ProjectViewer(BaseModel):
    """How the caller relates to a project. All false/None for anonymous callers."""

    role: ProjectRole | None = None
    has_liked: bool = False
    is_following: bool = False
    application_status: ApplicationStatus | None = None


class ProjectDetail(ProjectPublic):
    owner: UserSummary | None = None
    viewer: ProjectViewer = Field(default_factory=ProjectViewer)


class ProjectMembership(ProjectPublic):
    """A project as it appears on a member's profile."""

    role: ProjectRole
    member_title: str = ""


# ---------------------------------------------------------------- members


class MemberPublic(BaseModel):
    user: UserSummary
    role: ProjectRole
    title: str = ""
    joined_at: str


class MemberUpdate(BaseModel):
    role: ProjectRole | None = None
    title: Label | None = None


# ----------------------------------------------------------- applications


class ApplicationCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1200)
    role_title: ShortText = ""


class ApplicationDecision(BaseModel):
    approve: bool


class ApplicationPublic(BaseModel):
    project_id: str
    applicant_id: str
    status: ApplicationStatus
    message: str
    role_title: str = ""
    created_at: str
    decided_at: str | None = None
    applicant: UserSummary | None = None
    project_title: str | None = None


# --------------------------------------------------------------- timeline


class TimelinePostBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=4000)
    kind: TimelineKind = TimelineKind.UPDATE
    media_urls: list[str] = Field(default_factory=list, max_length=6)


class TimelinePostCreate(TimelinePostBase):
    pass


class TimelinePostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    content: str | None = Field(default=None, min_length=1, max_length=4000)
    kind: TimelineKind | None = None
    media_urls: list[str] | None = Field(default=None, max_length=6)


class TimelinePostPublic(TimelinePostBase):
    id: str
    project_id: str
    author: UserSummary | None = None
    created_at: str
    updated_at: str


# ------------------------------------------------------------------ tasks


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)
    status: TaskStatus = TaskStatus.BACKLOG
    assignee_id: str | None = None
    due_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus | None = None
    assignee_id: str | None = None
    due_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")


class TaskPublic(TaskBase):
    id: str
    project_id: str
    assignee: UserSummary | None = None
    created_by: str
    created_at: str
    updated_at: str
    completed_at: str | None = None


# ---------------------------------------------------------- contributions


class ContributionRecord(BaseModel):
    """Verifiable proof that a member took part in a project."""

    code: str
    member: UserSummary
    project_id: str
    project_title: str
    project_category: str
    project_status: ProjectStatus
    role: ProjectRole
    title: str = ""
    joined_at: str
    tasks_completed: int = 0
    tasks_assigned: int = 0
