import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from "aws-amplify/auth";

// ============================================================================
// Types
// ============================================================================

/**
 * Global user roles managed via Cognito Groups.
 * These match the backend GlobalRole enum.
 */
export type GlobalRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "creator"
  | "user";

/**
 * User permissions parsed from JWT.
 */
export interface UserPermissions {
  /** List of roles user belongs to (from cognito:groups) */
  roles: GlobalRole[];
  /** Highest priority role (first in cognito:groups) */
  primaryRole: GlobalRole;
}

/**
 * Authenticated user information with permissions.
 */
interface User {
  username: string;
  userId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  permissions: UserPermissions;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Permission check helpers
  hasRole: (role: GlobalRole) => boolean;
  hasAnyRole: (roles: GlobalRole[]) => boolean;
  isAdmin: () => boolean;
  isCreatorOrAbove: () => boolean;

  // Auth actions
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  confirmRegistration: (email: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => Promise<string | null>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Known valid global roles for filtering
const VALID_ROLES: GlobalRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "creator",
  "user",
];

/**
 * Parse permissions from Cognito JWT token.
 */
async function parsePermissionsFromSession(): Promise<UserPermissions> {
  const defaultPermissions: UserPermissions = {
    roles: ["user"],
    primaryRole: "user",
  };

  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;

    if (!idToken?.payload) {
      return defaultPermissions;
    }

    // cognito:groups is a string array in the JWT payload
    const groups = idToken.payload["cognito:groups"];

    if (!Array.isArray(groups) || groups.length === 0) {
      return defaultPermissions;
    }

    // Filter to only valid role names
    const validRoles = groups.filter(
      (g): g is GlobalRole =>
        typeof g === "string" && VALID_ROLES.includes(g as GlobalRole),
    );

    if (validRoles.length === 0) {
      return defaultPermissions;
    }

    return {
      roles: validRoles,
      primaryRole: validRoles[0], // First role has highest precedence
    };
  } catch {
    console.warn("Failed to parse permissions from session");
    return defaultPermissions;
  }
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const permissions = await parsePermissionsFromSession();

      setUser({
        username: currentUser.username,
        userId: currentUser.userId,
        email: attributes.email,
        name: attributes.name,
        avatarUrl: attributes.picture,
        permissions,
      });
    } catch {
      // Not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  // =========================================================================
  // Permission check helpers
  // =========================================================================

  function hasRole(role: GlobalRole): boolean {
    return user?.permissions.roles.includes(role) ?? false;
  }

  function hasAnyRole(roles: GlobalRole[]): boolean {
    return roles.some((role) => hasRole(role));
  }

  function isAdmin(): boolean {
    return hasAnyRole(["admin", "super_admin"]);
  }

  function isCreatorOrAbove(): boolean {
    return hasAnyRole(["creator", "moderator", "admin", "super_admin"]);
  }

  // =========================================================================
  // Auth actions
  // =========================================================================

  async function register(email: string, password: string, name: string) {
    setError(null);
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      });

      if (!isSignUpComplete && nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        return { needsConfirmation: true };
      }

      return { needsConfirmation: false };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    }
  }

  async function confirmRegistration(email: string, code: string) {
    setError(null);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Confirmation failed";
      setError(message);
      throw err;
    }
  }

  async function login(email: string, password: string) {
    setError(null);
    try {
      const { isSignedIn } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const permissions = await parsePermissionsFromSession();

        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          email: attributes.email,
          name: attributes.name,
          avatarUrl: attributes.picture,
          permissions,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  }

  async function logout() {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    }
  }

  async function getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch {
      return null;
    }
  }

  function clearError() {
    setError(null);
  }

  // =========================================================================
  // Provide context
  // =========================================================================

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCreatorOrAbove,
    register,
    confirmRegistration,
    login,
    logout,
    clearError,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
