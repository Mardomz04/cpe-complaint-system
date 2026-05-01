const { Mistral } = require("@mistralai/mistralai");

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw err;
  }
}

function normalizeSeverity(value) {
  const v = String(value || "").toLowerCase();

  if (v.includes("high")) return "High";
  if (v.includes("medium")) return "Medium";
  if (v.includes("low")) return "Low";
  if (v.includes("none")) return "None";

  return "None";
}

function normalizeSentiment(value) {
  const v = String(value || "").toLowerCase();

  if (v.includes("positive")) return "Positive";
  if (v.includes("negative")) return "Negative";
  if (v.includes("neutral")) return "Neutral";

  return "Neutral";
}

function normalizeConfidence(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0.5;
  return Math.min(1, Math.max(0, num));
}

async function analyzeFeedback(complaint_message) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is missing.");
  }

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an AI classifier for an Instructor Feedback System. Return only valid JSON. Do not use markdown.",
      },
      {
        role: "user",
        content: `
Analyze this instructor feedback:

"${complaint_message}"

Return ONLY this JSON format:
{
  "sentiment": "Positive | Negative | Neutral",
  "ai_category": "Teaching Quality | Behavior | Grading | Communication | Attendance | Learning Materials | Other",
  "severity_level": "None | Low | Medium | High",
  "ai_severity_reason": "short clear explanation",
  "ai_confidence": 0.00
}

Rules:
- Positive feedback = severity "None".
- Neutral feedback = severity "None".
- Negative feedback with rude behavior, humiliation, discrimination, harassment, threats, or serious misconduct = severity "High".
- Academic issues like fast teaching, unclear lessons, late feedback = severity "Medium" unless severe.
- Simple suggestions or mild concerns = severity "Low".
- ai_confidence must be a number from 0.00 to 1.00.
`,
      },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content || "";

  try {
    const parsed = safeParseJson(rawText);

    const sentiment = normalizeSentiment(parsed.sentiment);
    let severity_level = normalizeSeverity(parsed.severity_level);

    if (sentiment === "Positive" || sentiment === "Neutral") {
      severity_level = "None";
    }

    return {
      sentiment,
      ai_category: parsed.ai_category || "Other",
      severity_level,
      ai_severity_reason:
        parsed.ai_severity_reason || "No severity reason provided.",
      ai_confidence: normalizeConfidence(parsed.ai_confidence),
    };
  } catch (error) {
    console.error("Mistral parse error:", error);
    console.error("Raw Mistral response:", rawText);

    return {
      sentiment: "Neutral",
      ai_category: "Other",
      severity_level: "None",
      ai_severity_reason: "AI analysis failed, fallback values used.",
      ai_confidence: 0.0,
    };
  }
}

module.exports = analyzeFeedback;