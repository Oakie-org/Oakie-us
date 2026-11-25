"""Key builders for the single-table layout described in `schema.py`."""

PROFILE = "PROFILE"
METADATA = "METADATA"

# GSI1 partitions: one per globally-listable entity type.
ALL_USERS = "USER"
ALL_PROJECTS = "PROJECT"

STATS = ("STATS", "GLOBAL")


def user(user_id: str) -> str:
    return f"USER#{user_id}"


def project(project_id: str) -> str:
    return f"PROJECT#{project_id}"


def conversation(conversation_id: str) -> str:
    return f"CONV#{conversation_id}"


def proof(code: str) -> tuple[str, str]:
    return (f"PROOF#{code.upper()}", "PROOF")


def credential(email: str) -> tuple[str, str]:
    return (f"CRED#{email.strip().lower()}", "CRED")


def project_listing_sk(priority: int, created_at: str, project_id: str) -> str:
    """Sorts featured (higher priority) first, then newest, when read descending."""
    return f"{priority:04d}#{created_at}#{project_id}"
