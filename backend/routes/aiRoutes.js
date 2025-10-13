const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert AI code generator." },
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

    res.json({ result: response.data.choices[0].message.content });
  } catch (error) {
    console.error("DeepSeek Error:", error.message);
    res.status(500).json({ error: "AI generation failed" });
  }
});

module.exports = router;
