const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeFeedback(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Analyze this student feedback and return ONLY JSON:

{
  "sentiment": "Positive | Negative | Neutral",
  "category": "Teaching Method | Grading Concern | Attendance | Behavior | Communication",
  "severity_level": "Low | Medium | High | None",
  "severity_reason": "short explanation"
}

Rules:
- If Positive → severity_level = None
- If Negative → assign severity properly

Feedback:
"${text}"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const raw = response.text();

    // Extract JSON safely
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Invalid AI response");

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed;

  } catch (error) {
    console.error("Gemini error:", error.message);

    // fallback (IMPORTANT)
    return {
      sentiment: "Neutral",
      category: "Uncategorized",
      severity_level: "None",
      severity_reason: "Gemini failed"
    };
  }
}

module.exports = analyzeFeedback;