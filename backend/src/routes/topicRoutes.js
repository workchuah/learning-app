const express = require('express');
const topicController = require('../controllers/topicController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/:id', topicController.getTopic);
router.post('/:id/generate-content', topicController.generateTopicContent);
router.patch('/:id/practical-task', topicController.updatePracticalTask);

module.exports = router;

