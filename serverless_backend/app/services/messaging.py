"""One-to-one conversations."""

from app.core.errors import BadRequest, NotFound
from app.core.ids import now_iso, sortable_id
from app.core.security import Principal
from app.db.table import Item
from app.models.social import ConversationPublic, ConversationThread, MessagePublic
from app.repositories import inbox as repo
from app.repositories import users as users_repo
from app.services import users


def _conversation(entry: Item, peers: dict) -> ConversationPublic | None:
    peer = peers.get(entry["peer_id"])
    return ConversationPublic(**entry, peer=peer) if peer else None


def list_conversations(principal: Principal) -> list[ConversationPublic]:
    entries = repo.list_entries(principal.sub)
    peers = users.summaries([entry["peer_id"] for entry in entries])
    conversations = (_conversation(entry, peers) for entry in entries)
    return [c for c in conversations if c]


def _send(principal: Principal, recipient_id: str, body: str) -> tuple[str, MessagePublic]:
    cid = repo.conversation_id(principal.sub, recipient_id)
    message = {
        "id": sortable_id(),
        "conversation_id": cid,
        "sender_id": principal.sub,
        "body": body.strip(),
        "created_at": now_iso(),
    }
    repo.append_message(cid, message, recipient_id)
    return cid, MessagePublic(**message)


def start(principal: Principal, recipient_id: str, body: str) -> ConversationPublic:
    """Message someone directly; reuses the existing thread with them if any."""
    if recipient_id == principal.sub:
        raise BadRequest("You cannot message yourself")
    if not users_repo.get(recipient_id):
        raise NotFound("User not found")
    users.ensure_profile(principal)
    cid, _ = _send(principal, recipient_id, body)
    entry = repo.get_entry(principal.sub, cid) or {}
    conversation = _conversation(entry, users.summaries([recipient_id]))
    if not conversation:
        raise NotFound("Conversation not found")
    return conversation


def _entry(principal: Principal, cid: str) -> Item:
    entry = repo.get_entry(principal.sub, cid)
    if not entry:
        raise NotFound("Conversation not found")
    return entry


def thread(principal: Principal, cid: str, limit: int, cursor: str | None) -> ConversationThread:
    """A page of messages, oldest first. The cursor pages further back in time."""
    entry = _entry(principal, cid)
    if entry.get("unread"):
        repo.mark_conversation_read(principal.sub, cid)
        entry["unread"] = 0
    conversation = _conversation(entry, users.summaries([entry["peer_id"]]))
    if not conversation:
        raise NotFound("Conversation not found")
    page = repo.list_messages(cid, limit, cursor)
    return ConversationThread(
        conversation=conversation,
        messages=[MessagePublic(**item) for item in reversed(page.items)],
        next_cursor=page.next_cursor,
    )


def send(principal: Principal, cid: str, body: str) -> MessagePublic:
    entry = _entry(principal, cid)
    _, message = _send(principal, entry["peer_id"], body)
    return message


def unread_total(principal: Principal) -> int:
    return sum(entry.get("unread", 0) for entry in repo.list_entries(principal.sub))
