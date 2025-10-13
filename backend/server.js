const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

app.use(cors());
app.use(express.json());

// File paths
const usersFile = path.join(__dirname, "db.json");
const projectsFile = path.join(__dirname, "project.json");

// Helper: Read JSON file
function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  const data = fs.readFileSync(file, "utf-8");
  return JSON.parse(data);
}

// Helper: Write JSON file
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

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), name, email, password: hashedPassword };

    users.push(newUser);

    // Save back correctly
    if (Array.isArray(db)) {
      writeJSON(usersFile, users);
    } else {
      writeJSON(usersFile, { users });
    }

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

// ======= PROJECT ROUTES =======

// Add a project
app.post("/api/projects", (req, res) => {
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

  if (Array.isArray(db)) {
    writeJSON(projectsFile, projects);
  } else {
    writeJSON(projectsFile, { projects });
  }

  res.status(201).json({ message: "Project added", project: newProject });
});

// Get all projects
app.get("/api/projects", (req, res) => {
  const db = readJSON(projectsFile);
  const projects = Array.isArray(db) ? db : db.projects || [];
  res.json(projects);
});

// ======= FRONTEND ROUTE =======
const frontendBuildPath = path.join(__dirname, "frontend_build");
app.use(express.static(frontendBuildPath));
app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
