import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/common/Layout';
import { AppLayout } from './components/common/AppLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Profile } from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - Top Navbar */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
          </Route>

          <Route path="/login" element={<Login />} />

          {/* App Routes - Sidebar Layout */}
          <Route element={<AppLayout />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/users/:id" element={<Profile />} />
            {/* Fallback for active menu items in sidebar */}
            <Route path="/dashboard" element={<Projects />} />
            <Route path="/messages" element={<Projects />} />
            <Route path="/community" element={<Projects />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
