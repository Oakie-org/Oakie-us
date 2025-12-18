import { useAuth } from "@/contexts/AuthContext";
import type { GlobalRole } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

interface PermissionGateProps {
  children: ReactNode;
  /** Require user to have one of these roles to see children */
  roles?: GlobalRole[];
  /** Fallback content to show if user lacks permission (default: null) */
  fallback?: ReactNode;
}

/**
 * Conditional rendering component for role-based UI visibility.
 *
 * Use this to hide/show UI elements based on user permissions.
 * Unlike ProtectedRoute, this doesn't redirect - it just hides content.
 *
 * @example Hide delete button for non-admins
 * ```tsx
 * <PermissionGate roles={['admin', 'super_admin']}>
 *   <Button variant="destructive">Delete User</Button>
 * </PermissionGate>
 * ```
 *
 * @example Show different content based on role
 * ```tsx
 * <PermissionGate
 *   roles={['creator', 'moderator', 'admin', 'super_admin']}
 *   fallback={<p>Upgrade to Creator to create projects</p>}
 * >
 *   <CreateProjectButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  roles,
  fallback = null,
}: PermissionGateProps) {
  const { isAuthenticated, hasAnyRole } = useAuth();

  // If no roles specified, just check authentication
  if (!roles || roles.length === 0) {
    return isAuthenticated ? <>{children}</> : <>{fallback}</>;
  }

  // Check if user has any of the required roles
  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Shortcut component for admin-only content.
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate roles={["admin", "super_admin"]} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Shortcut component for creator-or-above content.
 */
export function CreatorOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      roles={["creator", "moderator", "admin", "super_admin"]}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}
