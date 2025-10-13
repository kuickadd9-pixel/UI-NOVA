// backend/server.js
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

// ======= CORS CONFIG =======
const corsOptions = {
  origin: [
    "http://localhost:3002",
    "http://localhost:3003",
    "https://kuickadd9-pixel-ui-nova.onrender.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// ======= FILE PATHS =======
const usersFile = path.join(__dirname, "db.json");
const projectsFile = path.join(__dirname, "project.json");

// ======= HELPER FUNCTIONS =======
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
    Array.isArray(db)
      ? writeJSON(usersFile, users)
      : writeJSON(usersFile, { users });

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

// Profile route
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
  Array.isArray(db)
    ? writeJSON(projectsFile, projects)
    : writeJSON(projectsFile, { projects });

  res.status(201).json({ message: "Project added", project: newProject });
});

app.get("/api/projects", authenticate, (req, res) => {
  const db = readJSON(projectsFile);
  const projects = Array.isArray(db) ? db : db.projects || [];
  res.json(projects);
});

app.delete("/api/projects/:id", authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const db = readJSON(projectsFile);
  let projects = Array.isArray(db) ? db : db.projects || [];

  projects = projects.filter((p) => p.id !== id);
  Array.isArray(db)
    ? writeJSON(projectsFile, projects)
    : writeJSON(projectsFile, { projects });

  res.json({ message: "Project deleted" });
});

app.put("/api/projects/:id", authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  const db = readJSON(projectsFile);
  const projects = Array.isArray(db) ? db : db.projects || [];

  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ message: "Project not found" });

  projects[index] = { ...projects[index], name, description };
  Array.isArray(db)
    ? writeJSON(projectsFile, projects)
    : writeJSON(projectsFile, { projects });

  res.json({ message: "Project updated", project: projects[index] });
});

// ======= DEEPSEEK AI ROUTES =======
app.post("/api/ai/:action", authenticate, async (req, res) => {
  const { action } = req.params;
  const { description, code } = req.body;

  let prompt = "";

  switch (action) {
    case "generate-layout":
      prompt = `Create a full UI layout plan for this project: ${description}`;
      break;
    case "generate-project-desc":
      prompt = `Write a detailed product description for this project: ${description}`;
      break;
    case "explain-code":
      prompt = `Explain this code step-by-step:\n${code}`;
      break;
    default:
      return res.status(400).json({ error: "Unknown AI action" });
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert AI coding assistant." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
        },
      }
    );

    const result = response.data.choices[0].message.content;
    res.json({ result });
  } catch (err) {
    console.error("DeepSeek API error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// ======= FRONTEND SERVE (for Render hosting) =======
const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));

// ✅ FIX: Use app.use() for wildcard (Express v5 safe)
app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ======= START SERVER =======
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
