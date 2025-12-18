import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { GlobalRole } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional: Require user to have one of these roles */
  requiredRoles?: GlobalRole[];
  /** Where to redirect if unauthorized (default: /unauthorized) */
  unauthorizedRedirect?: string;
}

/**
 * Route guard component that protects routes based on authentication and roles.
 *
 * @example Basic auth protection
 * ```tsx
 * <Route path="/profile" element={
 *   <ProtectedRoute>
 *     <ProfilePage />
 *   </ProtectedRoute>
 * } />
 * ```
 *
 * @example Role-based protection
 * ```tsx
 * <Route path="/admin" element={
 *   <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 * } />
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  unauthorizedRedirect = "/unauthorized",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasAnyRole(requiredRoles)) {
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  return <>{children}</>;
}
