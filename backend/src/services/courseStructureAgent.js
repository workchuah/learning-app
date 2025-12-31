const aiService = require('./aiService');

async function generateCourseStructure(courseTitle, courseGoal, targetTimeline, outlineText = '', provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert course designer. Create a structured course breakdown.

Course Title: ${courseTitle}
Course Goal: ${courseGoal}
Target Timeline: ${targetTimeline}
${outlineText ? `Course Outline:\n${outlineText}\n` : ''}

Generate a JSON structure with modules and topics. Each module should have:
- title: Module title
- description: Brief description
- topics: Array of topic titles

Format your response as valid JSON only, no markdown, no code blocks:
{
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "topics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ]
}

Make it comprehensive and well-structured for the given timeline.`;

  const openaiKey = provider === 'openai' ? apiKey : null;
  const geminiKey = provider === 'gemini' ? apiKey : null;
  const response = await aiService.generate(prompt, provider, model, openaiKey, geminiKey);
  
  // Extract JSON from response (handle markdown code blocks if present)
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse course structure:', error);
    throw new Error('Failed to generate valid course structure');
  }
}

module.exports = { generateCourseStructure };

