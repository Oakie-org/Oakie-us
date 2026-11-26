"""The team's collaboration space: timeline updates, the task board and the
contribution records derived from them."""

from app.core.errors import BadRequest, Forbidden, NotFound
from app.core.ids import now_iso, sortable_id
from app.core.security import Principal
from app.db.table import Item
from app.models.common import CursorPage, ProjectVisibility, TaskStatus
from app.models.project import (
    ContributionRecord,
    TaskCreate,
    TaskPublic,
    TaskUpdate,
    TimelinePostCreate,
    TimelinePostPublic,
    TimelinePostUpdate,
)
from app.models.user import UserSummary
from app.repositories import projects as repo
from app.repositories import users as users_repo
from app.services import notifications, platform, projects, users

# --------------------------------------------------------------- timeline


def list_posts(
    project_id: str, viewer: Principal | None, limit: int, cursor: str | None
) -> CursorPage[TimelinePostPublic]:
    access = projects.load(project_id, viewer)
    if not access.sees_internals:
        return CursorPage(items=[])
    page = repo.list_posts(project_id, limit, cursor)
    authors = users.summaries([post["author_id"] for post in page.items])
    return CursorPage(
        items=[
            TimelinePostPublic(**post, author=authors.get(post["author_id"])) for post in page.items
        ],
        next_cursor=page.next_cursor,
    )


def create_post(
    project_id: str, principal: Principal, payload: TimelinePostCreate
) -> TimelinePostPublic:
    access = projects.load(project_id, principal)
    access.require_member()
    for url in payload.media_urls:
        platform.require_own_upload(principal.sub, url, "timeline_media")
    now = now_iso()
    post = {
        **payload.model_dump(mode="json"),
        "id": sortable_id(),
        "project_id": project_id,
        "author_id": principal.sub,
        "created_at": now,
        "updated_at": now,
    }
    repo.put_post(post)

    project = access.project
    if project["visibility"] == ProjectVisibility.PUBLIC:
        for follower_id in repo.follower_ids(project_id):
            notifications.push(
                follower_id,
                kind="project.update",
                title=f"{project['title']} posted: {payload.title}",
                link=f"/projects/{project_id}?tab=updates",
                actor_id=principal.sub,
            )
    author = users.summaries([principal.sub]).get(principal.sub)
    return TimelinePostPublic(**post, author=author)


def _editable_post(project_id: str, post_id: str, principal: Principal) -> Item:
    access = projects.load(project_id, principal)
    post = repo.get_post(project_id, post_id)
    if not post:
        raise NotFound("Post not found")
    if post["author_id"] != principal.sub and not access.can_manage:
        raise Forbidden("Only the author or a project admin can change this post")
    return post


def update_post(
    project_id: str, post_id: str, principal: Principal, payload: TimelinePostUpdate
) -> TimelinePostPublic:
    post = _editable_post(project_id, post_id, principal)
    fields = payload.model_dump(mode="json", exclude_unset=True, exclude_none=True)
    for url in fields.get("media_urls", []):
        if url not in (post.get("media_urls") or []):
            platform.require_own_upload(principal.sub, url, "timeline_media")
    if fields:
        fields["updated_at"] = now_iso()
        post = repo.update_post(project_id, post_id, fields) or post
    author = users.summaries([post["author_id"]]).get(post["author_id"])
    return TimelinePostPublic(**post, author=author)


def delete_post(project_id: str, post_id: str, principal: Principal) -> None:
    _editable_post(project_id, post_id, principal)
    repo.delete_post(project_id, post_id)


# ------------------------------------------------------------------ tasks


def _hydrate_tasks(tasks: list[Item]) -> list[TaskPublic]:
    people = users.summaries([task["assignee_id"] for task in tasks if task.get("assignee_id")])
    return [TaskPublic(**task, assignee=people.get(task.get("assignee_id"))) for task in tasks]


def _check_assignee(project_id: str, assignee_id: str | None) -> None:
    if assignee_id and not repo.get_member(project_id, assignee_id):
        raise BadRequest("Tasks can only be assigned to team members")


def _notify_assignee(task: Item, project: Item, principal: Principal) -> None:
    if task.get("assignee_id"):
        notifications.push(
            task["assignee_id"],
            kind="task.assigned",
            title=f"New task in {project['title']}: {task['title']}",
            link=f"/projects/{project['id']}?tab=board",
            actor_id=principal.sub,
        )


def list_tasks(project_id: str, principal: Principal) -> list[TaskPublic]:
    projects.load(project_id, principal).require_member()
    return _hydrate_tasks(repo.list_tasks(project_id))


def create_task(project_id: str, principal: Principal, payload: TaskCreate) -> TaskPublic:
    access = projects.load(project_id, principal)
    access.require_member()
    _check_assignee(project_id, payload.assignee_id)
    now = now_iso()
    task = {
        **payload.model_dump(mode="json"),
        "id": sortable_id(),
        "project_id": project_id,
        "created_by": principal.sub,
        "created_at": now,
        "updated_at": now,
        "completed_at": now if payload.status == TaskStatus.DONE else None,
    }
    repo.put_task(task)
    _notify_assignee(task, access.project, principal)
    return _hydrate_tasks([task])[0]


def update_task(
    project_id: str, task_id: str, principal: Principal, payload: TaskUpdate
) -> TaskPublic:
    access = projects.load(project_id, principal)
    access.require_member()
    task = repo.get_task(project_id, task_id)
    if not task:
        raise NotFound("Task not found")

    fields = payload.model_dump(mode="json", exclude_unset=True)
    if fields.get("title", "") is None or fields.get("status", "") is None:
        raise BadRequest("title and status cannot be empty")
    reassigned = "assignee_id" in fields and fields["assignee_id"] != task.get("assignee_id")
    if reassigned:
        _check_assignee(project_id, fields["assignee_id"])
    if "status" in fields and fields["status"] != task["status"]:
        fields["completed_at"] = now_iso() if fields["status"] == TaskStatus.DONE else None

    task = {**task, **fields, "updated_at": now_iso()}
    repo.put_task(task)
    if reassigned:
        _notify_assignee(task, access.project, principal)
    return _hydrate_tasks([task])[0]


def delete_task(project_id: str, task_id: str, principal: Principal) -> None:
    projects.load(project_id, principal).require_member()
    repo.delete_task(project_id, task_id)


# ---------------------------------------------------------- contributions


def _record(member: Item, project: Item, profile: Item, tasks: list[Item]) -> ContributionRecord:
    mine = [t for t in tasks if t["project_id"] == project["id"]]
    return ContributionRecord(
        code=member["proof_code"],
        member=UserSummary(**profile),
        project_id=project["id"],
        project_title=project["title"],
        project_category=project["category"],
        project_status=project["status"],
        role=member["role"],
        title=member.get("title", ""),
        joined_at=member["joined_at"],
        tasks_assigned=len(mine),
        tasks_completed=sum(1 for t in mine if t["status"] == TaskStatus.DONE),
    )


def contributions_of(user_id: str, viewer: Principal | None) -> list[ContributionRecord]:
    """One verifiable record per project the user has been part of."""
    profile = users_repo.get(user_id)
    if not profile:
        raise NotFound("User not found")
    memberships = repo.memberships_of(user_id)
    found = repo.get_many([m["project_id"] for m in memberships])
    tasks = repo.tasks_assigned_to(user_id) if memberships else []
    sees_private = bool(viewer and (viewer.sub == user_id or viewer.is_admin))
    return [
        _record(member, found[member["project_id"]], profile, tasks)
        for member in memberships
        if member["project_id"] in found
        and (sees_private or found[member["project_id"]]["visibility"] != ProjectVisibility.PRIVATE)
    ]


def verify_contribution(code: str) -> ContributionRecord:
    """Look a record up by its code. Anyone holding the code may verify it."""
    proof = repo.get_proof(code.strip())
    if not proof:
        raise NotFound("No contribution record matches this code")
    member = repo.get_member(proof["project_id"], proof["user_id"])
    project = repo.get(proof["project_id"])
    profile = users_repo.get(proof["user_id"])
    if not (member and project and profile):
        raise NotFound("No contribution record matches this code")
    return _record(member, project, profile, repo.tasks_assigned_to(proof["user_id"]))
