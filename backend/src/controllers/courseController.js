const Course = require('../models/Course');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const { generateCourseStructure } = require('../services/courseStructureAgent');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { UPLOADS_DIR } = require('../utils/fileStorage');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'outline-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and MD files are allowed'));
    }
  },
}).single('outline');

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } else if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

exports.createCourse = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { title, goal, course_type } = req.body;
        let outlineText = '';

        if (req.file) {
          outlineText = await extractTextFromFile(req.file.path);
        }

        const courseType = course_type || 'ai_generated';
        
        // Validate: AI-generated courses require goal
        if (courseType === 'ai_generated' && (!goal || goal.trim() === '')) {
          return res.status(400).json({ error: 'Course goal is required for AI-generated courses' });
        }

        // For manual courses, goal is optional - always set to empty string
        // For AI-generated courses, use the provided goal
        const goalValue = (courseType === 'manual') ? '' : (goal || '');
        
        const courseData = {
          title,
          goal: goalValue, // Always a string (empty for manual, provided value for AI-generated)
          course_type: courseType,
          target_timeline: '', // Will be estimated during structure generation
          outline_file: req.file ? req.file.filename : '',
          outline_text: outlineText,
          created_by: req.user._id,
          status: 'draft',
        };

        // Debug: Log the data being sent to Course.create
        console.log('Creating course:', { 
          title: courseData.title, 
          goal: courseData.goal, 
          goalType: typeof courseData.goal,
          goalLength: courseData.goal.length,
          course_type: courseData.course_type 
        });

        const course = await Course.create(courseData);

        res.status(201).json(course);
      } catch (error) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ created_by: req.user._id })
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const modules = await Module.find({ course_id: course._id }).sort({ order: 1 });
    const topics = await Topic.find({ course_id: course._id }).sort({ order: 1 });
    
    // Get progress for all topics
    const Progress = require('../models/Progress');
    const progressRecords = await Progress.find({
      user_id: req.user._id,
      course_id: course._id,
      type: 'topic',
    });
    
    // Create a map of topic_id to progress
    const progressMap = {};
    progressRecords.forEach(p => {
      if (p.topic_id) {
        progressMap[p.topic_id.toString()] = {
          completed: p.completed || false,
          quiz_score: p.quiz_score || null,
        };
      }
    });
    
    // Add progress info to topics
    const topicsWithProgress = topics.map(topic => ({
      ...topic.toObject(),
      progress: progressMap[topic._id.toString()] || null,
    }));
    
    // Calculate progress
    const totalTopics = topics.length;
    const completedTopics = progressRecords.filter(p => p.completed).length;
    
    const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    course.progress_percentage = progressPercentage;
    await course.save();

    res.json({ course, modules, topics: topicsWithProgress });
  } catch (error) {
    next(error);
  }
};

exports.generateCourseStructure = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Course not found' });
    }

    course.status = 'generating';
    await course.save();

    try {
      const user = await require('../models/User').findById(req.user._id);
      const apiKeys = user.api_keys?.course_structure_agent || {};
      const provider = apiKeys.provider || 'openai';
      const model = provider === 'openai' ? user.openai_model : user.gemini_model;
      const structure = await generateCourseStructure(
        course.title,
        course.goal,
        course.outline_text,
        provider,
        model,
        apiKeys.api_key || null
      );

      // Save estimated timeline (default to 36 months if not provided)
      course.target_timeline = structure.estimated_timeline || '36 months';

      // Create modules and topics
      // Sort modules to ensure Beginner → Medium → Expert order
      const difficultyOrder = { 'beginner': 1, 'medium': 2, 'expert': 3 };
      const sortedModules = structure.modules.sort((a, b) => {
        const levelA = difficultyOrder[a.difficulty_level?.toLowerCase()] || 1;
        const levelB = difficultyOrder[b.difficulty_level?.toLowerCase()] || 1;
        if (levelA !== levelB) return levelA - levelB;
        return 0;
      });

      // Verify we have exactly 30 modules (10 per level)
      const beginnerCount = sortedModules.filter(m => m.difficulty_level?.toLowerCase() === 'beginner').length;
      const mediumCount = sortedModules.filter(m => m.difficulty_level?.toLowerCase() === 'medium').length;
      const expertCount = sortedModules.filter(m => m.difficulty_level?.toLowerCase() === 'expert').length;
      
      if (sortedModules.length !== 30 || beginnerCount !== 10 || mediumCount !== 10 || expertCount !== 10) {
        throw new Error(`Course structure generation failed: Expected 30 modules (10 beginner, 10 medium, 10 expert), but got ${sortedModules.length} modules (${beginnerCount} beginner, ${mediumCount} medium, ${expertCount} expert). Please try generating again.`);
      }

      // Verify each module has exactly 5 topics
      for (let i = 0; i < sortedModules.length; i++) {
        const moduleData = sortedModules[i];
        if (!moduleData.topics || moduleData.topics.length !== 5) {
          throw new Error(`Module "${moduleData.title}" (${moduleData.difficulty_level}) has ${moduleData.topics?.length || 0} topics. Each module must have exactly 5 topics. Please try generating again.`);
        }
      }

      let order = 1;
      for (const moduleData of sortedModules) {
        const module = await Module.create({
          course_id: course._id,
          title: moduleData.title,
          description: moduleData.description || '',
          difficulty_level: (moduleData.difficulty_level || 'beginner').toLowerCase(),
          order: order++,
        });

        let topicOrder = 1;
        for (const topicTitle of moduleData.topics) {
          await Topic.create({
            module_id: module._id,
            course_id: course._id,
            title: topicTitle,
            order: topicOrder++,
            status: 'pending',
          });
        }
      }

      course.status = 'ready';
      await course.save();

      res.json({ message: 'Course structure generated successfully' });
    } catch (error) {
      course.status = 'draft';
      await course.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete associated modules and topics
    const modules = await Module.find({ course_id: course._id });
    for (const module of modules) {
      await Topic.deleteMany({ module_id: module._id });
    }
    await Module.deleteMany({ course_id: course._id });
    await require('../models/Progress').deleteMany({ course_id: course._id });

    // Delete outline file if exists
    if (course.outline_file) {
      const filePath = path.join(UPLOADS_DIR, course.outline_file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Manual module creation (for manual courses)
exports.createModule = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.course_type !== 'manual') {
      return res.status(400).json({ error: 'Modules can only be manually added to manual courses.' });
    }

    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    // Get the highest order number for this course
    const maxOrder = await Module.findOne({ course_id: course._id })
      .sort({ order: -1 })
      .select('order');
    
    const order = maxOrder ? maxOrder.order + 1 : 1;

    const module = await Module.create({
      course_id: course._id,
      title,
      description: description || '',
      order,
      difficulty_level: 'beginner', // Default for manual courses
    });

    res.status(201).json(module);
  } catch (error) {
    next(error);
  }
};

// Update module (for manual courses only)
exports.updateModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const course = await Course.findById(module.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (course.course_type !== 'manual') {
      return res.status(400).json({ error: 'Modules can only be edited in manual courses.' });
    }

    const { title, description } = req.body;
    
    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Module title is required' });
      }
      module.title = title.trim();
    }
    
    if (description !== undefined) {
      module.description = description || '';
    }

    await module.save();
    res.json(module);
  } catch (error) {
    next(error);
  }
};

// Delete module (for manual courses only)
exports.deleteModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const course = await Course.findById(module.course_id);
    if (!course || course.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (course.course_type !== 'manual') {
      return res.status(400).json({ error: 'Modules can only be deleted in manual courses.' });
    }

    // Delete all topics in this module
    await Topic.deleteMany({ module_id: module._id });
    // Delete progress for this module
    await require('../models/Progress').deleteMany({ module_id: module._id });

    // Delete the module
    await Module.findByIdAndDelete(module._id);

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    next(error);
  }
};

