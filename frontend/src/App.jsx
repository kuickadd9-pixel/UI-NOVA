import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import AIPage from "./Pages/AIPage";
import AddProject from "./Pages/AddProject";
import EditProject from "./Pages/EditProject";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddProject />} />
        <Route path="/edit/:id" element={<EditProject />} />
        <Route path="/ai" element={<AIPage />} /> {/* <-- AI Page route */}
      </Routes>
    </Router>
  );
}

export default App;
