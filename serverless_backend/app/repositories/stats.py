"""Platform-wide counters, maintained by the writes that change them."""

from app.db import keys
from app.db.table import Item, get_table


def get() -> Item:
    return get_table().get(*keys.STATS) or {}
