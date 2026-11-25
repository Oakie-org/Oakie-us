"""Profiles, the talent directory and the follow graph."""

from app.core.errors import BadRequest, Conflict, NotFound
from app.core.ids import now_iso
from app.core.security import Principal
from app.db.table import Item
from app.models.common import CursorPage
from app.models.user import UserPrivate, UserPublic, UserSummary, UserUpdate
from app.repositories import projects as projects_repo
from app.repositories import users as users_repo
from app.services import notifications

_SCHOOL_SUFFIXES = (
    ".edu",
    ".edu.cn",
    ".edu.au",
    ".edu.hk",
    ".edu.sg",
    ".ac.uk",
    ".ac.jp",
    ".ac.kr",
)


def is_school_email(email: str | None) -> bool:
    """True for addresses on an academic domain. The identity provider has
    already confirmed the address belongs to the member before we see it."""
    domain = (email or "").rpartition("@")[2].strip().lower()
    return bool(domain) and (
        domain.endswith(_SCHOOL_SUFFIXES) or ".edu." in domain or ".ac." in domain
    )


def provision(user_id: str, email: str | None, name: str | None) -> Item:
    """Create the profile for a newly confirmed identity. Idempotent.

    Called by the Cognito PostConfirmation trigger, by local sign-up, and as a
    self-healing fallback the first time an unknown user hits the API.
    """
    profile = {
        "id": user_id,
        "email": email,
        "name": (name or (email or "").split("@")[0] or "New member")[:60],
        "headline": "",
        "bio": "",
        "city": "",
        "uni": "",
        "skills": [],
        "open_to": [],
        "website": "",
        "avatar_url": None,
        "banner_url": None,
        "num_projects": 0,
        "num_followers": 0,
        "num_following": 0,
        "links": [],
        "accent": "",
        "pinned_project_ids": [],
        "availability": "",
        "verified_school": is_school_email(email),
        "created_at": now_iso(),
    }
    if users_repo.create(profile):
        return profile
    return users_repo.get(user_id) or profile


def ensure_profile(principal: Principal) -> Item:
    return users_repo.get(principal.sub) or provision(
        principal.sub, principal.email, principal.name
    )


def get_me(principal: Principal) -> UserPrivate:
    profile = ensure_profile(principal)
    return UserPrivate(**profile, roles=[role.value for role in principal.roles])


def update_me(principal: Principal, payload: UserUpdate) -> UserPrivate:
    profile = ensure_profile(principal)
    fields = payload.model_dump(exclude_unset=True, exclude_none=True, mode="json")
    # Images are the one thing a member can clear by sending null.
    for image in ("avatar_url", "banner_url"):
        if image in payload.model_fields_set:
            fields[image] = getattr(payload, image)
    if "pinned_project_ids" in fields:
        mine = {m["project_id"] for m in projects_repo.memberships_of(principal.sub)}
        fields["pinned_project_ids"] = [
            pid for pid in dict.fromkeys(fields["pinned_project_ids"]) if pid in mine
        ]
    if fields:
        profile = users_repo.update(profile, fields)
    return UserPrivate(**profile, roles=[role.value for role in principal.roles])


def get_public(user_id: str, viewer: Principal | None) -> UserPublic:
    profile = users_repo.get(user_id)
    if not profile:
        raise NotFound("User not found")
    is_following = None
    if viewer and viewer.sub != user_id:
        is_following = users_repo.is_following(viewer.sub, user_id)
    return UserPublic(**profile, is_following=is_following)


def summaries(user_ids: list[str]) -> dict[str, UserSummary]:
    profiles = users_repo.get_many([uid for uid in user_ids if uid])
    return {uid: UserSummary(**profile) for uid, profile in profiles.items()}


def talent(
    *,
    q: str | None,
    skill: str | None,
    city: str | None,
    uni: str | None,
    open_to: str | None,
    limit: int,
    cursor: str | None,
) -> CursorPage[UserSummary]:
    needles = [value.strip().lower() for value in (q, city, uni) if value and value.strip()]
    skill_needle = skill.strip().lower() if skill else None
    open_needle = open_to.strip().lower() if open_to else None

    def matches(profile: Item) -> bool:
        text = profile.get("search_text", "")
        if any(needle not in text for needle in needles):
            return False
        if skill_needle and skill_needle not in (s.lower() for s in profile.get("skills") or []):
            return False
        if open_needle and open_needle not in (o.lower() for o in profile.get("open_to") or []):
            return False
        return True

    page = users_repo.list_page(limit, cursor, matches)
    return CursorPage(
        items=[UserSummary(**profile) for profile in page.items],
        next_cursor=page.next_cursor,
    )


def follow(principal: Principal, target_id: str) -> None:
    if target_id == principal.sub:
        raise BadRequest("You cannot follow yourself")
    if not users_repo.get(target_id):
        raise NotFound("User not found")
    me = ensure_profile(principal)
    try:
        users_repo.follow(principal.sub, target_id, now_iso())
    except Conflict:
        return  # already following
    notifications.push(
        target_id,
        kind="user.followed",
        title=f"{me['name']} started following you",
        link=f"/u/{principal.sub}",
        actor_id=principal.sub,
    )


def _ordered(user_ids: list[str]) -> list[UserSummary]:
    found = summaries(user_ids)
    return [found[uid] for uid in user_ids if uid in found]


def followers(user_id: str) -> list[UserSummary]:
    if not users_repo.get(user_id):
        raise NotFound("User not found")
    return _ordered(users_repo.follower_ids(user_id)[:200])


def following(user_id: str) -> list[UserSummary]:
    if not users_repo.get(user_id):
        raise NotFound("User not found")
    return _ordered(users_repo.following_ids(user_id)[:200])


def unfollow(principal: Principal, target_id: str) -> None:
    try:
        users_repo.unfollow(principal.sub, target_id)
    except Conflict:
        return  # was not following
