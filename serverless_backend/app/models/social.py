from pydantic import BaseModel, Field

from app.models.user import UserSummary


class NotificationPublic(BaseModel):
    id: str
    kind: str
    title: str
    body: str = ""
    link: str = ""
    actor: UserSummary | None = None
    read: bool = False
    created_at: str


class NotificationList(BaseModel):
    items: list[NotificationPublic]
    unread_count: int
    next_cursor: str | None = None


class NotificationsRead(BaseModel):
    """Mark the given notifications read; omit `ids` to mark everything."""

    ids: list[str] | None = Field(default=None, max_length=100)


class ConversationStart(BaseModel):
    recipient_id: str
    body: str = Field(min_length=1, max_length=4000)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class MessagePublic(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    body: str
    created_at: str


class ConversationPublic(BaseModel):
    id: str
    peer: UserSummary
    last_message: str = ""
    last_sender_id: str | None = None
    last_at: str = ""
    unread: int = 0


class ConversationThread(BaseModel):
    conversation: ConversationPublic
    messages: list[MessagePublic]
    next_cursor: str | None = None


class ProjectHit(BaseModel):
    id: str
    title: str
    subtitle: str = ""
    category: str = ""
    status: str = ""


class SearchSuggestions(BaseModel):
    """Typeahead results: a few of each kind, never a full result list."""

    projects: list[ProjectHit]
    people: list[UserSummary]
    skills: list[str]


class StatsOverview(BaseModel):
    projects: int = 0
    members: int = 0
    teammates_matched: int = 0
    applications: int = 0


class Catalog(BaseModel):
    """Option lists the client uses to build forms and filters."""

    categories: list[str]
    skills: list[str]
    statuses: list[str]
    open_to: list[str]
    availability: list[str]


class SignRequest(BaseModel):
    file_type: str
    purpose: str


class SignResponse(BaseModel):
    url: str
    fields: dict[str, str]
    public_url: str
    max_bytes: int
