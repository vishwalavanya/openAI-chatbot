import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    console.log("Gemini API Response:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm not able to answer that right now.";

    return res.json({ reply });
  } catch (error) {
    console.error("🔥 Gemini API error:", error);
    return res.status(500).json({ error: "Gemini Error" });
  }
});

// ========================
//  ROOT CHECK ENDPOINT
// ========================
app.get("/", (req, res) => {
  res.send("🚀 Gemini chatbot backend is running!");
});

// ========================
//         SERVER
// ========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Gemini chatbot running on port ${PORT}`);
});


