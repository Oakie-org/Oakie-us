"""Per-user collections: notifications and direct-message conversations."""

import hashlib

from boto3.dynamodb.conditions import Attr

from app.db import keys
from app.db.schema import GSI2
from app.db.table import Item, Page, get_table

# ---------------------------------------------------------- notifications


def put_notification(user_id: str, notification: Item) -> None:
    get_table().put(
        {
            **notification,
            "PK": keys.user(user_id),
            "SK": f"NOTIF#{notification['id']}",
            "type": "NOTIFICATION",
        }
    )


def list_notifications(user_id: str, limit: int, cursor: str | None) -> Page:
    return get_table().query_page(
        keys.user(user_id), "NOTIF#", forward=False, limit=limit, cursor=cursor
    )


def unread_notification_ids(user_id: str) -> list[str]:
    items = get_table().query_all(
        keys.user(user_id), "NOTIF#", filter_expression=Attr("read").eq(False)
    )
    return [item["id"] for item in items]


def count_unread_notifications(user_id: str) -> int:
    return get_table().count(keys.user(user_id), "NOTIF#", filter_expression=Attr("read").eq(False))


def mark_notification_read(user_id: str, notification_id: str) -> None:
    get_table().update(keys.user(user_id), f"NOTIF#{notification_id}", set_={"read": True})


# ---------------------------------------------------------- conversations


def conversation_id(user_a: str, user_b: str) -> str:
    """Stable id for the pair, so two people always share one thread."""
    pair = ":".join(sorted((user_a, user_b)))
    return hashlib.sha256(pair.encode()).hexdigest()[:24]


def get_entry(user_id: str, cid: str) -> Item | None:
    return get_table().get(keys.user(user_id), f"CONV#{cid}")


def list_entries(user_id: str) -> list[Item]:
    return get_table().query_all(keys.user(user_id), "CONV#", index=GSI2, forward=False)


def append_message(cid: str, message: Item, recipient_id: str) -> None:
    """Store a message and refresh both participants' inbox entries."""
    table = get_table()
    sender_id = message["sender_id"]
    preview = message["body"][:140]

    def entry(owner_id: str, peer_id: str, unread: int) -> dict:
        return table.tx_update(
            keys.user(owner_id),
            f"CONV#{cid}",
            set_={
                "type": "INBOX_ENTRY",
                "id": cid,
                "peer_id": peer_id,
                "last_message": preview,
                "last_sender_id": sender_id,
                "last_at": message["created_at"],
                "gsi2_pk": keys.user(owner_id),
                "gsi2_sk": f"CONV#{message['created_at']}",
            },
            add={"unread": unread},
            condition=None,
        )

    table.transact(
        [
            table.tx_put(
                {
                    **message,
                    "PK": keys.conversation(cid),
                    "SK": f"MSG#{message['id']}",
                    "type": "MESSAGE",
                }
            ),
            entry(sender_id, recipient_id, 0),
            entry(recipient_id, sender_id, 1),
        ]
    )


def list_messages(cid: str, limit: int, cursor: str | None) -> Page:
    return get_table().query_page(
        keys.conversation(cid), "MSG#", forward=False, limit=limit, cursor=cursor
    )


def mark_conversation_read(user_id: str, cid: str) -> None:
    get_table().update(keys.user(user_id), f"CONV#{cid}", set_={"unread": 0})
