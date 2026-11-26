import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AppShell from "@/app/AppShell";
import { AuthProvider, RequireAuth, useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/feedback";
import { ToastProvider } from "@/components/ui/toast";

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Explore = lazy(() => import("@/pages/Explore"));
const Talent = lazy(() => import("@/pages/Talent"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const ProjectWizard = lazy(() => import("@/pages/ProjectWizard"));
const EmbedProfile = lazy(() => import("@/pages/EmbedProfile"));
const Profile = lazy(() => import("@/pages/Profile"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const Messages = lazy(() => import("@/pages/Messages"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Verify = lazy(() => import("@/pages/Verify"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false,
      // Client errors (404, 403, 401) will not fix themselves; only retry the rest.
      retry: (failures, error) =>
        failures < 2 &&
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ),
    },
  },
});

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-3xl">Something broke on this page</h1>
        <p className="max-w-md text-ink-soft">
          Reloading usually fixes it. If it keeps happening, let us know what
          you were doing.
        </p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Guests see the story of Oakie; members land on their own work. */
function HomeRoute() {
  const { status } = useAuth();
  if (status === "loading") return <PageSpinner />;
  return status === "signedIn" ? <Dashboard /> : <Landing />;
}

/** The profile is edited in place; old links to the settings form land there. */
function EditProfileRoute() {
  const { me } = useAuth();
  if (!me) return <PageSpinner />;
  return <Navigate to={`/u/${me.id}?edit=intro`} replace />;
}

/** A project is edited on its own page; old links to the edit form land there. */
function EditProjectRoute() {
  const { id = "" } = useParams();
  return <Navigate to={`/projects/${id}?edit=basics`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <ScrollToTop />
              <Suspense fallback={<PageSpinner />}>
                <Routes>
                  <Route path="/login" element={<AuthPage mode="login" />} />
                  <Route
                    path="/register"
                    element={<AuthPage mode="register" />}
                  />
                  <Route path="/embed/u/:id" element={<EmbedProfile />} />
                  <Route
                    path="/welcome"
                    element={
                      <RequireAuth>
                        <Welcome />
                      </RequireAuth>
                    }
                  />
                  <Route element={<AppShell />}>
                    <Route index element={<HomeRoute />} />
                    <Route path="explore" element={<Explore />} />
                    <Route path="talent" element={<Talent />} />
                    <Route
                      path="projects/new"
                      element={
                        <RequireAuth>
                          <ProjectWizard />
                        </RequireAuth>
                      }
                    />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route
                      path="projects/:id/edit"
                      element={<EditProjectRoute />}
                    />
                    <Route path="u/:id" element={<Profile />} />
                    <Route
                      path="settings"
                      element={
                        <RequireAuth>
                          <EditProfileRoute />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="messages"
                      element={
                        <RequireAuth>
                          <Messages />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="messages/:id"
                      element={
                        <RequireAuth>
                          <Messages />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="notifications"
                      element={
                        <RequireAuth>
                          <Notifications />
                        </RequireAuth>
                      }
                    />
                    <Route path="verify" element={<Verify />} />
                    <Route path="verify/:code" element={<Verify />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
