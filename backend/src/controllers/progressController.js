const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Topic = require('../models/Topic');

exports.updateProgress = async (req, res, next) => {
  try {
    const { course_id, module_id, topic_id, type, completed, quiz_score, answers } = req.body;

    let progress = await Progress.findOne({
      user_id: req.user._id,
      course_id,
      ...(module_id && { module_id }),
      ...(topic_id && { topic_id }),
      type,
    });

    if (!progress) {
      progress = await Progress.create({
        user_id: req.user._id,
        course_id,
        module_id: module_id || null,
        topic_id: topic_id || null,
        type,
        completed: completed || false,
        quiz_score: quiz_score || null,
      });
    } else {
      if (completed !== undefined) {
        progress.completed = completed;
        if (completed) {
          progress.completed_at = new Date();
        }
      }
      if (quiz_score !== undefined) {
        progress.quiz_score = quiz_score;
        progress.quiz_attempts.push({
          score: quiz_score,
          submitted_at: new Date(),
          answers: answers || {},
        });
      }
      progress.last_accessed_at = new Date();
      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    next(error);
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const { course_id, topic_id } = req.query;
    
    const query = { user_id: req.user._id };
    if (course_id) query.course_id = course_id;
    if (topic_id) query.topic_id = topic_id;

    const progress = await Progress.find(query).sort({ createdAt: -1 });
    res.json(progress);
  } catch (error) {
    next(error);
  }
};

exports.getCourseProgress = async (req, res, next) => {
  try {
    const course_id = req.params.courseId;
    
    const progress = await Progress.find({
      user_id: req.user._id,
      course_id,
    });

    const topics = await Topic.find({ course_id });
    const progressMap = {};
    
    progress.forEach(p => {
      if (p.topic_id) {
        progressMap[p.topic_id.toString()] = p;
      }
    });

    const result = {
      course_id,
      topics: topics.map(topic => ({
        topic_id: topic._id,
        title: topic.title,
        progress: progressMap[topic._id.toString()] || null,
      })),
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

