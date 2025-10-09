// routes/projects.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const DB_FILE = path.join(__dirname, "../db.json");
const JWT_SECRET = "your_secret_key"; // must match server.js

// Read & write DB helpers
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], projects: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Middleware: verify JWT
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// GET all projects for logged-in user
router.get("/", verifyToken, (req, res) => {
  const db = readDB();
  const userProjects = db.projects.filter((p) => p.userId === req.user.id);
  res.json(userProjects);
});

// POST create new project
router.post("/", verifyToken, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Project name is required" });

  const db = readDB();
  const newProject = {
    id: uuidv4(),
    userId: req.user.id,
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  db.projects.push(newProject);
  writeDB(db);

  res.status(201).json(newProject);
});

// DELETE project by ID
router.delete("/:id", verifyToken, (req, res) => {
  const db = readDB();
  const projectIndex = db.projects.findIndex(
    (p) => p.id === req.params.id && p.userId === req.user.id
  );

  if (projectIndex === -1) {
    return res.status(404).json({ message: "Project not found" });
  }

  db.projects.splice(projectIndex, 1);
  writeDB(db);

  res.json({ message: "Project deleted" });
});

module.exports = router;
