const aiService = require('./aiService');

async function generateLectureNotes(topicTitle, courseContext, difficultyLevel = 'beginner', provider = 'openai', model = null, apiKey = null) {
  const difficultyInstructions = {
    'beginner': 'Write for complete beginners. Use simple language, provide clear explanations, include basic examples, and avoid advanced terminology. Start from the very basics.',
    'medium': 'Write for intermediate learners. Assume basic knowledge, use appropriate terminology, include more complex examples, and build upon foundational concepts.',
    'expert': 'Write for advanced learners. Use advanced terminology, assume strong foundational knowledge, include complex examples, and cover advanced topics and edge cases.'
  };
  
  const instruction = difficultyInstructions[difficultyLevel?.toLowerCase()] || difficultyInstructions['beginner'];
  
  const prompt = `You are an expert educator. Create comprehensive lecture notes for the following topic.

Course Context: ${courseContext}
Topic: ${topicTitle}
Difficulty Level: ${difficultyLevel?.toUpperCase() || 'BEGINNER'}

${instruction}

Generate detailed lecture notes that cover:
- Key concepts and definitions (appropriate for ${difficultyLevel} level)
- Important principles and theories
- Examples and applications (matching the difficulty level)
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
  const prompt = `You are an expert educator. Create ONE practical, hands-on task for the following topic.

Course Context: ${courseContext}
Topic: ${topicTitle}
${lectureNotes ? `\nLecture Notes:\n${lectureNotes}\n` : ''}

IMPORTANT: Analyze the lecture notes above to understand the difficulty level and concepts covered. 
Generate EXACTLY ONE practical task that:
- Matches the difficulty level of the lecture notes (do not exceed the concepts covered)
- Builds upon the concepts explained in the lecture notes
- Is appropriate for BEGINNER students
- Has EXTREMELY DETAILED step-by-step instructions that a complete beginner can follow exactly

The task should have:
- A clear, descriptive title
- A detailed description of what needs to be done and why it's important
- EXTREMELY DETAILED step-by-step instructions (at least 5-8 steps) where:
  * Each step is specific and actionable
  * Each step includes what to expect/verify at that step
  * Each step is written so a beginner can follow without confusion
  * Include any prerequisites, tools needed, or setup instructions
  * Make it so detailed that a beginner can follow without asking questions

Format as JSON:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description of what the task involves and why it's important",
      "steps": [
        "Step 1: Very detailed instruction with specific actions and expected outcomes",
        "Step 2: Another very detailed instruction with what to check/verify",
        "Step 3: Continue with detailed steps...",
        "Step 4: ...",
        "Step 5: ..."
      ]
    }
  ]
}

IMPORTANT: Generate exactly ONE task with at least 5-8 very detailed steps. Make it beginner-friendly.

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
${lectureNotes ? `\nLecture Notes:\n${lectureNotes}\n` : ''}

Generate a quiz with:
- EXACTLY 10 Multiple Choice Questions (MCQ) with 4 options each
- EXACTLY 5 Short Answer Questions

For each MCQ:
- Question that tests understanding of key concepts from the lecture notes
- 4 options (A, B, C, D) where only one is clearly correct
- Correct answer (0-3 index)
- Detailed explanation of why the correct answer is right and why others are wrong

For each Short Answer:
- Question that requires understanding and explanation
- Sample answer that demonstrates expected depth of knowledge
- Explanation or grading criteria

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

IMPORTANT: Generate exactly 10 MCQ questions and exactly 5 short answer questions.

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

