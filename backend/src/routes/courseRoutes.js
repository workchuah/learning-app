const express = require('express');
const courseController = require('../controllers/courseController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', courseController.createCourse);
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);
router.post('/:id/generate-structure', courseController.generateCourseStructure);
router.delete('/:id', courseController.deleteCourse);

// Manual course module/topic management
router.post('/:id/modules', courseController.createModule);
router.patch('/modules/:moduleId', courseController.updateModule);
router.delete('/modules/:moduleId', courseController.deleteModule);
router.post('/modules/:moduleId/topics', courseController.createTopic);
router.patch('/topics/:topicId', courseController.updateTopic);
router.delete('/topics/:topicId', courseController.deleteTopic);

module.exports = router;

