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
      const courseContext = `${course.title}: ${course.goal}`;
      
      // Get API keys for each agent
      const contentGenKeys = user.api_keys?.content_generation_agent || {};
      const tutorialKeys = user.api_keys?.tutorial_exercise_agent || {};
      const practicalKeys = user.api_keys?.practical_task_agent || {};
      const quizKeys = user.api_keys?.quiz_agent || {};
      
      // Generate lecture notes first (needed for other agents)
      const contentGenProvider = contentGenKeys.provider || 'openai';
      const contentGenModel = contentGenProvider === 'openai' ? user.openai_model : user.gemini_model;
      const lectureNotes = await generateLectureNotes(
        topic.title, 
        courseContext, 
        contentGenProvider, 
        contentGenModel, 
        contentGenKeys.api_key || null
      );
      
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

