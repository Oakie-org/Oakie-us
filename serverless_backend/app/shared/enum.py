from enum import StrEnum


class ProjectStatus(StrEnum):
    RECRUITING = "Recruiting"
    IN_PROGRESS = "In Progress"
    IDEA = "Idea"
    COMPLETED = "Completed"


class ProjectVisibility(StrEnum):
    """Project visibility settings for access control."""

    PUBLIC = "public"  # Anyone can view
    MEMBERS_ONLY = "members_only"  # Only members can view details
    PRIVATE = "private"  # Unlisted, only members can access


class ProjectRole(StrEnum):
    """Role within a project for project-level permissions."""

    OWNER = "owner"  # Full control, can delete project
    ADMIN = "admin"  # Can edit, invite, review applications
    MEMBER = "member"  # Can view all content, edit assigned tasks
    VIEWER = "viewer"  # Read-only access to member content
