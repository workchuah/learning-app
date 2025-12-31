const aiService = require('./aiService');

async function generateCourseStructure(courseTitle, courseGoal, targetTimeline, outlineText = '', provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert course designer. Create a structured course breakdown organized by difficulty levels.

Course Title: ${courseTitle}
Course Goal: ${courseGoal}
Target Timeline: ${targetTimeline}
${outlineText ? `Course Outline:\n${outlineText}\n` : ''}

IMPORTANT: Organize the course into THREE difficulty levels that progress logically:
1. BEGINNER Level - Foundation concepts, basics, introduction
2. MEDIUM Level - Intermediate concepts, building on beginner knowledge
3. EXPERT Level - Advanced concepts, mastery-level topics

The course MUST progress from Beginner → Medium → Expert. Each level should have multiple modules, and each module should have multiple topics.

Generate a JSON structure with modules and topics. Each module should have:
- title: Module title
- description: Brief description
- difficulty_level: "beginner", "medium", or "expert"
- topics: Array of topic titles

Format your response as valid JSON only, no markdown, no code blocks:
{
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "difficulty_level": "beginner",
      "topics": ["Topic 1", "Topic 2", "Topic 3"]
    },
    {
      "title": "Module 2 Title",
      "description": "Module description",
      "difficulty_level": "beginner",
      "topics": ["Topic 4", "Topic 5"]
    },
    {
      "title": "Module 3 Title",
      "description": "Module description",
      "difficulty_level": "medium",
      "topics": ["Topic 6", "Topic 7", "Topic 8"]
    },
    {
      "title": "Module 4 Title",
      "description": "Module description",
      "difficulty_level": "expert",
      "topics": ["Topic 9", "Topic 10"]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Modules MUST be ordered: All Beginner modules first, then Medium, then Expert
- Ensure smooth progression from basic concepts to advanced
- Make it comprehensive and well-structured for the given timeline
- Distribute modules across all three difficulty levels`;

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

