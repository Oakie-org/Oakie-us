"""
Project member model for project-level access control.

Defines the relationship between users and projects with role-based permissions.
Stored in DynamoDB with composite key: PK=PROJECT#{project_id}, SK=MEMBER#{user_id}
"""

from pydantic import BaseModel

from app.shared.enum import ProjectRole


class ProjectMemberBase(BaseModel):
    """Base fields for project membership."""

    role: ProjectRole = ProjectRole.MEMBER


class ProjectMemberCreate(ProjectMemberBase):
    """Fields required when adding a new member to a project."""

    user_id: str  # Cognito sub


class ProjectMember(ProjectMemberBase):
    """Full project member record as stored in DynamoDB."""

    project_id: str
    user_id: str  # Cognito sub
    role: ProjectRole
    joined_at: str

    # Optional: denormalized user info for display
    user_email: str | None = None
    user_nickname: str | None = None


class ProjectMemberPublic(BaseModel):
    """Public view of project member (for API responses)."""

    user_id: str
    role: ProjectRole
    joined_at: str
    user_nickname: str | None = None


# DynamoDB access pattern helper
def get_member_pk(project_id: str) -> str:
    """Generate PK for project member query."""
    return f"PROJECT#{project_id}"


def get_member_sk(user_id: str) -> str:
    """Generate SK for specific member lookup."""
    return f"MEMBER#{user_id}"
