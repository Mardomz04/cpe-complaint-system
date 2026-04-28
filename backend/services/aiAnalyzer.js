const { GoogleGenerativeAI } = require('@google/generative-ai');

async function analyzeFeedback(text) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      sentiment: 'Neutral',
      category: 'Uncategorized',
      severity_level: 'None',
      severity_reason: 'GEMINI_API_KEY is missing in Render environment.'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    });

    const prompt = `
You are analyzing anonymous student feedback.

Return ONLY valid JSON. No markdown. No explanation.

JSON format:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "category": "Teaching Method" | "Grading Concern" | "Attendance" | "Behavior" | "Communication" | "Classroom Management" | "Learning Materials" | "Professionalism" | "Other",
  "severity_level": "None" | "Low" | "Medium" | "High",
  "severity_reason": "short explanation"
}

Rules:
- If sentiment is Positive, severity_level must be "None".
- If sentiment is Neutral, severity_level should be "None".
- If sentiment is Negative, severity_level must be "Low", "Medium", or "High".
- High means harassment, humiliation, threats, discrimination, unsafe behavior, repeated serious misconduct, or severe unfair grading.
- Medium means concerning but not dangerous.
- Low means minor dissatisfaction.

Feedback:
"${text}"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const raw = response.text();

    console.log('Gemini raw response:', raw);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error(`Gemini returned non-JSON response: ${raw}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      sentiment: parsed.sentiment || 'Neutral',
      category: parsed.category || 'Other',
      severity_level: parsed.severity_level || 'None',
      severity_reason: parsed.severity_reason || 'No reason provided.'
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);

    return {
      sentiment: 'Neutral',
      category: 'Uncategorized',
      severity_level: 'None',
      severity_reason: `Gemini failed: ${error.message || 'Unknown error'}`
    };
  }
}

module.exports = analyzeFeedback;