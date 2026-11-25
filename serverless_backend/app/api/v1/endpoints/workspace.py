"""Inside a project: join requests, timeline updates and the task board."""

from fastapi import APIRouter, Depends, Query, status

from app.core.security import Principal, get_current_user, get_current_user_optional
from app.models.common import CursorPage
from app.models.project import (
    ApplicationCreate,
    ApplicationDecision,
    ApplicationPublic,
    TaskCreate,
    TaskPublic,
    TaskUpdate,
    TimelinePostCreate,
    TimelinePostPublic,
    TimelinePostUpdate,
)
from app.services import applications, workspace

router = APIRouter()

# ------------------------------------------------------------ applications


@router.post(
    "/{project_id}/applications",
    response_model=ApplicationPublic,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_project(
    project_id: str, payload: ApplicationCreate, user: Principal = Depends(get_current_user)
):
    return applications.apply(project_id, user, payload)


@router.get("/{project_id}/applications", response_model=list[ApplicationPublic])
def list_applications(project_id: str, user: Principal = Depends(get_current_user)):
    """Join requests for a project. Owner and project admins only."""
    return applications.list_for_project(project_id, user)


@router.delete("/{project_id}/applications/me", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_application(project_id: str, user: Principal = Depends(get_current_user)):
    applications.withdraw(project_id, user)


@router.post("/{project_id}/applications/{applicant_id}/decision", response_model=ApplicationPublic)
def decide_application(
    project_id: str,
    applicant_id: str,
    payload: ApplicationDecision,
    user: Principal = Depends(get_current_user),
):
    return applications.decide(project_id, applicant_id, user, payload.approve)


# ---------------------------------------------------------------- timeline


@router.get("/{project_id}/timeline", response_model=CursorPage[TimelinePostPublic])
def list_timeline(
    project_id: str,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    user: Principal | None = Depends(get_current_user_optional),
):
    return workspace.list_posts(project_id, user, limit, cursor)


@router.post(
    "/{project_id}/timeline",
    response_model=TimelinePostPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_timeline_post(
    project_id: str, payload: TimelinePostCreate, user: Principal = Depends(get_current_user)
):
    return workspace.create_post(project_id, user, payload)


@router.patch("/{project_id}/timeline/{post_id}", response_model=TimelinePostPublic)
def update_timeline_post(
    project_id: str,
    post_id: str,
    payload: TimelinePostUpdate,
    user: Principal = Depends(get_current_user),
):
    return workspace.update_post(project_id, post_id, user, payload)


@router.delete("/{project_id}/timeline/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timeline_post(
    project_id: str, post_id: str, user: Principal = Depends(get_current_user)
):
    workspace.delete_post(project_id, post_id, user)


# ------------------------------------------------------------------- tasks


@router.get("/{project_id}/tasks", response_model=list[TaskPublic])
def list_tasks(project_id: str, user: Principal = Depends(get_current_user)):
    return workspace.list_tasks(project_id, user)


@router.post("/{project_id}/tasks", response_model=TaskPublic, status_code=status.HTTP_201_CREATED)
def create_task(project_id: str, payload: TaskCreate, user: Principal = Depends(get_current_user)):
    return workspace.create_task(project_id, user, payload)


@router.patch("/{project_id}/tasks/{task_id}", response_model=TaskPublic)
def update_task(
    project_id: str,
    task_id: str,
    payload: TaskUpdate,
    user: Principal = Depends(get_current_user),
):
    return workspace.update_task(project_id, task_id, user, payload)


@router.delete("/{project_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(project_id: str, task_id: str, user: Principal = Depends(get_current_user)):
    workspace.delete_task(project_id, task_id, user)
