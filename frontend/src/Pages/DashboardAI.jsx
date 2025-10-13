import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";

const DashboardAI = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Project management state
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingProject, setEditingProject] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // AI Tools state
  const [selectedProject, setSelectedProject] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [aiResult, setAIResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(data);
      if (!selectedProject && data.length > 0) setSelectedProject(data[0].id);
    } catch {
      setMessage({ text: "Failed to load projects", type: "error" });
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    else fetchProjects();
  }, []);

  // ---------------- Project Management ----------------
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", description: "" });
        setMessage({ text: "Project added successfully!", type: "success" });
        fetchProjects();
      } else {
        const data = await res.json();
        setMessage({ text: data.message || "Add failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Server error", type: "error" });
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setForm({ name: project.name, description: project.description });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditingProject(null);
        setForm({ name: "", description: "" });
        setMessage({ text: "Project updated!", type: "success" });
        fetchProjects();
      } else {
        const data = await res.json();
        setMessage({ text: data.message || "Update failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Server error", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetch(`${API_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProjects();
    } catch {
      setMessage({ text: "Server error while deleting", type: "error" });
    }
  };

  // ---------------- AI Tools ----------------
  const handleAICall = async (endpoint, body) => {
    setLoading(true);
    setAIResult("");
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch(`${API_URL}/api/ai/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) setAIResult(data.result || JSON.stringify(data, null, 2));
      else setMessage({ text: data.error || "AI request failed", type: "error" });
    } catch {
      setMessage({ text: "Server error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const generateLayout = () => {
    if (!selectedProject || !descriptionInput) {
      setMessage({ text: "Select a project and enter description", type: "error" });
      return;
    }
    handleAICall("generate-layout", { projectId: selectedProject, description: descriptionInput });
  };

  const generateProjectDesc = () => {
    if (!selectedProject || !descriptionInput) {
      setMessage({ text: "Select a project and enter description", type: "error" });
      return;
    }
    handleAICall("generate-project-desc", { projectId: selectedProject, description: descriptionInput });
  };

  const explainCode = () => {
    if (!codeInput) {
      setMessage({ text: "Enter code to explain", type: "error" });
      return;
    }
    handleAICall("explain-code", { code: codeInput });
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard + AI Tools</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {message.text && (
        <div
          className={`p-3 mb-4 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ---------------- Project Management ---------------- */}
      <form
        onSubmit={editingProject ? handleUpdate : handleAdd}
        className="bg-white p-4 rounded-lg shadow-md max-w-md mb-6"
      >
        <h2 className="text-lg font-semibold mb-3">
          {editingProject ? "Edit Project" : "Add New Project"}
        </h2>
        <input
          type="text"
          placeholder="Project name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <textarea
          placeholder="Project description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 mb-3 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {editingProject ? "Update" : "Add"}
        </button>
        {editingProject && (
          <button
            type="button"
            onClick={() => setEditingProject(null)}
            className="ml-3 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        )}
      </form>

      {/* ---------------- Projects Grid ---------------- */}
      <h2 className="text-xl font-semibold mb-3">Your Projects</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {projects.length > 0 ? (
          projects.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-gray-600">{p.description}</p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => handleEdit(p)}
                  className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No projects found.</p>
        )}
      </div>

      {/* ---------------- AI Tools ---------------- */}
      <div className="bg-white p-4 rounded shadow-md mb-6 max-w-2xl">
        <h2 className="text-lg font-semibold mb-3">AI Tools</h2>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Enter project description"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />

        <div className="flex gap-3 mb-3">
          <button
            onClick={generateLayout}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate Layout
          </button>
          <button
            onClick={generateProjectDesc}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Generate Project Description
          </button>
        </div>

        <textarea
          placeholder="Paste code here"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />
        <button
          onClick={explainCode}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 mb-3"
        >
          Explain Code
        </button>

        {loading && <p className="mb-3">Loading AI response...</p>}

        {aiResult && (
          <div className="bg-gray-100 p-4 rounded shadow-md">
            <h3 className="font-semibold mb-2">AI Result:</h3>
            <SyntaxHighlighter language="json">{aiResult}</SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAI;
