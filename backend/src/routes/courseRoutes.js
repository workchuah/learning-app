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

module.exports = router;

