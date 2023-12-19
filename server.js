require("dotenv").config();
const express = require("express");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const fs = require("fs");

const app = express();
const PORT = 3000;

const keyPath = process.env.LOCALHOST_KEY;
const certPath = process.env.LOCALHOST_CERT;

const key = keyPath ? fs.readFileSync(keyPath, "utf8") : null;
const cert = certPath ? fs.readFileSync(certPath, "utf8") : null;

// Middleware to parse JSON requests
app.use(cors());
app.use(express.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, "dist")));

app.post("/api/filter-content", async (req, res) => {
  const userText = req.body.text;

  if (!userText.trim()) {
    return res.status(400).json({
      error: {
        message: "Please enter valid text",
      },
    });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/moderations",
      {
        input: `${userText}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const results = response.data.results[0];
    res.json(results);
  } catch (error) {
    console.error("Error with OpenAI request:", error);
    res.status(500).json({ error: "Failed to retrieve data from OpenAI" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Check if SSL certificates are available
if (key && cert) {
  https.createServer({ key, cert }, app).listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Export the app for testing purposes
module.exports = app;
