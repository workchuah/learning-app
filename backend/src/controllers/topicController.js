const Topic = require('../models/Topic');
const Module = require('../models/Module');
const Course = require('../models/Course');
const {
  generateLectureNotes,
  generateTutorialExercises,
  generatePracticalTasks,
  generateQuiz,
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
      const provider = user.ai_provider_preference || 'auto';
      const model = provider === 'openai' ? user.openai_model : user.gemini_model;
      const courseContext = `${course.title}: ${course.goal}`;
      const apiKeys = user.api_keys?.content_generation_agent || {};

      // Generate all content
      const [lectureNotes, exercises, tasks, quiz] = await Promise.all([
        generateLectureNotes(topic.title, courseContext, provider, model, apiKeys.openai_key || null, apiKeys.gemini_key || null),
        generateTutorialExercises(topic.title, courseContext, provider, model, apiKeys.openai_key || null, apiKeys.gemini_key || null),
        generatePracticalTasks(topic.title, courseContext, provider, model, apiKeys.openai_key || null, apiKeys.gemini_key || null),
        generateQuiz(topic.title, courseContext, provider, model, apiKeys.openai_key || null, apiKeys.gemini_key || null),
      ]);

      topic.lecture_notes = lectureNotes;
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

