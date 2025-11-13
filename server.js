import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Validate API key on startup
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file");
  process.exit(1);
}

// ========================
//      CHAT ENDPOINT
// ========================
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    const userMessage = messages[messages.length - 1].content;

    // FIXED: Use v1 API (more stable) with the correct model name
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userMessage }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Enhanced error handling
    if (!response.ok) {
      console.error("❌ Gemini API Error:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API request failed",
        details: data.error,
      });
    }

    console.log("✅ Gemini API Response:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm not able to answer that right now.";

    return res.json({ reply });
  } catch (error) {
    console.error("🔥 Server error:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message 
    });
  }
});

// ========================
//  ROOT CHECK ENDPOINT
// ========================
app.get("/", (req, res) => {
  res.send("🚀 Gemini chatbot backend is running!");
});

// ========================
//    HEALTH CHECK
// ========================
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!GEMINI_API_KEY 
  });
});

// ========================
//         SERVER
// ========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Gemini chatbot running on port ${PORT}`);
  console.log(`✅ Using model: gemini-2.0-flash`);
});



