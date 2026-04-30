const { Mistral } = require("@mistralai/mistralai");

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

async function analyzeFeedback(message) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("Missing MISTRAL_API_KEY");
  }

  const prompt = `
You are an AI assistant for an Instructor Feedback System.

Analyze this student feedback:

"${message}"

Return ONLY valid JSON with this structure:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "ai_category": "Teaching Quality" | "Behavior" | "Grading" | "Communication" | "Attendance" | "Learning Materials" | "Other",
  "severity_level": "LOW" | "MEDIUM" | "HIGH",
  "ai_severity_reason": "short explanation"
}

Rules:
- Positive feedback should usually be LOW severity.
- Negative feedback involving harassment, discrimination, threats, humiliation, or serious misconduct should be HIGH.
- Mild complaints should be LOW or MEDIUM.
`;

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  const text = response.choices?.[0]?.message?.content;

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Mistral raw response:", text);

    return {
      sentiment: "Neutral",
      ai_category: "Other",
      severity_level: "LOW",
      ai_severity_reason: "AI response could not be parsed safely.",
    };
  }
}

module.exports = { analyzeFeedback };