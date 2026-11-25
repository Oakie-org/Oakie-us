"""Join requests: apply, review, withdraw."""

from app.core.errors import BadRequest, Conflict, NotFound
from app.core.ids import now_iso, proof_code
from app.core.security import Principal
from app.db.table import Item
from app.models.common import ApplicationStatus, ProjectRole, ProjectStatus
from app.models.project import ApplicationCreate, ApplicationPublic
from app.repositories import projects as repo
from app.services import notifications, projects, users


def apply(project_id: str, principal: Principal, payload: ApplicationCreate) -> ApplicationPublic:
    access = projects.load(project_id, principal)
    project = access.project
    if access.is_member:
        raise Conflict("You are already on this team")
    if project["status"] == ProjectStatus.COMPLETED:
        raise BadRequest("This project is completed and no longer recruiting")
    if project["current_members"] >= project["max_members"]:
        raise BadRequest("This team is full")
    existing = repo.get_application(project_id, principal.sub)
    if existing and existing["status"] == ApplicationStatus.PENDING:
        raise Conflict("You already have a pending application")

    me = users.ensure_profile(principal)
    application = {
        "project_id": project_id,
        "applicant_id": principal.sub,
        "status": ApplicationStatus.PENDING.value,
        "message": payload.message,
        "role_title": payload.role_title,
        "created_at": now_iso(),
        "decided_at": None,
    }
    repo.put_application(application)
    if not existing:
        repo.count_application()
    notifications.push(
        project["owner_id"],
        kind="application.received",
        title=f"{me['name']} applied to join {project['title']}",
        body=payload.message[:140],
        link=f"/projects/{project_id}?tab=applications",
        actor_id=principal.sub,
    )
    return ApplicationPublic(**application, project_title=project["title"])


def list_for_project(project_id: str, principal: Principal) -> list[ApplicationPublic]:
    access = projects.load(project_id, principal)
    access.require_manager()
    applications = repo.list_applications(project_id)
    applications.sort(key=lambda a: a["created_at"], reverse=True)
    people = users.summaries([a["applicant_id"] for a in applications])
    return [
        ApplicationPublic(
            **a, applicant=people.get(a["applicant_id"]), project_title=access.project["title"]
        )
        for a in applications
    ]


def list_mine(principal: Principal) -> list[ApplicationPublic]:
    applications = repo.applications_of(principal.sub)
    found = repo.get_many([a["project_id"] for a in applications])
    return [
        ApplicationPublic(**a, project_title=found[a["project_id"]]["title"])
        for a in applications
        if a["project_id"] in found
    ]


def _pending(project_id: str, applicant_id: str) -> Item:
    application = repo.get_application(project_id, applicant_id)
    if not application:
        raise NotFound("Application not found")
    if application["status"] != ApplicationStatus.PENDING:
        raise Conflict("This application has already been resolved")
    return application


def decide(
    project_id: str, applicant_id: str, principal: Principal, approve: bool
) -> ApplicationPublic:
    access = projects.load(project_id, principal)
    access.require_manager()
    application = _pending(project_id, applicant_id)
    project = access.project
    now = now_iso()

    if approve:
        try:
            repo.add_member(
                project_id,
                {
                    "user_id": applicant_id,
                    "role": ProjectRole.MEMBER.value,
                    "title": application.get("role_title", ""),
                    "joined_at": now,
                    "proof_code": proof_code(),
                },
            )
        except Conflict as exc:
            raise Conflict("The team is full or this person already joined") from exc

    status = ApplicationStatus.APPROVED if approve else ApplicationStatus.REJECTED
    updated = repo.update_application(
        project_id, applicant_id, {"status": status.value, "decided_at": now}
    )
    notifications.push(
        applicant_id,
        kind=f"application.{status.value}",
        title=(
            f"You're in! Welcome to {project['title']}"
            if approve
            else f"Your application to {project['title']} was not accepted"
        ),
        link=f"/projects/{project_id}",
        actor_id=principal.sub,
    )
    return ApplicationPublic(**(updated or application), project_title=project["title"])


def withdraw(project_id: str, principal: Principal) -> None:
    _pending(project_id, principal.sub)
    repo.update_application(
        project_id,
        principal.sub,
        {"status": ApplicationStatus.WITHDRAWN.value, "decided_at": now_iso()},
    )
