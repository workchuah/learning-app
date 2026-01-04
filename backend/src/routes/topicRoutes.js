const express = require('express');
const topicController = require('../controllers/topicController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/:id', topicController.getTopic);
router.post('/:id/generate-content', topicController.generateTopicContent);
router.patch('/:id/practical-task', topicController.updatePracticalTask);
// Manual topic creation and content enhancement endpoints
router.post('/', topicController.createTopic); // Create topic manually
router.put('/:id', topicController.updateTopic); // Update topic
router.delete('/:id', topicController.deleteTopic); // Delete topic
router.post('/:id/enhance-content', topicController.enhanceContent); // Enhance pasted content
router.post('/:id/generate-tutorial-exercises', topicController.generateTutorialExercisesOnly); // Generate 10 exercises
router.post('/:id/generate-mcq', topicController.generateMCQOnly); // Generate 15 MCQ

module.exports = router;

