import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApplicationShell from "@/pages/ApplicationShell";
import ExploreProjects from "@/pages/ExploreProjects";
import ProjectDetailPage from "@/pages/ProjectDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApplicationShell />}>
          <Route index element={<ExploreProjects />} />
          <Route path="explore" element={<ExploreProjects />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
