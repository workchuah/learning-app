const express = require('express');
const courseController = require('../controllers/courseController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', courseController.createCourse);
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);
router.post('/:id/generate-structure', courseController.generateCourseStructure);
router.post('/:id/modules', courseController.createModule); // Manual module creation
router.put('/:id/modules/:moduleId', courseController.updateModule); // Update module
router.delete('/:id/modules/:moduleId', courseController.deleteModule); // Delete module
router.delete('/:id', courseController.deleteCourse);

module.exports = router;

