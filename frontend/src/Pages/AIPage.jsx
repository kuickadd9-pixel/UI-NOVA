// frontend/src/Pages/AIPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

const AIPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [aiResult, setAIResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    } catch {
      setMessage("Failed to load projects");
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    else fetchProjects();
  }, []);

  // Generic AI call
  const handleAICall = async (endpoint, body) => {
    setLoading(true);
    setAIResult("");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/ai/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) setAIResult(data.result || JSON.stringify(data, null, 2));
      else setMessage(data.error || "AI request failed");
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const generateLayout = () => {
    if (!selectedProject || !descriptionInput) {
      setMessage("Select a project and enter description");
      return;
    }
    handleAICall("generate-layout", {
      projectId: selectedProject,
      description: descriptionInput,
    });
  };

  const generateProjectDesc = () => {
    if (!selectedProject || !descriptionInput) {
      setMessage("Select a project and enter description");
      return;
    }
    handleAICall("generate-project-desc", {
      projectId: selectedProject,
      description: descriptionInput,
    });
  };

  const explainCode = () => {
    if (!codeInput) {
      setMessage("Enter code to explain");
      return;
    }
    handleAICall("explain-code", { code: codeInput });
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {message && (
        <div className="p-3 mb-4 rounded bg-red-100 text-red-700">{message}</div>
      )}

      <div className="bg-white p-4 rounded shadow-md mb-6 max-w-2xl">
        <h2 className="text-lg font-semibold mb-3">Project Selection</h2>
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

        <div className="flex gap-3">
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
      </div>

      <div className="bg-white p-4 rounded shadow-md mb-6 max-w-2xl">
        <h2 className="text-lg font-semibold mb-3">Explain Code</h2>
        <textarea
          placeholder="Paste code here"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />
        <button
          onClick={explainCode}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Explain Code
        </button>
      </div>

      {loading && <p className="mb-3">Loading AI response...</p>}

      {aiResult && (
        <div className="bg-gray-100 p-4 rounded shadow-md max-w-2xl">
          <h3 className="font-semibold mb-2">AI Result:</h3>
          <SyntaxHighlighter language="javascript" style={atomOneDark}>
            {aiResult}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
};

export default AIPage;
