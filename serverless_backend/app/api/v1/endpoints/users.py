"""Profiles, the talent directory and the follow graph."""

from fastapi import APIRouter, Depends, Query, status

from app.core.security import Principal, get_current_user, get_current_user_optional
from app.models.common import CursorPage
from app.models.project import (
    ApplicationPublic,
    ContributionRecord,
    InvitationPublic,
    ProjectMembership,
)
from app.models.user import UserPrivate, UserPublic, UserSummary, UserUpdate
from app.services import applications, invitations, projects, users, workspace

router = APIRouter()


@router.get("/talent", response_model=CursorPage[UserSummary])
def talent_directory(
    q: str | None = Query(None, max_length=80),
    skill: str | None = None,
    city: str | None = None,
    uni: str | None = None,
    open_to: str | None = None,
    cursor: str | None = None,
    limit: int = Query(18, ge=1, le=50),
):
    """Browse members by skill, school, city and what they are open to."""
    return users.talent(
        q=q, skill=skill, city=city, uni=uni, open_to=open_to, limit=limit, cursor=cursor
    )


@router.get("/users/me", response_model=UserPrivate)
def read_me(user: Principal = Depends(get_current_user)):
    return users.get_me(user)


@router.patch("/users/me", response_model=UserPrivate)
def update_me(payload: UserUpdate, user: Principal = Depends(get_current_user)):
    return users.update_me(user, payload)


@router.get("/users/me/applications", response_model=list[ApplicationPublic])
def my_applications(user: Principal = Depends(get_current_user)):
    return applications.list_mine(user)


@router.get("/users/me/invitations", response_model=list[InvitationPublic])
def my_invitations(user: Principal = Depends(get_current_user)):
    """Invitations waiting for an answer."""
    return invitations.list_mine(user)


@router.get("/users/{user_id}", response_model=UserPublic)
def read_user(user_id: str, user: Principal | None = Depends(get_current_user_optional)):
    return users.get_public(user_id, user)


@router.get("/users/{user_id}/projects", response_model=list[ProjectMembership])
def user_projects(user_id: str, user: Principal | None = Depends(get_current_user_optional)):
    return projects.projects_of(user_id, user)


@router.get("/users/{user_id}/contributions", response_model=list[ContributionRecord])
def user_contributions(user_id: str, user: Principal | None = Depends(get_current_user_optional)):
    return workspace.contributions_of(user_id, user)


@router.get("/users/{user_id}/followers", response_model=list[UserSummary])
def user_followers(user_id: str):
    return users.followers(user_id)


@router.get("/users/{user_id}/following", response_model=list[UserSummary])
def user_following(user_id: str):
    return users.following(user_id)


@router.put("/users/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_user(user_id: str, user: Principal = Depends(get_current_user)):
    users.follow(user, user_id)


@router.delete("/users/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(user_id: str, user: Principal = Depends(get_current_user)):
    users.unfollow(user, user_id)


@router.get("/contributions/{code}", response_model=ContributionRecord)
def verify_contribution(code: str):
    """Public verification of a contribution record by its code."""
    return workspace.verify_contribution(code)
