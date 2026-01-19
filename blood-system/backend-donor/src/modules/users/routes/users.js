const express = require('express');
const router = express.Router();

const { authenticate } = require('../../../middleware/authMiddleware');
const userController = require('../controllers/userController');

// All routes here should be protected
router.use(authenticate);

router.get('/me', userController.getMe);
router.get('/me/comprehensive', userController.getComprehensiveProfile);
router.post('/me/profile-image', userController.uploadProfileImage);
router.post('/direct-book-slot', userController.directBookSlot);

module.exports = router;
