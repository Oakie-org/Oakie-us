"""Invitations: a team asks a specific person to join, and they answer."""

from app.core.errors import BadRequest, Conflict, NotFound
from app.core.ids import now_iso, proof_code
from app.core.security import Principal
from app.db.table import Item
from app.models.common import ApplicationStatus, InvitationStatus, ProjectRole, ProjectStatus
from app.models.project import InvitationCreate, InvitationPublic
from app.repositories import projects as repo
from app.repositories import users as users_repo
from app.services import notifications, projects, users


def invite(project_id: str, principal: Principal, payload: InvitationCreate) -> InvitationPublic:
    access = projects.load(project_id, principal)
    access.require_manager()
    project = access.project
    invitee_id = payload.user_id
    if invitee_id == principal.sub:
        raise BadRequest("You are already on this team")
    if not users_repo.get(invitee_id):
        raise NotFound("User not found")
    if repo.get_member(project_id, invitee_id):
        raise Conflict("They are already on this team")
    if project["status"] == ProjectStatus.COMPLETED:
        raise BadRequest("This project is completed")
    if project["current_members"] >= project["max_members"]:
        raise BadRequest("This team is full. Raise the team size to invite more people")
    application = repo.get_application(project_id, invitee_id)
    if application and application["status"] == ApplicationStatus.PENDING:
        raise Conflict("They already applied. Approve their application instead")
    existing = repo.get_invitation(project_id, invitee_id)
    if existing and existing["status"] == InvitationStatus.PENDING:
        raise Conflict("They already have a pending invitation")

    me = users.ensure_profile(principal)
    invitation = {
        "project_id": project_id,
        "invitee_id": invitee_id,
        "inviter_id": principal.sub,
        "status": InvitationStatus.PENDING.value,
        "role_title": payload.role_title,
        "message": payload.message.strip(),
        "created_at": now_iso(),
        "decided_at": None,
    }
    repo.put_invitation(invitation)
    notifications.push(
        invitee_id,
        kind="invitation.received",
        title=f"{me['name']} invited you to join {project['title']}",
        body=invitation["message"][:140],
        link=f"/projects/{project_id}",
        actor_id=principal.sub,
    )
    return _public([invitation], {project_id: project})[0]


def _public(invitations: list[Item], found: dict[str, Item]) -> list[InvitationPublic]:
    people = users.summaries(
        [i["invitee_id"] for i in invitations] + [i["inviter_id"] for i in invitations]
    )
    result = []
    for invitation in invitations:
        project = found.get(invitation["project_id"])
        if not project:
            continue
        result.append(
            InvitationPublic(
                **invitation,
                invitee=people.get(invitation["invitee_id"]),
                inviter=people.get(invitation["inviter_id"]),
                project_title=project["title"],
                project_subtitle=project.get("subtitle", ""),
                project_category=project.get("category", ""),
            )
        )
    return result


def list_for_project(project_id: str, principal: Principal) -> list[InvitationPublic]:
    access = projects.load(project_id, principal)
    access.require_manager()
    invitations = repo.list_invitations(project_id)
    invitations.sort(key=lambda i: i["created_at"], reverse=True)
    return _public(invitations, {project_id: access.project})


def list_mine(principal: Principal) -> list[InvitationPublic]:
    """Invitations waiting for the caller's answer."""
    pending = [
        i for i in repo.invitations_of(principal.sub) if i["status"] == InvitationStatus.PENDING
    ]
    return _public(pending, repo.get_many([i["project_id"] for i in pending]))


def respond(project_id: str, principal: Principal, accept: bool) -> InvitationPublic:
    invitation = repo.get_invitation(project_id, principal.sub)
    if not invitation:
        raise NotFound("Invitation not found")
    if invitation["status"] != InvitationStatus.PENDING:
        raise Conflict("This invitation has already been answered")
    project = repo.get(project_id)
    if not project:
        raise NotFound("Project not found")
    me = users.ensure_profile(principal)
    now = now_iso()

    if accept:
        try:
            repo.add_member(
                project_id,
                {
                    "user_id": principal.sub,
                    "role": ProjectRole.MEMBER.value,
                    "title": invitation.get("role_title", ""),
                    "joined_at": now,
                    "proof_code": proof_code(),
                },
            )
        except Conflict as exc:
            raise Conflict("The team filled up before you answered") from exc

    status = InvitationStatus.ACCEPTED if accept else InvitationStatus.DECLINED
    updated = repo.update_invitation(
        project_id, principal.sub, {"status": status.value, "decided_at": now}
    )
    notifications.push(
        invitation["inviter_id"],
        kind=f"invitation.{status.value}",
        title=(
            f"{me['name']} joined {project['title']}"
            if accept
            else f"{me['name']} declined the invitation to {project['title']}"
        ),
        link=f"/projects/{project_id}?tab=team",
        actor_id=principal.sub,
    )
    return _public([updated or invitation], {project_id: project})[0]


def revoke(project_id: str, invitee_id: str, principal: Principal) -> None:
    access = projects.load(project_id, principal)
    access.require_manager()
    invitation = repo.get_invitation(project_id, invitee_id)
    if not invitation:
        raise NotFound("Invitation not found")
    if invitation["status"] != InvitationStatus.PENDING:
        raise Conflict("This invitation has already been answered")
    repo.delete_invitation(project_id, invitee_id)
