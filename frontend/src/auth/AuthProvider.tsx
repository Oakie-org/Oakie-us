import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/auth/clients";
import { configureApi } from "@/lib/api";
import { keys, useMe } from "@/lib/queries";
import type { Me } from "@/lib/types";
import { PageSpinner } from "@/components/ui/feedback";

type Status = "loading" | "guest" | "signedIn";

interface AuthContextValue {
  status: Status;
  /** The signed-in member's profile; undefined while loading or signed out. */
  me: Me | undefined;
  mode: "cognito" | "local";
  signIn(email: string, password: string): Promise<void>;
  signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<{ needsConfirmation: boolean }>;
  confirmSignUp(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [status, setStatus] = useState<Status>("loading");

  const clearSession = useCallback(() => {
    setStatus("guest");
    client.removeQueries({ queryKey: keys.me });
    client.removeQueries({ queryKey: ["inbox"] });
    client.invalidateQueries();
  }, [client]);

  useEffect(() => {
    configureApi({
      getToken: () => authClient.getToken(),
      onSessionExpired: () => {
        void authClient.signOut().catch(() => {});
        clearSession();
      },
    });
    let cancelled = false;
    authClient.getToken().then((token) => {
      if (!cancelled) setStatus(token ? "signedIn" : "guest");
    });
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const { data: me } = useMe(status === "signedIn");

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      me: status === "signedIn" ? me : undefined,
      mode: authClient.mode,
      async signIn(email, password) {
        await authClient.signIn(email, password);
        await client.invalidateQueries();
        setStatus("signedIn");
      },
      async signUp(email, password, name) {
        const result = await authClient.signUp(email, password, name);
        if (!result.needsConfirmation && (await authClient.getToken())) {
          await client.invalidateQueries();
          setStatus("signedIn");
        }
        return result;
      },
      confirmSignUp: (email, code) => authClient.confirmSignUp(email, code),
      async signOut() {
        await authClient.signOut();
        clearSession();
      },
    }),
    [status, me, client, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** Gate for pages that need a signed-in member; remembers where to return to. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <PageSpinner />;
  if (status === "guest") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <>{children}</>;
}
