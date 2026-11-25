"""User profiles and the follow graph."""

from collections.abc import Callable

from app.core.errors import Conflict
from app.db import keys
from app.db.schema import GSI1, GSI2
from app.db.table import Item, Page, get_table

_SEARCHABLE = ("name", "headline", "city", "uni")


def _search_text(profile: Item) -> str:
    parts = [str(profile.get(field) or "") for field in _SEARCHABLE]
    parts += profile.get("skills") or []
    parts += profile.get("open_to") or []
    return " ".join(parts).lower()


def get(user_id: str) -> Item | None:
    return get_table().get(keys.user(user_id), keys.PROFILE)


def get_many(user_ids: list[str]) -> dict[str, Item]:
    found = get_table().batch_get([(keys.user(uid), keys.PROFILE) for uid in user_ids])
    return {item["id"]: item for item in found.values()}


def create(profile: Item) -> bool:
    """Insert a profile. Returns False when one already exists."""
    table = get_table()
    item = {
        **profile,
        "PK": keys.user(profile["id"]),
        "SK": keys.PROFILE,
        "type": "USER",
        "gsi1_pk": keys.ALL_USERS,
        "gsi1_sk": f"{profile['created_at']}#{profile['id']}",
        "search_text": _search_text(profile),
    }
    try:
        table.put(item, unless_exists=True)
    except Conflict:
        return False
    table.update(*keys.STATS, add={"members": 1}, must_exist=False)
    return True


def update(current: Item, fields: Item) -> Item:
    merged = {**current, **fields}
    updated = get_table().update(
        keys.user(current["id"]),
        keys.PROFILE,
        set_={**fields, "search_text": _search_text(merged)},
    )
    return updated or merged


def list_page(limit: int, cursor: str | None, predicate: Callable[[Item], bool] | None) -> Page:
    return get_table().query_page(
        keys.ALL_USERS, index=GSI1, forward=False, limit=limit, cursor=cursor, predicate=predicate
    )


# ------------------------------------------------------------ follow graph


def is_following(follower_id: str, target_id: str) -> bool:
    return get_table().get(keys.user(target_id), f"FOLLOWER#{follower_id}") is not None


def follow(follower_id: str, target_id: str, created_at: str) -> None:
    table = get_table()
    table.transact(
        [
            table.tx_put(
                {
                    "PK": keys.user(target_id),
                    "SK": f"FOLLOWER#{follower_id}",
                    "type": "USER_FOLLOW",
                    "follower_id": follower_id,
                    "target_id": target_id,
                    "created_at": created_at,
                    "gsi2_pk": keys.user(follower_id),
                    "gsi2_sk": f"FOLLOWING#{created_at}#{target_id}",
                },
                unless_exists=True,
            ),
            table.tx_update(keys.user(target_id), keys.PROFILE, add={"num_followers": 1}),
            table.tx_update(keys.user(follower_id), keys.PROFILE, add={"num_following": 1}),
        ]
    )


def unfollow(follower_id: str, target_id: str) -> None:
    table = get_table()
    table.transact(
        [
            table.tx_delete(keys.user(target_id), f"FOLLOWER#{follower_id}", must_exist=True),
            table.tx_update(keys.user(target_id), keys.PROFILE, add={"num_followers": -1}),
            table.tx_update(keys.user(follower_id), keys.PROFILE, add={"num_following": -1}),
        ]
    )


def follower_ids(user_id: str) -> list[str]:
    items = get_table().query_all(keys.user(user_id), "FOLLOWER#", forward=False)
    items.sort(key=lambda item: item["created_at"], reverse=True)
    return [item["follower_id"] for item in items]


def following_ids(user_id: str) -> list[str]:
    items = get_table().query_all(keys.user(user_id), "FOLLOWING#", index=GSI2, forward=False)
    return [item["target_id"] for item in items]
