const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeFeedback(feedbackText) {
  try {
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: `
Analyze this student feedback.

Return ONLY valid JSON:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "category": "Teaching Method" | "Grading Concern" | "Attendance" | "Behavior" | "Communication" | "Classroom Management" | "Learning Materials" | "Professionalism" | "Other",
  "severity_level": "None" | "Low" | "Medium" | "High",
  "severity_reason": "short reason"
}

Rules:
- Positive feedback must have severity_level: "None".
- Negative feedback must have severity_level: "Low", "Medium", or "High".
- High means harassment, humiliation, threats, discrimination, safety issue, or serious misconduct.

Feedback:
"${feedbackText}"
      `
    });

    const parsed = JSON.parse(response.output_text);

    return {
      sentiment: parsed.sentiment || 'Neutral',
      category: parsed.category || 'Other',
      severity_level: parsed.severity_level || 'None',
      severity_reason: parsed.severity_reason || 'No reason provided.'
    };
  } catch (error) {
    console.error('AI analysis error:', error);

    return {
      sentiment: 'Neutral',
      category: 'Uncategorized',
      severity_level: 'None',
      severity_reason: 'AI analysis failed.'
    };
  }
}

module.exports = analyzeFeedback;