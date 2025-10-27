const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All routes require authentication
router.use(authMiddleware);

// Create reschedule notification (typically called by blood bank staff/admin)
router.post('/reschedule', notificationController.createRescheduleNotification);

// Get unread notifications
router.get('/unread', notificationController.getUnreadNotifications);

// Get all notifications
router.get('/', notificationController.getAllNotifications);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;

