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

// ======================= FILE PATHS =======================
const usersFile = path.join(__dirname, "db.json");
const projectsFile = path.join(__dirname, "project.json");

// ======================= HELPERS =======================
function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ======================= AUTH ROUTES =======================

// ✅ SIGNUP
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const users = readJSON(usersFile);

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeJSON(usersFile, users);

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const users = readJSON(usersFile);
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ message: "Login successful", token });
});

// ✅ PROFILE (protected route)
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

// ======================= PROJECT ROUTES =======================

// ✅ ADD PROJECT
app.post("/api/projects", (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Project name required" });

  const projects = readJSON(projectsFile);
  const newProject = {
    id: uuidv4(),
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  projects.push(newProject);
  writeJSON(projectsFile, projects);
  res.status(201).json({ message: "Project added", project: newProject });
});

// ✅ GET PROJECTS
app.get("/api/projects", (req, res) => {
  const projects = readJSON(projectsFile);
  res.json(projects);
});

// ======================= FRONTEND BUILD =======================
const frontendBuildPath = path.join(__dirname, "frontend_build");
app.use(express.static(frontendBuildPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ======================= START SERVER =======================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
