// backend/server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 5000;
const JWT_SECRET = "your_secret_key";
const DB_FILE = path.join(__dirname, "data", "db.json");

app.use(cors());
app.use(express.json());

// Helper functions
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], projects: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- SIGNUP ----------
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  const db = readDB();
  const existingUser = db.users.find((u) => u.email === email);
  if (existingUser)
    return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), name, email, password: hashedPassword };
  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ message: "Signup successful" });
});

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.email === email);

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// ---------- AUTH MIDDLEWARE ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ---------- PROJECT ROUTES ----------
app.get("/api/projects", authenticateToken, (req, res) => {
  const db = readDB();
  const projects = db.projects.filter((p) => p.userId === req.user.id);
  res.json(projects);
});

app.post("/api/projects", authenticateToken, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Project name required" });

  const db = readDB();
  const newProject = {
    id: uuidv4(),
    userId: req.user.id,
    name,
    description,
    createdAt: new Date().toISOString(),
  };

  db.projects.push(newProject);
  writeDB(db);

  res.status(201).json(newProject);
});

app.delete("/api/projects/:id", authenticateToken, (req, res) => {
  const db = readDB();
  const projectIndex = db.projects.findIndex(
    (p) => p.id === req.params.id && p.userId === req.user.id
  );
  if (projectIndex === -1)
    return res.status(404).json({ message: "Project not found" });

  db.projects.splice(projectIndex, 1);
  writeDB(db);
  res.json({ message: "Project deleted" });
});

// ---------- ROOT ----------
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Update project
// ---------- UPDATE PROJECT ----------
app.put("/api/projects/:id", authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const db = readDB();

  const index = db.projects.findIndex(
    (p) => p.id === req.params.id && p.userId === req.user.id
  );

  if (index === -1)
    return res.status(404).json({ message: "Project not found" });

  db.projects[index] = {
    ...db.projects[index],
    name: name || db.projects[index].name,
    description: description || db.projects[index].description,
  };

  writeDB(db);
  res.json(db.projects[index]);
});

// ---------- START ----------
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
