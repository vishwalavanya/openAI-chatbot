// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "128kb" }));

// Config from environment (set these on Render)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
const PORT = process.env.PORT || 8080;

// Basic guard
if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is not set. The /chat endpoint will return 500 until you set it.");
}

/**
 * POST /chat
 * Body:
 * {
 *   "messages": [{ "role": "system" | "user" | "assistant", "content": "..." }, ...],
 *   "temperature": 0.7,           // optional
 *   "max_tokens": 800             // optional
 * }
 *
 * Response:
 * { reply: "AI text", model: "...", usage: { prompt_tokens, completion_tokens, total_tokens } }
 */
app.post("/chat", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Server not configured: OPENAI_API_KEY missing" });
    }

    const { messages, temperature = 0.7, max_tokens = 800 } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages (array) is required in the request body" });
    }

    // Validate simple shape (role + content)
    for (const m of messages) {
      if (!m.role || !m.content) {
        return res.status(400).json({ error: "Each message must have role and content fields" });
      }
    }

    // Build payload for OpenAI chat completions
    const payload = {
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens,
    };

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // optional timeout control could be added
    });

    if (!openaiResp.ok) {
      const text = await openaiResp.text().catch(() => "");
      console.error("OpenAI API error:", openaiResp.status, text);
      // Surface the server-side error to the frontend in a safe way
      return res.status(openaiResp.status).json({
        error: "OpenAI API returned an error",
        details: text,
      });
    }

    const data = await openaiResp.json();

    // Defensive checks
    const choice = data?.choices?.[0];
    const reply = choice?.message?.content ?? "";
    const usage = data?.usage ?? null;
    const model = data?.model ?? OPENAI_MODEL;

    return res.json({
      reply,
      model,
      usage,
    });
  } catch (err) {
    console.error("Server error in /chat:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// health check
app.get("/", (req, res) => res.send("✅ Chatbot server is running"));

// start
app.listen(PORT, () => {
  console.log(`🚀 Chatbot server running on port ${PORT}`);
});
