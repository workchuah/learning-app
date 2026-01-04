const Topic = require('../models/Topic');
const Module = require('../models/Module');
const Course = require('../models/Course');
const {
  generateLectureNotes,
  generateTutorialExercises,
  generatePracticalTasks,
  generateQuiz,
  generateAudiobook,
  enhanceContent,
  generateTutorialExercisesManual,
  generateMCQManual,
} = require('../services/contentGenerationAgent');

exports.getTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('module_id', 'title')
      .populate('course_id', 'title goal');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Verify course ownership
    const course = await Course.findById(topic.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(topic);
  } catch (error) {
    next(error);
  }
};

exports.generateTopicContent = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('course_id', 'title goal');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Verify course ownership
    const course = await Course.findById(topic.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    topic.status = 'generating';
    await topic.save();

    try {
      const user = await require('../models/User').findById(req.user._id);
      const courseContext = `${course.title}: ${course.goal}`;
      
      // Get API keys for each agent
      const contentGenKeys = user.api_keys?.content_generation_agent || {};
      const tutorialKeys = user.api_keys?.tutorial_exercise_agent || {};
      const practicalKeys = user.api_keys?.practical_task_agent || {};
      const quizKeys = user.api_keys?.quiz_agent || {};
      const audiobookKeys = user.api_keys?.audiobook_agent || {};
      
      // Get module difficulty level for content generation
      const module = await Module.findById(topic.module_id);
      const difficultyLevel = module?.difficulty_level || 'beginner';
      
      // Generate lecture notes first (needed for other agents)
      const contentGenProvider = contentGenKeys.provider || 'openai';
      const contentGenModel = contentGenProvider === 'openai' ? user.openai_model : user.gemini_model;
      const lectureNotes = await generateLectureNotes(
        topic.title, 
        courseContext, 
        difficultyLevel,
        contentGenProvider, 
        contentGenModel, 
        contentGenKeys.api_key || null
      );
      
      // Generate audiobook (based on lecture notes)
      const audiobookProvider = audiobookKeys.provider || 'openai';
      
      // Generate audiobook
      const audiobookUrl = await generateAudiobook(lectureNotes, audiobookProvider, audiobookKeys.api_key || null).catch(err => {
        console.error('Audiobook generation failed:', err);
        return ''; // Return empty if fails
      });
      
      // Generate other content in parallel (using lecture notes as context)
      const tutorialProvider = tutorialKeys.provider || 'openai';
      const tutorialModel = tutorialProvider === 'openai' ? user.openai_model : user.gemini_model;
      
      const practicalProvider = practicalKeys.provider || 'openai';
      const practicalModel = practicalProvider === 'openai' ? user.openai_model : user.gemini_model;
      
      const quizProvider = quizKeys.provider || 'openai';
      const quizModel = quizProvider === 'openai' ? user.openai_model : user.gemini_model;
      
      const [exercises, tasks, quiz] = await Promise.all([
        generateTutorialExercises(topic.title, courseContext, lectureNotes, tutorialProvider, tutorialModel, tutorialKeys.api_key || null),
        generatePracticalTasks(topic.title, courseContext, lectureNotes, practicalProvider, practicalModel, practicalKeys.api_key || null),
        generateQuiz(topic.title, courseContext, lectureNotes, quizProvider, quizModel, quizKeys.api_key || null),
      ]);

      topic.lecture_notes = lectureNotes;
      topic.audiobook_url = audiobookUrl;
      topic.tutorial_exercises = exercises;
      topic.practical_tasks = tasks;
      topic.quiz = quiz;
      topic.status = 'ready';
      await topic.save();

      res.json({ message: 'Topic content generated successfully', topic });
    } catch (error) {
      topic.status = 'pending';
      await topic.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

exports.updatePracticalTask = async (req, res, next) => {
  try {
    const { taskIndex, completed } = req.body;
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (topic.practical_tasks[taskIndex]) {
      topic.practical_tasks[taskIndex].completed = completed;
      await topic.save();
    }

    res.json(topic);
  } catch (error) {
    next(error);
  }
};

// Manual topic creation (for manual courses)
exports.createTopic = async (req, res, next) => {
  try {
    const { module_id, title } = req.body;
    
    if (!module_id || !title) {
      return res.status(400).json({ error: 'Module ID and topic title are required' });
    }

    const module = await Module.findById(module_id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Verify course ownership
    const course = await Course.findById(module.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get the highest order number for this module
    const maxOrder = await Topic.findOne({ module_id })
      .sort({ order: -1 })
      .select('order');
    
    const order = maxOrder ? maxOrder.order + 1 : 1;

    const topic = await Topic.create({
      module_id,
      course_id: module.course_id,
      title,
      order,
      status: 'pending',
    });

    res.status(201).json(topic);
  } catch (error) {
    next(error);
  }
};

// Enhance pasted content (for manual courses)
exports.enhanceContent = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('course_id', 'title');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Verify course ownership
    const course = await Course.findById(topic.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rawContent } = req.body;
    
    if (!rawContent || rawContent.trim() === '') {
      return res.status(400).json({ error: 'Raw content is required for enhancement.' });
    }

    if (course.course_type !== 'manual') {
      return res.status(400).json({ error: 'Content enhancement is only for manual courses.' });
    }

    topic.status = 'generating';
    await topic.save();

    try {
      const user = await require('../models/User').findById(req.user._id);
      const apiKeys = user.api_keys?.content_generation_agent || {};
      const provider = apiKeys.provider || 'openai';
      const model = provider === 'openai' ? user.openai_model : user.gemini_model;

      const courseContext = `${course.title}: ${course.goal || ''}`;
      const enhancedContent = await enhanceContent(
        rawContent,
        courseContext,
        topic.title,
        provider,
        model,
        apiKeys.api_key || null
      );

      topic.lecture_notes = enhancedContent;
      topic.status = 'ready';
      await topic.save();

      res.json({ message: 'Content enhanced successfully', topic });
    } catch (error) {
      topic.status = 'pending';
      await topic.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Generate only tutorial exercises (10 exercises for manual courses)
exports.generateTutorialExercisesOnly = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('course_id', 'title goal');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Verify course ownership
    const course = await Course.findById(topic.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!topic.lecture_notes) {
      return res.status(400).json({ error: 'Topic must have lecture notes before generating exercises' });
    }

    try {
      const user = await require('../models/User').findById(req.user._id);
      const apiKeys = user.api_keys?.tutorial_exercise_agent || {};
      const provider = apiKeys.provider || 'openai';
      const model = provider === 'openai' ? user.openai_model : user.gemini_model;

      const exercises = await generateTutorialExercisesManual(
        topic.title,
        `${course.title}: ${course.goal || ''}`,
        topic.lecture_notes,
        provider,
        model,
        apiKeys.api_key || null
      );

      topic.tutorial_exercises = exercises;
      await topic.save();

      res.json({ message: 'Tutorial exercises generated successfully', exercises });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

// Generate only MCQ questions (15 questions for manual courses)
exports.generateMCQOnly = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('course_id', 'title goal');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Verify course ownership
    const course = await Course.findById(topic.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!topic.lecture_notes) {
      return res.status(400).json({ error: 'Topic must have lecture notes before generating MCQ' });
    }

    try {
      const user = await require('../models/User').findById(req.user._id);
      const apiKeys = user.api_keys?.quiz_agent || {};
      const provider = apiKeys.provider || 'openai';
      const model = provider === 'openai' ? user.openai_model : user.gemini_model;

      const quiz = await generateMCQManual(
        topic.title,
        `${course.title}: ${course.goal || ''}`,
        topic.lecture_notes,
        provider,
        model,
        apiKeys.api_key || null
      );

      topic.quiz = quiz;
      await topic.save();

      res.json({ message: 'MCQ questions generated successfully', quiz });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

// Update topic (for manual courses only)
exports.updateTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const course = await Course.findById(topic.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (course.course_type !== 'manual') {
      return res.status(400).json({ error: 'Topics can only be edited in manual courses.' });
    }

    const { title } = req.body;
    
    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Topic title is required' });
      }
      topic.title = title.trim();
    }

    await topic.save();
    res.json(topic);
  } catch (error) {
    next(error);
  }
};

// Delete topic (for manual courses only)
exports.deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const course = await Course.findById(topic.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (course.course_type !== 'manual') {
      return res.status(400).json({ error: 'Topics can only be deleted in manual courses.' });
    }

    // Delete progress for this topic
    await require('../models/Progress').deleteMany({ topic_id: topic._id });

    // Delete the topic
    await Topic.findByIdAndDelete(topic._id);

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    next(error);
  }
};

