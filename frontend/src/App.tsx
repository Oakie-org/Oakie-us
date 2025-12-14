import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApplicationShell from "@/pages/ApplicationShell";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApplicationShell />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
