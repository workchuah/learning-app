const express = require('express');
const progressController = require('../controllers/progressController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', progressController.updateProgress);
router.get('/', progressController.getProgress);
router.get('/course/:courseId', progressController.getCourseProgress);

module.exports = router;

