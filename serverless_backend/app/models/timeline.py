from typing import List, Optional
from pydantic import BaseModel, Field


# =========================
# Base models
# =========================


class TimelinePostBase(BaseModel):
    """
    Shared fields for a timeline post.
    Used by create/update requests.
    """

    title: str
    content: str
    media_urls: List[str] = Field(default_factory=list)


# =========================
# Create / Update requests
# =========================


class CreateTimelinePostRequest(TimelinePostBase):
    """
    Request body for creating a timeline post.
    """

    pass


class UpdateTimelinePostRequest(BaseModel):
    """
    Request body for updating a timeline post.
    """

    title: Optional[str] = None
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None


# =========================
# Public response models
# =========================


class TimelinePostPublic(BaseModel):
    """
    Public representation of a timeline post.
    """

    id: str
    project_id: str

    title: str
    content: str
    media_urls: List[str]

    created_at: str
    updated_at: Optional[str] = None


# =========================
# List / pagination
# =========================


class TimelinePostsListResponse(BaseModel):
    """
    Paginated response for timeline feed.
    """

    items: List[TimelinePostPublic]
    total: int
    page: int
    page_size: int
