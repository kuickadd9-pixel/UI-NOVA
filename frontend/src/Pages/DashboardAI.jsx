import React, { useState } from "react";

const DashboardAI = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [aiTool, setAiTool] = useState("explain-code");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRunAI = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      let endpoint = "";
      let payload = {};

      if (aiTool === "generate-layout") {
        endpoint = "/api/ai/generate-layout";
        payload = { projectId, description };
      } else if (aiTool === "explain-code") {
        endpoint = "/api/ai/explain-code";
        payload = { code };
      } else if (aiTool === "debug-code") {
        endpoint = "/api/ai/debug";
        payload = { code };
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI request failed");
      }

      setResult(data.result || JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        🤖 AI Tools Dashboard
      </h1>

      {/* Select AI Action */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">
          Select AI Action:
        </label>
        <select
          value={aiTool}
          onChange={(e) => setAiTool(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="explain-code">💡 Explain Code</option>
          <option value="generate-layout">🧩 Generate UI Layout</option>
          <option value="debug-code">🪲 Debug Code</option>
        </select>
      </div>

      {/* Input Fields */}
      {aiTool === "generate-layout" && (
        <>
          <input
            type="text"
            placeholder="Project ID (optional)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full p-2 mb-3 border rounded"
          />
          <textarea
            placeholder="Enter UI description (e.g., Landing page with navbar, hero section, and footer)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 mb-3 border rounded"
            rows="4"
          />
        </>
      )}

      {(aiTool === "explain-code" || aiTool === "debug-code") && (
        <textarea
          placeholder="Paste your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          rows="8"
        />
      )}

      {/* Run Button */}
      <button
        onClick={handleRunAI}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {loading ? "Running AI..." : "Run AI Tool"}
      </button>

      {/* Error / Result Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <h2 className="font-bold mb-2 text-gray-700">AI Response:</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-800">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DashboardAI;
