const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/generate-layout", async (req, res) => {
  const { projectId, description } = req.body;

  if (!projectId || !description) {
    return res.status(400).json({ error: "Missing projectId or description" });
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/generate",
      { projectId, description },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_KEY}`,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DeepSeek request failed" });
  }
});

module.exports = router;
