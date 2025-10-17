const express = require("express");
const router = express.Router();

router.post("/generate", (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  res.json({ result: `AI says: "${prompt}"` }); // Replace with DeepSeek API later
});

module.exports = router;
