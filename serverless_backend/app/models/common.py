from enum import StrEnum
from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, StringConstraints

T = TypeVar("T")

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=140)]
Label = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]


class CursorPage(BaseModel, Generic[T]):
    """Cursor pagination: pass `next_cursor` back to get the following page."""

    items: list[T]
    next_cursor: str | None = None


class ProjectStatus(StrEnum):
    IDEA = "Idea"
    RECRUITING = "Recruiting"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class ProjectVisibility(StrEnum):
    PUBLIC = "public"  # listed, fully visible
    MEMBERS_ONLY = "members_only"  # listed, but updates and team are for members
    PRIVATE = "private"  # unlisted, members only


class ProjectRole(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class ApplicationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class InvitationStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class TaskStatus(StrEnum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"


class TimelineKind(StrEnum):
    UPDATE = "update"
    MILESTONE = "milestone"
    RELEASE = "release"
