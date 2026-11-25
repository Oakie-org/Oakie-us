"""Projects: publishing, discovery, access control, team and reactions."""

from collections import Counter
from datetime import UTC, datetime, timedelta
from typing import NamedTuple

from app.core.config import settings
from app.core.errors import BadRequest, Conflict, Forbidden, NotFound
from app.core.ids import new_id, now_iso, proof_code
from app.core.security import GlobalRole, Principal
from app.db.table import Item
from app.models.common import (
    ApplicationStatus,
    CursorPage,
    InvitationStatus,
    ProjectRole,
    ProjectStatus,
    ProjectVisibility,
)
from app.models.project import (
    FacetOption,
    InvitationPublic,
    MemberPublic,
    MemberUpdate,
    ProjectCreate,
    ProjectDetail,
    ProjectFacets,
    ProjectMembership,
    ProjectPublic,
    ProjectUpdate,
    ProjectViewer,
)
from app.repositories import projects as repo
from app.services import notifications, users

MANAGER_ROLES = (ProjectRole.OWNER, ProjectRole.ADMIN)


class ProjectAccess(NamedTuple):
    """A project together with the caller's standing in it."""

    project: Item
    viewer: Principal | None
    role: ProjectRole | None

    @property
    def is_member(self) -> bool:
        return self.role is not None

    @property
    def can_manage(self) -> bool:
        return self.role in MANAGER_ROLES or bool(self.viewer and self.viewer.is_admin)

    @property
    def sees_internals(self) -> bool:
        """Updates and applications of non-public projects are for the team."""
        public = self.project["visibility"] == ProjectVisibility.PUBLIC
        return public or self.is_member or bool(self.viewer and self.viewer.is_admin)

    def require_member(self) -> None:
        if not (self.is_member or (self.viewer and self.viewer.is_admin)):
            raise Forbidden("Only team members can do this")

    def require_manager(self) -> None:
        if not self.can_manage:
            raise Forbidden("Only the project owner or an admin can do this")


def load(project_id: str, viewer: Principal | None) -> ProjectAccess:
    """Fetch a project the caller may see. Private projects read as missing."""
    project = repo.get(project_id)
    if not project:
        raise NotFound("Project not found")
    member = repo.get_member(project_id, viewer.sub) if viewer else None
    role = ProjectRole(member["role"]) if member else None
    access = ProjectAccess(project, viewer, role)
    if project["visibility"] == ProjectVisibility.PRIVATE and not (
        access.is_member or (viewer and viewer.is_admin)
    ):
        raise NotFound("Project not found")
    return access


# ---------------------------------------------------------------- queries


class ProjectQuery(NamedTuple):
    """Every way the listing can be narrowed. One definition serves the list,
    the facet counts and search suggestions, so they can never disagree."""

    status: str | None = None
    category: str | None = None
    city: str | None = None
    uni: str | None = None
    tag: str | None = None
    q: str | None = None
    skill: str | None = None
    remote: bool | None = None
    open_only: bool = False
    within_days: int | None = None

    def matcher(self, *, ignore: str | None = None):
        """A predicate for these filters. `ignore` drops one facet, which is how
        a facet's own options are counted without it narrowing itself."""

        def want(name: str) -> str | None:
            value = None if name == ignore else getattr(self, name)
            return value.strip().lower() if isinstance(value, str) and value.strip() else None

        status, category = want("status"), want("category")
        city, uni, skill = want("city"), want("uni"), want("skill")
        needles = [needle for needle in (want("tag"), want("q")) if needle]
        cutoff = None
        if self.within_days:
            cutoff = (datetime.now(UTC) - timedelta(days=self.within_days)).isoformat(
                timespec="milliseconds"
            )

        def matches(project: Item) -> bool:
            if status and project["status"].lower() != status:
                return False
            if category and project["category"].lower() != category:
                return False
            if city and city not in (project.get("city") or "").lower():
                return False
            if uni and uni not in (project.get("uni") or "").lower():
                return False
            text = project.get("search_text", "")
            if any(needle not in text for needle in needles):
                return False
            if skill and skill not in _wanted_skills(project):
                return False
            if self.remote is not None and bool(project.get("remote_ok")) != self.remote:
                return False
            if self.open_only and not _is_open(project):
                return False
            if cutoff and project["created_at"] < cutoff:
                return False
            return True

        return matches


def _wanted_skills(project: Item) -> set[str]:
    return {
        skill.lower()
        for role in project.get("open_roles") or []
        for skill in role.get("skills") or []
    }


def _is_open(project: Item) -> bool:
    return (
        project["status"] != ProjectStatus.COMPLETED
        and project["current_members"] < project["max_members"]
    )


def list_projects(query: ProjectQuery, limit: int, cursor: str | None) -> CursorPage[ProjectPublic]:
    page = repo.list_page(limit, cursor, query.matcher())
    return CursorPage(
        items=[ProjectPublic(**item) for item in page.items], next_cursor=page.next_cursor
    )


def _tally(values: list[str], limit: int | None = None) -> list[FacetOption]:
    """Options by popularity, grouped case-insensitively under their commonest spelling."""
    spellings: dict[str, Counter[str]] = {}
    for value in values:
        if value and value.strip():
            spellings.setdefault(value.strip().lower(), Counter())[value.strip()] += 1
    options = [
        FacetOption(value=counts.most_common(1)[0][0], count=sum(counts.values()))
        for counts in spellings.values()
    ]
    options.sort(key=lambda option: (-option.count, option.value.lower()))
    return options[:limit] if limit else options


def facets(query: ProjectQuery) -> ProjectFacets:
    """Counts for each filter option, as if it were applied on top of the other
    active filters. A facet never narrows its own options, so alternatives to
    the current choice stay visible."""
    listed = repo.list_all()

    def pool(facet: str) -> list[Item]:
        return [project for project in listed if query.matcher(ignore=facet)(project)]

    return ProjectFacets(
        total=sum(1 for project in listed if query.matcher()(project)),
        category=_tally([p["category"] for p in pool("category")]),
        status=_tally([p["status"] for p in pool("status")]),
        skill=_tally(
            [
                skill
                for p in pool("skill")
                for skill in {
                    s for role in p.get("open_roles") or [] for s in role.get("skills") or []
                }
            ],
            limit=24,
        ),
        uni=_tally([p.get("uni") or "" for p in pool("uni")], limit=24),
        city=_tally([p.get("city") or "" for p in pool("city")], limit=24),
    )


def get_detail(project_id: str, viewer: Principal | None) -> ProjectDetail:
    access = load(project_id, viewer)
    project = access.project
    state = ProjectViewer(role=access.role)
    if viewer:
        state.has_liked = repo.has_reaction(project_id, "LIKE", viewer.sub)
        state.is_following = repo.has_reaction(project_id, "FOLLOW", viewer.sub)
        application = repo.get_application(project_id, viewer.sub)
        state.application_status = ApplicationStatus(application["status"]) if application else None
        invitation = repo.get_invitation(project_id, viewer.sub)
        if invitation and invitation["status"] == InvitationStatus.PENDING and not access.role:
            inviter = users.summaries([invitation["inviter_id"]]).get(invitation["inviter_id"])
            state.invitation = InvitationPublic(
                **invitation, inviter=inviter, project_title=project["title"]
            )
    owner = users.summaries([project["owner_id"]]).get(project["owner_id"])
    return ProjectDetail(**project, owner=owner, viewer=state)


def projects_of(user_id: str, viewer: Principal | None) -> list[ProjectMembership]:
    """Projects a user owns or has joined, newest membership first."""
    memberships = repo.memberships_of(user_id)
    found = repo.get_many([m["project_id"] for m in memberships])
    sees_private = bool(viewer and (viewer.sub == user_id or viewer.is_admin))
    result = []
    for membership in memberships:
        project = found.get(membership["project_id"])
        if not project:
            continue
        if project["visibility"] == ProjectVisibility.PRIVATE and not sees_private:
            continue
        result.append(
            ProjectMembership(
                **project, role=membership["role"], member_title=membership.get("title", "")
            )
        )
    return result


def following(principal: Principal) -> list[ProjectPublic]:
    found = repo.get_many(repo.followed_project_ids(principal.sub))
    return [ProjectPublic(**item) for item in found.values()]


# --------------------------------------------------------------- commands


def create(principal: Principal, payload: ProjectCreate) -> ProjectPublic:
    minimum = GlobalRole(settings.PROJECT_CREATION_MIN_ROLE)
    if not principal.has_at_least(minimum):
        raise Forbidden(f"Publishing projects requires the '{minimum.value}' role")
    users.ensure_profile(principal)

    now = now_iso()
    project = {
        **payload.model_dump(mode="json"),
        "id": new_id(),
        "owner_id": principal.sub,
        "current_members": 1,
        "likes": 0,
        "follows": 0,
        "priority": 0,
        "created_at": now,
        "updated_at": now,
    }
    owner = {
        "user_id": principal.sub,
        "role": ProjectRole.OWNER.value,
        "title": "Founder",
        "joined_at": now,
        "proof_code": proof_code(),
    }
    repo.create(project, owner)
    return ProjectPublic(**project)


def update(project_id: str, principal: Principal, payload: ProjectUpdate) -> ProjectPublic:
    access = load(project_id, principal)
    access.require_manager()
    fields = payload.model_dump(mode="json", exclude_unset=True)
    for required in ("title", "description", "category", "status", "visibility", "max_members"):
        if fields.get(required, "") is None:
            raise BadRequest(f"{required} cannot be empty")
    seats = fields.get("max_members")
    if seats is not None and seats < access.project["current_members"]:
        raise BadRequest("Team size cannot be smaller than the current team")
    if not fields:
        return ProjectPublic(**access.project)
    fields["updated_at"] = now_iso()
    return ProjectPublic(**repo.update(access.project, fields))


def delete(project_id: str, principal: Principal) -> None:
    access = load(project_id, principal)
    if access.role != ProjectRole.OWNER and not principal.is_admin:
        raise Forbidden("Only the project owner can delete it")
    repo.delete(project_id)


def set_reaction(project_id: str, principal: Principal, kind: str, active: bool) -> None:
    """Like or follow (`kind` is LIKE or FOLLOW). Idempotent in both directions."""
    access = load(project_id, principal)
    try:
        if active:
            repo.add_reaction(project_id, kind, principal.sub, now_iso())
        else:
            repo.remove_reaction(project_id, kind, principal.sub)
    except Conflict:
        return  # already in the requested state
    if active and kind == "FOLLOW":
        me = users.ensure_profile(principal)
        notifications.push(
            access.project["owner_id"],
            kind="project.followed",
            title=f"{me['name']} is following {access.project['title']}",
            link=f"/projects/{project_id}",
            actor_id=principal.sub,
        )


# ------------------------------------------------------------------- team


def list_members(project_id: str, viewer: Principal | None) -> list[MemberPublic]:
    load(project_id, viewer)
    members = repo.list_members(project_id)
    people = users.summaries([m["user_id"] for m in members])
    rank = {ProjectRole.OWNER: 0, ProjectRole.ADMIN: 1, ProjectRole.MEMBER: 2}
    members.sort(key=lambda m: (rank[ProjectRole(m["role"])], m["joined_at"]))
    return [
        MemberPublic(
            user=people[m["user_id"]],
            role=m["role"],
            title=m.get("title", ""),
            joined_at=m["joined_at"],
        )
        for m in members
        if m["user_id"] in people
    ]


def update_member(
    project_id: str, user_id: str, principal: Principal, payload: MemberUpdate
) -> None:
    access = load(project_id, principal)
    member = repo.get_member(project_id, user_id)
    if not member:
        raise NotFound("Member not found")
    fields = payload.model_dump(mode="json", exclude_unset=True, exclude_none=True)
    if "role" in fields:
        if access.role != ProjectRole.OWNER and not principal.is_admin:
            raise Forbidden("Only the project owner can change roles")
        if ProjectRole.OWNER in (member["role"], fields["role"]):
            raise BadRequest("Ownership cannot be reassigned here")
    elif user_id != principal.sub:
        access.require_manager()
    else:
        access.require_member()
    if fields:
        repo.update_member(project_id, user_id, fields)


def remove_member(project_id: str, user_id: str, principal: Principal) -> None:
    """Managers remove teammates; any non-owner member may leave."""
    access = load(project_id, principal)
    member = repo.get_member(project_id, user_id)
    if not member:
        raise NotFound("Member not found")
    if member["role"] == ProjectRole.OWNER:
        raise BadRequest("The owner cannot leave their own project")
    if user_id != principal.sub:
        access.require_manager()
    repo.remove_member(project_id, member)
    if user_id != principal.sub:
        notifications.push(
            user_id,
            kind="member.removed",
            title=f"You were removed from {access.project['title']}",
            link=f"/projects/{project_id}",
            actor_id=principal.sub,
        )
