import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { amplifyConfig } from "@/lib/amplify-config";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ApplicationShell from "@/pages/ApplicationShell";
import ExploreProjects from "@/pages/ExploreProjects";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import CreateProjectPage from "@/pages/CreateProjectPage";
import Register from "@/components/shadcn-studio/blocks/register-04/register-04";
import Login from "@/components/shadcn-studio/blocks/login-page-04/login-page-04";

// Initialize Amplify
Amplify.configure(amplifyConfig);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages - standalone, no shell */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* Main app with shell */}
          <Route path="/" element={<ApplicationShell />}>
            {/* Public routes */}
            <Route index element={<ExploreProjects />} />
            <Route path="explore" element={<ExploreProjects />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="users/:userId" element={<ProfilePage />} />
            {/* Protected routes - require login */}
            <Route
              path="create"
              element={
                <ProtectedRoute>
                  <CreateProjectPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
