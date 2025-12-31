const aiService = require('./aiService');

async function generateCourseStructure(courseTitle, courseGoal, outlineText = '', provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert course designer. Create a comprehensive structured course breakdown organized by difficulty levels.

Course Title: ${courseTitle}
Course Goal: ${courseGoal}
${outlineText ? `Course Outline:\n${outlineText}\n` : ''}

CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. Generate EXACTLY 30 modules total (NOT 15, NOT 20, EXACTLY 30):
   - EXACTLY 10 modules for BEGINNER level (modules 1-10)
   - EXACTLY 10 modules for MEDIUM level (modules 11-20)
   - EXACTLY 10 modules for EXPERT level (modules 21-30)
   - DO NOT stop at 15 modules - you MUST generate all 30 modules

2. Each module should have:
   - title: Unique, descriptive module title
   - description: Brief description of what the module covers
   - difficulty_level: "beginner", "medium", or "expert"
   - topics: Array of EXACTLY 5 unique topic titles per module (NOT 3-5, EXACTLY 5)

3. Topic Requirements:
   - NO topic should be repeated across modules
   - All topics must be related to the main course goal
   - Topics should build progressively within each difficulty level
   - Beginner topics: Foundation, basics, introduction concepts
   - Medium topics: Intermediate concepts building on beginner knowledge
   - Expert topics: Advanced concepts, mastery-level topics

4. Timeline Estimation:
   - Default to "36 months" for comprehensive mastery
   - Consider: 30 modules × 5 topics per module = 150 topics total
   - This is a comprehensive course requiring significant time investment
   - Always return "36 months" as the estimated timeline

5. Module Order:
   - All 10 Beginner modules first (order 1-10)
   - Then all 10 Medium modules (order 11-20)
   - Then all 10 Expert modules (order 21-30)

Format your response as valid JSON only, no markdown, no code blocks:
{
  "estimated_timeline": "36 months",
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "difficulty_level": "beginner",
      "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
    },
    {
      "title": "Module 2 Title",
      "description": "Module description",
      "difficulty_level": "beginner",
      "topics": ["Topic 6", "Topic 7", "Topic 8", "Topic 9", "Topic 10"]
    }
    // ... continue for ALL 30 modules (10 beginner, 10 medium, 10 expert)
    // Each module MUST have exactly 5 topics
  ]
}

CRITICAL: 
- You MUST generate exactly 30 modules total (10 beginner + 10 medium + 10 expert)
- Each module MUST have exactly 5 topics (not 3, not 4, exactly 5)
- Total topics: 30 modules × 5 topics = 150 unique topics
- Ensure NO topic repetition across all 150 topics
- All topics must relate to the course goal
- Always set estimated_timeline to "36 months"

MANDATORY CHECKLIST - Verify before responding:
✓ I have generated exactly 30 modules (10 beginner + 10 medium + 10 expert)
✓ Each module has exactly 5 topics (150 topics total)
✓ No topic is repeated across any module
✓ All topics relate to the course goal: "${courseGoal}"
✓ estimated_timeline is set to "36 months"
✓ All modules are properly categorized by difficulty level

DO NOT submit if any item above is not met. Generate the complete structure with all 30 modules.`;

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

