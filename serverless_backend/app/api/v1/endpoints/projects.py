"""Projects: discovery, publishing, team and reactions."""

from fastapi import APIRouter, Depends, Query, status

from app.core.security import Principal, get_current_user, get_current_user_optional
from app.models.common import CursorPage, ProjectStatus
from app.models.project import (
    MemberPublic,
    MemberUpdate,
    ProjectCreate,
    ProjectDetail,
    ProjectFacets,
    ProjectListed,
    ProjectPublic,
    ProjectUpdate,
)
from app.services import projects

router = APIRouter()


def listing_query(
    status: ProjectStatus | None = None,
    category: str | None = None,
    city: str | None = Query(None, max_length=80),
    uni: str | None = Query(None, max_length=80),
    tag: str | None = Query(None, max_length=40),
    q: str | None = Query(None, max_length=80),
    skill: str | None = Query(None, max_length=40, description="A skill an open role asks for"),
    remote: bool | None = Query(None, description="Only teams that welcome remote members"),
    open_only: bool = Query(False, description="Only teams with a free seat"),
    within_days: int | None = Query(None, ge=1, le=365, description="Posted in the last N days"),
) -> projects.ProjectQuery:
    return projects.ProjectQuery(
        status=status, category=category, city=city, uni=uni, tag=tag, q=q,
        skill=skill, remote=remote, open_only=open_only, within_days=within_days,
    )  # fmt: skip


@router.get("", response_model=CursorPage[ProjectListed])
def list_projects(
    query: projects.ProjectQuery = Depends(listing_query),
    cursor: str | None = None,
    limit: int = Query(12, ge=1, le=50),
):
    """Public and members-only projects, featured first, then newest."""
    return projects.list_projects(query, limit, cursor)


@router.get("/facets", response_model=ProjectFacets)
def project_facets(query: projects.ProjectQuery = Depends(listing_query)):
    """Filter options with counts, for the same filters the listing accepts."""
    return projects.facets(query)


@router.post("", response_model=ProjectPublic, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, user: Principal = Depends(get_current_user)):
    return projects.create(user, payload)


@router.get("/following", response_model=list[ProjectListed])
def list_followed_projects(user: Principal = Depends(get_current_user)):
    return projects.following(user)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: str, user: Principal | None = Depends(get_current_user_optional)):
    return projects.get_detail(project_id, user)


@router.patch("/{project_id}", response_model=ProjectPublic)
def update_project(
    project_id: str, payload: ProjectUpdate, user: Principal = Depends(get_current_user)
):
    return projects.update(project_id, user, payload)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, user: Principal = Depends(get_current_user)):
    projects.delete(project_id, user)


# --------------------------------------------------------------- reactions


@router.put("/{project_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def like_project(project_id: str, user: Principal = Depends(get_current_user)):
    projects.set_reaction(project_id, user, "LIKE", True)


@router.delete("/{project_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_project(project_id: str, user: Principal = Depends(get_current_user)):
    projects.set_reaction(project_id, user, "LIKE", False)


@router.put("/{project_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_project(project_id: str, user: Principal = Depends(get_current_user)):
    projects.set_reaction(project_id, user, "FOLLOW", True)


@router.delete("/{project_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_project(project_id: str, user: Principal = Depends(get_current_user)):
    projects.set_reaction(project_id, user, "FOLLOW", False)


# -------------------------------------------------------------------- team


@router.get("/{project_id}/members", response_model=list[MemberPublic])
def list_members(project_id: str, user: Principal | None = Depends(get_current_user_optional)):
    return projects.list_members(project_id, user)


@router.patch("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def update_member(
    project_id: str,
    user_id: str,
    payload: MemberUpdate,
    user: Principal = Depends(get_current_user),
):
    projects.update_member(project_id, user_id, user, payload)


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(project_id: str, user_id: str, user: Principal = Depends(get_current_user)):
    """Remove a teammate, or leave the team when `user_id` is the caller."""
    projects.remove_member(project_id, user_id, user)
