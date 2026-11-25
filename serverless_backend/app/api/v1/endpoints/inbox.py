"""The signed-in member's inbox: notifications and direct messages."""

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel

from app.core.security import Principal, get_current_user
from app.models.social import (
    ConversationPublic,
    ConversationStart,
    ConversationThread,
    MessageCreate,
    MessagePublic,
    NotificationList,
    NotificationsRead,
)
from app.repositories import inbox as inbox_repo
from app.services import messaging, notifications

router = APIRouter()


class InboxSummary(BaseModel):
    unread_notifications: int
    unread_messages: int


@router.get("/inbox/summary", response_model=InboxSummary)
def inbox_summary(user: Principal = Depends(get_current_user)):
    """Badge counts for the navigation bar."""
    return InboxSummary(
        unread_notifications=inbox_repo.count_unread_notifications(user.sub),
        unread_messages=messaging.unread_total(user),
    )


@router.get("/notifications", response_model=NotificationList)
def list_notifications(
    cursor: str | None = None,
    limit: int = Query(30, ge=1, le=50),
    user: Principal = Depends(get_current_user),
):
    return notifications.list_for(user.sub, limit, cursor)


@router.post("/notifications/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notifications_read(
    payload: NotificationsRead, user: Principal = Depends(get_current_user)
):
    notifications.mark_read(user.sub, payload.ids)


@router.get("/conversations", response_model=list[ConversationPublic])
def list_conversations(user: Principal = Depends(get_current_user)):
    return messaging.list_conversations(user)


@router.post("/conversations", response_model=ConversationPublic, status_code=201)
def start_conversation(payload: ConversationStart, user: Principal = Depends(get_current_user)):
    return messaging.start(user, payload.recipient_id, payload.body)


@router.get("/conversations/{conversation_id}", response_model=ConversationThread)
def read_conversation(
    conversation_id: str,
    cursor: str | None = None,
    limit: int = Query(40, ge=1, le=100),
    user: Principal = Depends(get_current_user),
):
    """Messages oldest-first; also marks the conversation read."""
    return messaging.thread(user, conversation_id, limit, cursor)


@router.post(
    "/conversations/{conversation_id}/messages", response_model=MessagePublic, status_code=201
)
def send_message(
    conversation_id: str, payload: MessageCreate, user: Principal = Depends(get_current_user)
):
    return messaging.send(user, conversation_id, payload.body)
