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

interface User {
  username: string;
  userId: string;
  email?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

      setUser({
        username: currentUser.username,
        userId: currentUser.userId,
        email: attributes.email,
        name: attributes.name,
      });
    } catch {
      // Not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

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

        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          email: attributes.email,
          name: attributes.name,
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

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    register,
    confirmRegistration,
    login,
    logout,
    clearError,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
