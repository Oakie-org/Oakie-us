"""
Permission guards for FastAPI endpoints.

Provides FastAPI dependencies for role-based access control using Cognito groups.
These guards ensure users have appropriate permissions before accessing endpoints.

Usage:
    from app.core.permissions import require_admin, require_creator_or_above

    @router.delete("/users/{id}")
    async def delete_user(id: str, user: TokenPayload = Depends(require_admin())):
        ...

    @router.post("/projects")
    async def create_project(user: TokenPayload = Depends(require_creator_or_above())):
        ...
"""

from fastapi import HTTPException, status, Depends
from typing import Callable

from app.core.security import TokenPayload, GlobalRole, get_current_user


class PermissionDenied(HTTPException):
    """
    Exception raised when user lacks required permissions.
    Returns HTTP 403 Forbidden.
    """

    def __init__(self, detail: str = "Permission denied"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def require_roles(*roles: GlobalRole) -> Callable[..., TokenPayload]:
    """
    FastAPI dependency that requires user to have one of the specified roles.

    Args:
        *roles: GlobalRole values that are allowed access

    Returns:
        FastAPI dependency that returns TokenPayload if authorized

    Raises:
        PermissionDenied: If user doesn't have any of the required roles

    Example:
        @router.get("/admin/users")
        async def list_users(
            user: TokenPayload = Depends(require_roles(GlobalRole.ADMIN, GlobalRole.SUPER_ADMIN))
        ):
            ...
    """

    async def role_checker(
        current_user: TokenPayload = Depends(get_current_user),
    ) -> TokenPayload:
        if not current_user.has_any_role(list(roles)):
            required = [r.value for r in roles]
            actual = current_user.cognito_groups
            raise PermissionDenied(
                f"Access denied. Required roles: {required}, but user has: {actual}"
            )
        return current_user

    return role_checker


def require_admin() -> Callable[..., TokenPayload]:
    """
    Shortcut dependency for admin-only endpoints.
    Allows: admin, super_admin

    Example:
        @router.delete("/projects/{id}/force")
        async def force_delete(user: TokenPayload = Depends(require_admin())):
            ...
    """
    return require_roles(GlobalRole.ADMIN, GlobalRole.SUPER_ADMIN)


def require_super_admin() -> Callable[..., TokenPayload]:
    """
    Shortcut dependency for super_admin-only endpoints.

    Example:
        @router.post("/admin/promote/{user_id}")
        async def promote_to_admin(user: TokenPayload = Depends(require_super_admin())):
            ...
    """
    return require_roles(GlobalRole.SUPER_ADMIN)


def require_moderator_or_above() -> Callable[..., TokenPayload]:
    """
    Shortcut dependency for moderator, admin, or super_admin.
    Allows: moderator, admin, super_admin

    Example:
        @router.post("/projects/{id}/flag")
        async def flag_project(user: TokenPayload = Depends(require_moderator_or_above())):
            ...
    """
    return require_roles(GlobalRole.MODERATOR, GlobalRole.ADMIN, GlobalRole.SUPER_ADMIN)


def require_creator_or_above() -> Callable[..., TokenPayload]:
    """
    Shortcut dependency for project creation permissions.
    Allows: creator, moderator, admin, super_admin

    Note: This does NOT include 'user' role. Users must be promoted to 'creator'
    to create projects (business decision for quality control).

    Example:
        @router.post("/projects")
        async def create_project(user: TokenPayload = Depends(require_creator_or_above())):
            ...
    """
    return require_roles(
        GlobalRole.CREATOR,
        GlobalRole.MODERATOR,
        GlobalRole.ADMIN,
        GlobalRole.SUPER_ADMIN,
    )


def require_authenticated() -> Callable[..., TokenPayload]:
    """
    Basic authentication check - any authenticated user.

    Same as get_current_user but more explicit in intent.

    Example:
        @router.post("/projects/{id}/follow")
        async def follow_project(user: TokenPayload = Depends(require_authenticated())):
            ...
    """

    async def auth_checker(
        current_user: TokenPayload = Depends(get_current_user),
    ) -> TokenPayload:
        return current_user

    return auth_checker
