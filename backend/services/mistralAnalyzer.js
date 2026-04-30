const { Mistral } = require("@mistralai/mistralai");

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw err;
  }
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
          "You are an AI classifier for an Instructor Feedback System. Return only valid JSON.",
      },
      {
        role: "user",
        content: `
Analyze this instructor feedback:

"${complaint_message}"

Return ONLY this JSON format:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "ai_category": "Teaching Quality" | "Behavior" | "Grading" | "Communication" | "Attendance" | "Learning Materials" | "Other",
  "severity_level": "LOW" | "MEDIUM" | "HIGH",
  "ai_severity_reason": "short clear explanation",
  "ai_confidence": 0.00
}

Rules:
- Positive feedback = LOW severity.
- Negative feedback with rude behavior, humiliation, discrimination, harassment, threats, or serious misconduct = HIGH.
- Academic issues like fast teaching, unclear lessons, late feedback = MEDIUM unless severe.
- Simple suggestions or mild concerns = LOW.
- ai_confidence must be a number from 0.00 to 1.00.
`,
      },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content || "";

  try {
    const parsed = safeParseJson(rawText);

    return {
      sentiment: parsed.sentiment || "Neutral",
      ai_category: parsed.ai_category || "Other",
      severity_level: parsed.severity_level || "LOW",
      ai_severity_reason:
        parsed.ai_severity_reason || "No severity reason provided.",
      ai_confidence:
        typeof parsed.ai_confidence === "number" ? parsed.ai_confidence : 0.5,
    };
  } catch (error) {
    console.error("Mistral parse error:", error);
    console.error("Raw Mistral response:", rawText);

    return {
      sentiment: "Neutral",
      ai_category: "Other",
      severity_level: "LOW",
      ai_severity_reason: "AI analysis failed, fallback values used.",
      ai_confidence: 0.0,
    };
  }
}

module.exports = { analyzeFeedback };