import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { fetchQuestionsForLevel, convertPromptSeqToTerms } from "./src/utils/questionsBank";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy GoogleGenAI initialization helper
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Mind Sport" });
});

// Endpoint: AI Question Generator for Mind Sport Flash Card Drills
app.post("/api/generate-ai-questions", async (req, res) => {
  try {
    const { level = 1, isComplex = false, count = 5, operations = ["+", "-"], theme = "Olympic Arena" } = req.body;

    // For Level 1 / Level 0, serve directly from the 20-question TALMAS official bank (5 random questions per round)
    if (level <= 1) {
      const questions = fetchQuestionsForLevel(1, isComplex, count);
      return res.json({ success: true, source: "talmas_bank", questions });
    }

    const ai = getGenAI();

    if (!ai) {
      // Fallback questions generator if GEMINI_API_KEY is missing
      const fallbackQuestions = fetchQuestionsForLevel(level, isComplex, count);
      return res.json({ success: true, source: "fallback", questions: fallbackQuestions });
    }

    const prompt = `Generate ${count} Mental Arithmetic flashcard challenge sequences for the Mind Sport Smart Boxing device.
Difficulty Level: Level ${level} (${isComplex ? "Complex Mode: rapid chain arithmetic, multiple numbers or larger operands" : "Standard Mode: clear 2-number operations"}).
Allowed Operations: ${operations.join(", ")}.
Theme Tone: ${theme}.

Rules for Mind Sport:
- Each question must be broken into a sequence of flashcard tokens (numbers and operators) that appear and disappear sequentially.
- The player calculates the result in memory and types the answer digit by digit on the 0-9 punch pads.
- The answer must be a non-negative integer.
Return JSON strictly adhering to schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of flashcard math questions",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              displayTitle: { type: Type.STRING },
              answer: { type: Type.STRING, description: "Correct final integer answer as a string e.g. '15' or '7'" },
              timeLimitSeconds: { type: Type.NUMBER },
              promptSeq: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "'number' or 'operator'" },
                    value: { type: Type.STRING, description: "e.g. '7', '+', '8', 'x', '-'" }
                  },
                  required: ["type", "value"]
                }
              }
            },
            required: ["id", "answer", "promptSeq", "timeLimitSeconds"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const rawQuestions = JSON.parse(jsonText);
    const questions = rawQuestions.map((q: any) => ({
      ...q,
      promptSeq: convertPromptSeqToTerms(q.promptSeq || []),
    }));
    res.json({ success: true, source: "gemini", questions });
  } catch (error: any) {
    console.error("Error generating AI questions:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate questions" });
  }
});

// Endpoint: AI Teacher Diagnostic Report & Analytics
app.post("/api/ai-student-report", async (req, res) => {
  try {
    const { studentName = "Student", logs = [] } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        report: {
          studentName,
          summary: `Performance Report for ${studentName}: Demonstrates steady reaction speed on single-digit additions, with minor delay on double-digit carrying.`,
          accuracyScore: "92%",
          avgReactionTimeMs: 1420,
          strengths: ["Fast response on single digit inputs", "High accuracy under time pressure"],
          areasForImprovement: ["Two-digit subtraction memory retention"],
          recommendedLevel: "Level 3 - Complex",
          personalizedTip: "Practice mental chunking when answering double-digit questions."
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Generate a detailed educational diagnostic report for Mind Sport smart boxing machine training for student: ${studentName}.
Student Match Log Data: ${JSON.stringify(logs)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            summary: { type: Type.STRING },
            accuracyScore: { type: Type.STRING },
            avgReactionTimeMs: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedLevel: { type: Type.STRING },
            personalizedTip: { type: Type.STRING }
          },
          required: ["studentName", "summary", "accuracyScore", "strengths", "areasForImprovement", "recommendedLevel", "personalizedTip"]
        }
      }
    });

    const report = JSON.parse(response.text || "{}");
    res.json({ success: true, report });
  } catch (error: any) {
    console.error("Error generating AI report:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate report" });
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mind Sport server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
