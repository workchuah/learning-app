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
        const { title, goal } = req.body;
        let outlineText = '';

        if (req.file) {
          outlineText = await extractTextFromFile(req.file.path);
        }

        const course = await Course.create({
          title,
          goal,
          target_timeline: '', // Will be estimated during structure generation
          outline_file: req.file ? req.file.filename : '',
          outline_text: outlineText,
          created_by: req.user._id,
          status: 'draft',
        });

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
    
    // Calculate progress
    const totalTopics = topics.length;
    const completedTopics = await require('../models/Progress').countDocuments({
      user_id: req.user._id,
      course_id: course._id,
      type: 'topic',
      completed: true,
    });
    
    const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    course.progress_percentage = progressPercentage;
    await course.save();

    res.json({ course, modules, topics });
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

