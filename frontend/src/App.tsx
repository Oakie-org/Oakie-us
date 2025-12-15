import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApplicationShell from "@/pages/ApplicationShell";
import ExploreProjects from "@/pages/ExploreProjects";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import CreateProjectPage from "@/pages/CreateProjectPage";
import Register from "@/components/shadcn-studio/blocks/register-04/register-04";
import Login from "@/components/shadcn-studio/blocks/login-page-04/login-page-04";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages - standalone, no shell */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Main app with shell */}
        <Route path="/" element={<ApplicationShell />}>
          <Route index element={<ExploreProjects />} />
          <Route path="explore" element={<ExploreProjects />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="create" element={<CreateProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
