import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import AIPage from "./Pages/AIPage";
import AddProject from "./Pages/AddProject";
import EditProject from "./Pages/EditProject";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/ai" element={<AIPage />} />
      <Route path="/add" element={<AddProject />} />
      <Route path="/edit/:id" element={<EditProject />} />
    </Routes>
  );
}

export default App;
