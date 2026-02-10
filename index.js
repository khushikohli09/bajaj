const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;
const GROAK_KEY = process.env.GROAK_API_KEY; // replace with your Groak key

/* ---------- Helpers ---------- */
const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);

/* ---------- GET /health ---------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL,
  });
});

/* ---------- POST /bfhl ---------- */
app.post("/bfhl", async (req, res) => {
  try {
    const keys = Object.keys(req.body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        error: "Exactly one key required",
      });
    }

    const key = keys[0];
    const value = req.body[key];
    let data;

    /* ---------- Fibonacci ---------- */
    if (key === "fibonacci") {
      if (!Number.isInteger(value)) throw new Error("Invalid fibonacci input");
      let a = 0, b = 1;
      data = [];
      for (let i = 0; i < value; i++) {
        data.push(a);
        [a, b] = [b, a + b];
      }
    }

    /* ---------- Prime ---------- */
    else if (key === "prime") {
      if (!Array.isArray(value)) throw new Error("Invalid prime input");
      data = value.filter((n) => Number.isInteger(n) && isPrime(n));
    }

    /* ---------- LCM ---------- */
    else if (key === "lcm") {
      if (!Array.isArray(value) || value.length === 0)
        throw new Error("Invalid lcm input");
      data = value.reduce((acc, n) => lcm(acc, n));
    }

    /* ---------- HCF ---------- */
    else if (key === "hcf") {
      if (!Array.isArray(value) || value.length === 0)
        throw new Error("Invalid hcf input");
      data = value.reduce((acc, n) => gcd(acc, n));
    }

    /* ---------- AI (Groak) ---------- */
    else if (key === "AI") {
      if (typeof value !== "string") throw new Error("Invalid AI input");

      try {
        const response = await axios.post(
          "https://api.groak.com/v1/chat/completions",
          {
            model: "groak-chat",
            messages: [{ role: "user", content: value }],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROAK_KEY}`,
            },
          }
        );

        data = response.data.choices?.[0]?.message?.content || "No answer";
      } catch (err) {
        console.log("Groak request failed:", err.response?.data || err.message);
        data = "AI request failed";
      }
    }

    /* ---------- Invalid Key ---------- */
    else {
      return res.status(400).json({
        is_success: false,
        error: "Invalid key",
      });
    }

    // If data is an array, join it to a string for single-line display
    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data: Array.isArray(data) ? data.join(", ") : data,
    });
  } catch (err) {
    res.status(500).json({
      is_success: false,
      error: err.message,
    });
  }
});

/* ---------- Start Server ---------- */
app.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});
