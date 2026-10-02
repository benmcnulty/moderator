require("dotenv").config();
const express = require("express");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const { validateModerationResult, extractModerationResult } = require("./src/moderation-result");

async function requestModeration(userText) {
  const response = await axios.post(
    "https://api.openai.com/v1/moderations",
    { input: userText, model: "omni-moderation-latest" },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );
  return extractModerationResult(response.data);
}

function createApp({ moderate = requestModeration } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "dist")));

  app.post("/api/filter-content", async (req, res) => {
    const userText = req.body.text;
    if (typeof userText !== "string" || !userText.trim()) {
      return res.status(400).json({ error: { message: "Please enter valid text" } });
    }
    try {
      res.json(validateModerationResult(await moderate(userText)));
    } catch {
      // Axios errors can contain request Authorization headers. Do not log them.
      res.status(502).json({ error: "Moderation service unavailable" });
    }
  });
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  return app;
}

const app = createApp();
if (require.main === module) {
  const port = 3000;
  const keyPath = process.env.LOCALHOST_KEY;
  const certPath = process.env.LOCALHOST_CERT;
  if (keyPath && certPath) {
    const key = fs.readFileSync(keyPath, "utf8");
    const cert = fs.readFileSync(certPath, "utf8");
    https.createServer({ key, cert }, app).listen(port, "127.0.0.1", () => {
      console.log(`Server is running on https://localhost:${port}`);
    });
  } else {
    app.listen(port, "127.0.0.1", () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  }
}
module.exports = app;
module.exports.createApp = createApp;
