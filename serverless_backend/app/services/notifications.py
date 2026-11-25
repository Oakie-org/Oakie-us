"""Activity feed.

`push` is the single place domain events become notifications. It runs inline
today; it is also the seam where an EventBridge publish would go once fan-out
needs to leave the request path.
"""

import logging

from app.core.ids import now_iso, sortable_id
from app.models.social import NotificationList, NotificationPublic
from app.models.user import UserSummary
from app.repositories import inbox as inbox_repo
from app.repositories import users as users_repo

logger = logging.getLogger(__name__)


def push(
    user_id: str,
    *,
    kind: str,
    title: str,
    body: str = "",
    link: str = "",
    actor_id: str | None = None,
) -> None:
    """Best effort: a failed notification must never fail the action behind it."""
    if actor_id == user_id:
        return
    try:
        inbox_repo.put_notification(
            user_id,
            {
                "id": sortable_id(),
                "kind": kind,
                "title": title,
                "body": body,
                "link": link,
                "actor_id": actor_id,
                "read": False,
                "created_at": now_iso(),
            },
        )
    except Exception:
        logger.exception("Failed to notify %s about %s", user_id, kind)


def list_for(user_id: str, limit: int, cursor: str | None) -> NotificationList:
    page = inbox_repo.list_notifications(user_id, limit, cursor)
    actor_ids = [item["actor_id"] for item in page.items if item.get("actor_id")]
    actors = {
        uid: UserSummary(**profile) for uid, profile in users_repo.get_many(actor_ids).items()
    }
    return NotificationList(
        items=[
            NotificationPublic(**item, actor=actors.get(item.get("actor_id")))
            for item in page.items
        ],
        unread_count=inbox_repo.count_unread_notifications(user_id),
        next_cursor=page.next_cursor,
    )


def mark_read(user_id: str, ids: list[str] | None) -> int:
    unread = set(inbox_repo.unread_notification_ids(user_id))
    targets = unread if ids is None else unread & set(ids)
    for notification_id in targets:
        inbox_repo.mark_notification_read(user_id, notification_id)
    return len(targets)
