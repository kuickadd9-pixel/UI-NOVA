const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

app.use(cors());
app.use(express.json());

// File paths
const usersFile = path.join(__dirname, "db.json");
const projectsFile = path.join(__dirname, "project.json");

// ======= HELPERS =======
function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  const data = fs.readFileSync(file, "utf-8");
  return JSON.parse(data);
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ======= AUTH ROUTES =======

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const db = readJSON(usersFile);
    const users = Array.isArray(db) ? db : db.users || [];
    if (users.find((u) => u.email === email))
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), name, email, password: hashedPassword };

    users.push(newUser);
    Array.isArray(db) ? writeJSON(usersFile, users) : writeJSON(usersFile, { users });

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readJSON(usersFile);
    const users = Array.isArray(db) ? db : db.users || [];

    const user = users.find((u) => u.email === email);
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Profile
app.get("/api/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: "Access granted", user: decoded });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

// ======= AUTH MIDDLEWARE =======
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ======= PROJECT ROUTES =======

// Add project
app.post("/api/projects", authenticate, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Project name required" });

  const db = readJSON(projectsFile);
  const projects = Array.isArray(db) ? db : db.projects || [];

  const newProject = {
    id: Date.now(),
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  projects.push(newProject);
  Array.isArray(db) ? writeJSON(projectsFile, projects) : writeJSON(projectsFile, { projects });

  res.status(201).json({ message: "Project added", project: newProject });
});

// Get all projects
app.get("/api/projects", authenticate, (req, res) => {
  const db = readJSON(projectsFile);
  const projects = Array.isArray(db) ? db : db.projects || [];
  res.json(projects);
});

// Delete project
app.delete("/api/projects/:id", authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const db = readJSON(projectsFile);
  let projects = Array.isArray(db) ? db : db.projects || [];

  projects = projects.filter((p) => p.id !== id);
  Array.isArray(db) ? writeJSON(projectsFile, projects) : writeJSON(projectsFile, { projects });

  res.json({ message: "Project deleted" });
});

// Update project
app.put("/api/projects/:id", authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  const db = readJSON(projectsFile);
  const projects = Array.isArray(db) ? db : db.projects || [];

  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ message: "Project not found" });

  projects[index] = { ...projects[index], name, description };
  Array.isArray(db) ? writeJSON(projectsFile, projects) : writeJSON(projectsFile, { projects });

  res.json({ message: "Project updated", project: projects[index] });
});

// ======= DEEPSEEK AI ROUTES =======

// Generate project layout
app.post("/api/ai/generate-layout", authenticate, async (req, res) => {
  const { projectId, description } = req.body;
  if (!projectId || !description)
    return res.status(400).json({ error: "Missing projectId or description" });

  try {
    const response = await axios.post(
      "https://api.deepseek.com/generate",
      { projectId, description },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("DeepSeek Layout error:", err.message || err);
    res.status(500).json({ error: "DeepSeek request failed" });
  }
});

// Generate project description
app.post("/api/ai/generate-project-desc", authenticate, async (req, res) => {
  const { projectId, description } = req.body;
  if (!projectId || !description)
    return res.status(400).json({ error: "Missing projectId or description" });

  try {
    const response = await axios.post(
      "https://api.deepseek.com/generate-project-desc",
      { projectId, description },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("DeepSeek Project Description error:", err.message || err);
    res.status(500).json({ error: "DeepSeek request failed" });
  }
});

// Explain code
app.post("/api/ai/explain-code", authenticate, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    const response = await axios.post(
      "https://api.deepseek.com/explain-code",
      { code },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("DeepSeek Code Explanation error:", err.message || err);
    res.status(500).json({ error: "DeepSeek request failed" });
  }
});

// ======= FRONTEND SERVE =======
const frontendBuildPath = path.join(__dirname, "frontend_build");
app.use(express.static(frontendBuildPath));
app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ======= START SERVER =======
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
