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
${lectureNotes ? `\nLecture Notes:\n${lectureNotes}\n` : ''}

Generate 3-5 tutorial exercises based on the lecture notes above. For each exercise:
- Provide a clear question or problem that relates to the concepts in the lecture notes
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
${lectureNotes ? `\nLecture Notes:\n${lectureNotes}\n` : ''}

IMPORTANT: Analyze the lecture notes above to understand the difficulty level and concepts covered. 
Generate 2-4 practical tasks that:
- Match the difficulty level of the lecture notes (do not exceed the concepts covered)
- Build upon the concepts explained in the lecture notes
- Are appropriate for the student's current progress level
- Progress gradually from basic to slightly more advanced (but within the scope of the notes)

Each task should have:
- A clear title
- A description of what needs to be done
- Step-by-step instructions that align with the lecture content

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

async function highlightKeywords(lectureNotes, provider = 'openai', model = null, apiKey = null) {
  const prompt = `You are an expert educator. Analyze the following lecture notes and highlight important keywords and key concepts.

Lecture Notes:
${lectureNotes}

Task:
1. Identify important keywords, key concepts, technical terms, and definitions
2. Return the lecture notes with keywords wrapped in <mark> tags for highlighting
3. Preserve all markdown formatting
4. Only highlight truly important terms (not every word)
5. Focus on: definitions, key concepts, technical terms, important principles

Example format:
Original: "JavaScript is a programming language."
Highlighted: "JavaScript is a <mark>programming language</mark>."

Return the highlighted version of the lecture notes in markdown format, preserving all structure.`;

  const openaiKey = provider === 'openai' ? apiKey : null;
  const geminiKey = provider === 'gemini' ? apiKey : null;
  return await aiService.generate(prompt, provider, model, openaiKey, geminiKey);
}

async function generateAudiobook(lectureNotes, provider = 'openai', apiKey = null) {
  // For audiobook, we'll use OpenAI TTS API or Google Text-to-Speech
  // This requires additional setup - for now, return a placeholder
  // In production, you'd use OpenAI TTS or Google Cloud Text-to-Speech API
  
  try {
    if (provider === 'openai' && apiKey) {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: apiKey });
      const fs = require('fs');
      const path = require('path');
      const { UPLOADS_DIR } = require('../utils/fileStorage');
      
      // Clean lecture notes for TTS (remove markdown, keep text)
      const cleanText = lectureNotes
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/\n{3,}/g, '\n\n') // Clean multiple newlines
        .trim();
      
      // Generate speech using OpenAI TTS
      // Note: TTS-1 has a 4096 character limit per request
      const maxLength = 4096;
      let fullAudioBuffer = null;
      
      if (cleanText.length <= maxLength) {
        // Single request
        const mp3 = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'alloy',
          input: cleanText,
        });
        fullAudioBuffer = Buffer.from(await mp3.arrayBuffer());
      } else {
        // For long texts, use first chunk (in production, you'd merge multiple audio files)
        const mp3 = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'alloy',
          input: cleanText.substring(0, maxLength - 50) + '... [Content continues in full version]',
        });
        fullAudioBuffer = Buffer.from(await mp3.arrayBuffer());
      }
      
      // Save audio file
      const filename = `audiobook-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
      const filepath = path.join(UPLOADS_DIR, filename);
      
      fs.writeFileSync(filepath, fullAudioBuffer);
      
      // Return relative URL (will be served from /uploads)
      return `/uploads/${filename}`;
    } else if (provider === 'gemini' && apiKey) {
      // Google Text-to-Speech would go here
      // For now, return error message
      throw new Error('Gemini TTS not yet implemented. Please use OpenAI for audiobook generation.');
    } else {
      throw new Error('API key not provided for audiobook generation');
    }
  } catch (error) {
    console.error('Audiobook generation error:', error);
    throw new Error(`Failed to generate audiobook: ${error.message}`);
  }
}

module.exports = {
  generateLectureNotes,
  generateTutorialExercises,
  generatePracticalTasks,
  generateQuiz,
  highlightKeywords,
  generateAudiobook,
};

