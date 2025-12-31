const aiService = require('./aiService');

async function generateCourseStructure(courseTitle, courseGoal, outlineText = '', provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert course designer. Create a comprehensive structured course breakdown organized by difficulty levels.

Course Title: ${courseTitle}
Course Goal: ${courseGoal}
${outlineText ? `Course Outline:\n${outlineText}\n` : ''}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 30 modules total:
   - EXACTLY 10 modules for BEGINNER level
   - EXACTLY 10 modules for MEDIUM level
   - EXACTLY 10 modules for EXPERT level

2. Each module should have:
   - title: Unique, descriptive module title
   - description: Brief description of what the module covers
   - difficulty_level: "beginner", "medium", or "expert"
   - topics: Array of 3-5 unique topic titles per module

3. Topic Requirements:
   - NO topic should be repeated across modules
   - All topics must be related to the main course goal
   - Topics should build progressively within each difficulty level
   - Beginner topics: Foundation, basics, introduction concepts
   - Medium topics: Intermediate concepts building on beginner knowledge
   - Expert topics: Advanced concepts, mastery-level topics

4. Timeline Estimation:
   - Estimate the total time needed to master this course
   - Consider: 30 modules × average 3-5 topics per module = 90-150 topics
   - Assume average study time per topic
   - Provide estimate in format like "12 weeks", "3 months", "6 months", etc.

5. Module Order:
   - All 10 Beginner modules first (order 1-10)
   - Then all 10 Medium modules (order 11-20)
   - Then all 10 Expert modules (order 21-30)

Format your response as valid JSON only, no markdown, no code blocks:
{
  "estimated_timeline": "X weeks/months",
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "difficulty_level": "beginner",
      "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]
    },
    {
      "title": "Module 2 Title",
      "description": "Module description",
      "difficulty_level": "beginner",
      "topics": ["Topic 5", "Topic 6", "Topic 7"]
    }
    // ... continue for all 30 modules (10 beginner, 10 medium, 10 expert)
  ]
}

IMPORTANT: 
- Generate exactly 30 modules (10 per difficulty level)
- Ensure NO topic repetition
- All topics must relate to the course goal
- Provide realistic timeline estimate based on course scope`;

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

