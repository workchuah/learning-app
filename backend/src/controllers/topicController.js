const Topic = require('../models/Topic');
const Module = require('../models/Module');
const Course = require('../models/Course');
const {
  generateLectureNotes,
  generateTutorialExercises,
  generatePracticalTasks,
  generateQuiz,
  highlightKeywords,
  generateAudiobook,
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
      const keywordKeys = user.api_keys?.keyword_highlighting_agent || {};
      const audiobookKeys = user.api_keys?.audiobook_agent || {};
      
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
      
      // Generate keyword highlighting and audiobook (based on lecture notes)
      const keywordProvider = keywordKeys.provider || 'openai';
      const keywordModel = keywordProvider === 'openai' ? user.openai_model : user.gemini_model;
      
      const audiobookProvider = audiobookKeys.provider || 'openai';
      
      // Generate keyword highlighting and audiobook in parallel
      const [highlightedNotes, audiobookUrl] = await Promise.all([
        highlightKeywords(lectureNotes, keywordProvider, keywordModel, keywordKeys.api_key || null).catch(err => {
          console.error('Keyword highlighting failed:', err);
          return lectureNotes; // Fallback to original notes
        }),
        generateAudiobook(lectureNotes, audiobookProvider, audiobookKeys.api_key || null).catch(err => {
          console.error('Audiobook generation failed:', err);
          return ''; // Return empty if fails
        }),
      ]);
      
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
      topic.highlighted_lecture_notes = highlightedNotes;
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

// Regenerate individual sections
exports.regenerateSection = async (req, res, next) => {
  try {
    const { section } = req.params;
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

    const user = await require('../models/User').findById(req.user._id);
    const courseContext = `${course.title}: ${course.goal}`;

    try {
      switch (section) {
        case 'lecture_notes': {
          const contentGenKeys = user.api_keys?.content_generation_agent || {};
          const provider = contentGenKeys.provider || 'openai';
          const model = provider === 'openai' ? user.openai_model : user.gemini_model;
          const lectureNotes = await generateLectureNotes(
            topic.title, 
            courseContext, 
            provider, 
            model, 
            contentGenKeys.api_key || null
          );
          topic.lecture_notes = lectureNotes;
          await topic.save();
          return res.json({ message: 'Lecture notes regenerated successfully', topic });
        }

        case 'highlighted_notes': {
          if (!topic.lecture_notes) {
            return res.status(400).json({ error: 'Lecture notes must be generated first' });
          }
          const keywordKeys = user.api_keys?.keyword_highlighting_agent || {};
          const provider = keywordKeys.provider || 'openai';
          const model = provider === 'openai' ? user.openai_model : user.gemini_model;
          const highlightedNotes = await highlightKeywords(
            topic.lecture_notes, 
            provider, 
            model, 
            keywordKeys.api_key || null
          );
          topic.highlighted_lecture_notes = highlightedNotes;
          await topic.save();
          return res.json({ message: 'Highlighted notes regenerated successfully', topic });
        }

        case 'audiobook': {
          if (!topic.lecture_notes) {
            return res.status(400).json({ error: 'Lecture notes must be generated first' });
          }
          const audiobookKeys = user.api_keys?.audiobook_agent || {};
          const provider = audiobookKeys.provider || 'openai';
          const audiobookUrl = await generateAudiobook(
            topic.lecture_notes, 
            provider, 
            audiobookKeys.api_key || null
          );
          topic.audiobook_url = audiobookUrl;
          await topic.save();
          return res.json({ message: 'Audiobook regenerated successfully', topic });
        }

        case 'tutorial_exercises': {
          if (!topic.lecture_notes) {
            return res.status(400).json({ error: 'Lecture notes must be generated first' });
          }
          const tutorialKeys = user.api_keys?.tutorial_exercise_agent || {};
          const provider = tutorialKeys.provider || 'openai';
          const model = provider === 'openai' ? user.openai_model : user.gemini_model;
          const exercises = await generateTutorialExercises(
            topic.title, 
            courseContext, 
            topic.lecture_notes, 
            provider, 
            model, 
            tutorialKeys.api_key || null
          );
          topic.tutorial_exercises = exercises;
          await topic.save();
          return res.json({ message: 'Tutorial exercises regenerated successfully', topic });
        }

        case 'practical_tasks': {
          if (!topic.lecture_notes) {
            return res.status(400).json({ error: 'Lecture notes must be generated first' });
          }
          const practicalKeys = user.api_keys?.practical_task_agent || {};
          const provider = practicalKeys.provider || 'openai';
          const model = provider === 'openai' ? user.openai_model : user.gemini_model;
          const tasks = await generatePracticalTasks(
            topic.title, 
            courseContext, 
            topic.lecture_notes, 
            provider, 
            model, 
            practicalKeys.api_key || null
          );
          topic.practical_tasks = tasks;
          await topic.save();
          return res.json({ message: 'Practical tasks regenerated successfully', topic });
        }

        case 'quiz': {
          if (!topic.lecture_notes) {
            return res.status(400).json({ error: 'Lecture notes must be generated first' });
          }
          const quizKeys = user.api_keys?.quiz_agent || {};
          const provider = quizKeys.provider || 'openai';
          const model = provider === 'openai' ? user.openai_model : user.gemini_model;
          const quiz = await generateQuiz(
            topic.title, 
            courseContext, 
            topic.lecture_notes, 
            provider, 
            model, 
            quizKeys.api_key || null
          );
          topic.quiz = quiz;
          await topic.save();
          return res.json({ message: 'Quiz regenerated successfully', topic });
        }

        default:
          return res.status(400).json({ error: 'Invalid section specified' });
      }
    } catch (error) {
      console.error(`Error regenerating ${section}:`, error);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

