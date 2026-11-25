"""Identifier and timestamp helpers."""

import secrets
import time
from datetime import UTC, datetime
from uuid import uuid4

_PROOF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds")


def new_id() -> str:
    return str(uuid4())


def sortable_id() -> str:
    """Time-ordered id: lexicographic order == creation order."""
    return f"{time.time_ns() // 1_000_000:013d}-{secrets.token_hex(4)}"


def proof_code() -> str:
    """Human-typable code for a contribution record, e.g. OAK-7KQ2-M9XD."""
    chars = [secrets.choice(_PROOF_ALPHABET) for _ in range(8)]
    return f"OAK-{''.join(chars[:4])}-{''.join(chars[4:])}"
