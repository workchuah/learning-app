const aiService = require('./aiService');

async function generateLectureNotes(topicTitle, courseContext, provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert educator. Create comprehensive lecture notes for the following topic.

Course Context: ${courseContext}
Topic: ${topicTitle}

Generate detailed lecture notes that cover:
- Key concepts and definitions
- Important principles and theories
- Examples and applications
- Summary points

Format the notes in clear, well-structured markdown.`;

  const openaiKey = provider === 'openai' ? apiKey : null;
  const geminiKey = provider === 'gemini' ? apiKey : null;
  return await aiService.generate(prompt, provider, model, openaiKey, geminiKey);
}

async function generateTutorialExercises(topicTitle, courseContext, lectureNotes = '', provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert educator. Create tutorial exercises with answers for the following topic.

Course Context: ${courseContext}
Topic: ${topicTitle}

Generate 3-5 tutorial exercises. For each exercise:
- Provide a clear question or problem
- Include a detailed answer/explanation

Format as JSON:
{
  "exercises": [
    {
      "question": "Exercise question here",
      "answer": "Detailed answer and explanation here"
    }
  ]
}

Return only valid JSON, no markdown code blocks.`;

  const openaiKey = provider === 'openai' ? apiKey : null;
  const geminiKey = provider === 'gemini' ? apiKey : null;
  const response = await aiService.generate(prompt, provider, model, openaiKey, geminiKey);
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed.exercises || [];
  } catch (error) {
    console.error('Failed to parse tutorial exercises:', error);
    return [];
  }
}

async function generatePracticalTasks(topicTitle, courseContext, lectureNotes = '', provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert educator. Create practical, hands-on tasks for the following topic.

Course Context: ${courseContext}
Topic: ${topicTitle}

Generate 2-4 practical tasks. Each task should have:
- A clear title
- A description of what needs to be done
- Step-by-step instructions

Format as JSON:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "What the task involves",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

Return only valid JSON, no markdown code blocks.`;

  const openaiKey = provider === 'openai' ? apiKey : null;
  const geminiKey = provider === 'gemini' ? apiKey : null;
  const response = await aiService.generate(prompt, provider, model, openaiKey, geminiKey);
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed.tasks || [];
  } catch (error) {
    console.error('Failed to parse practical tasks:', error);
    return [];
  }
}

async function generateQuiz(topicTitle, courseContext, lectureNotes = '', provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert educator. Create a comprehensive quiz for the following topic.

Course Context: ${courseContext}
Topic: ${topicTitle}

Generate a quiz with:
- 5-7 Multiple Choice Questions (MCQ) with 4 options each
- 2-3 Short Answer Questions

For each MCQ:
- Question
- 4 options (A, B, C, D)
- Correct answer (0-3 index)
- Explanation

For each Short Answer:
- Question
- Sample answer
- Explanation

Format as JSON:
{
  "mcq_questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Why this is correct"
    }
  ],
  "short_answer_questions": [
    {
      "question": "Question text",
      "answer": "Sample answer",
      "explanation": "Explanation"
    }
  ]
}

Return only valid JSON, no markdown code blocks.`;

  const openaiKey = provider === 'openai' ? apiKey : null;
  const geminiKey = provider === 'gemini' ? apiKey : null;
  const response = await aiService.generate(prompt, provider, model, openaiKey, geminiKey);
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse quiz:', error);
    return { mcq_questions: [], short_answer_questions: [] };
  }
}

module.exports = {
  generateLectureNotes,
  generateTutorialExercises,
  generatePracticalTasks,
  generateQuiz,
};

