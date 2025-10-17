// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ui-nova-1j1v.onrender.com",
      "https://kuickadd9-pixel-ui-nova.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// --------------------
// Import AI Routes
// --------------------
const aiRoutes = require("./ai"); // make sure backend/ai.js exists
app.use("/api/ai", aiRoutes);

// --------------------
// In-memory storage
// --------------------
let users = [];      // { id, name, email, password }
let projects = [];   // { id, userId, name, description }

// --------------------
// Token verification middleware
// --------------------
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

// --------------------
// Routes
// --------------------

// Health check
app.get("/api", (req, res) => {
  res.json({ message: "✅ Server running fine!" });
});

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email, and password are required" });

    const existing = users.find(u => u.email === email);
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, name, email, password: hashed };
    users.push(newUser);

    console.log("✅ New user registered:", email);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get user profile
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}!`, user: req.user });
});

// --------------------
// Projects API
// --------------------
app.get("/api/projects", verifyToken, (req, res) => {
  const userProjects = projects.filter(p => p.userId === req.user.id);
  res.json(userProjects);
});

app.post("/api/projects", verifyToken, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Project name is required" });

  const newProject = {
    id: projects.length + 1,
    userId: req.user.id,
    name,
    description: description || "",
  };
  projects.push(newProject);
  res.status(201).json({ message: "Project added successfully", project: newProject });
});

app.put("/api/projects/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const project = projects.find(p => p.id === parseInt(id) && p.userId === req.user.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  project.name = name || project.name;
  project.description = description || project.description;

  res.json({ message: "Project updated", project });
});

app.delete("/api/projects/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const index = projects.findIndex(p => p.id === parseInt(id) && p.userId === req.user.id);
  if (index === -1) return res.status(404).json({ message: "Project not found" });

  projects.splice(index, 1);
  res.json({ message: "Project deleted" });
});

// --------------------
// Serve frontend (React build)
// --------------------
const frontendPath = path.join(__dirname, "../frontend/dist");

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  // Catch-all for non-API requests
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api")) {
      return res.sendFile(path.join(frontendPath, "index.html"));
    }
    next();
  });
} else {
  console.log("⚠️ Frontend build not found. Run `npm run build` in frontend/");
}

// --------------------
// Start server
// --------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
