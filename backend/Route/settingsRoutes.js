// routes/settingsRoutes.js
// Routes for user settings management

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

console.log('settingsController exports:', settingsController);
console.log('getSettings:', settingsController.getSettings);

const {
  getSettings,
  updateSettings,
  resetSettings,
  updateSettingCategory
} = settingsController;
const { protect } = require('../Middleware/authMiddleware');

console.log('protect middleware:', protect);
console.log('getSettings after destructure:', getSettings);

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/', protect, getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update user settings (all categories)
 * @access  Private
 */
router.put('/', protect, updateSettings);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to default values
 * @access  Private
 */
router.post('/reset', protect, resetSettings);

/**
 * @route   PATCH /api/settings/:category
 * @desc    Update specific category (notifications, security, appearance, privacy, regional)
 * @access  Private
 */
router.patch('/:category', protect, updateSettingCategory);

module.exports = router;

