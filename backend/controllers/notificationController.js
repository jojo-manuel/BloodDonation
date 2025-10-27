const Notification = require('../Models/Notification');
const Booking = require('../Models/Booking');
const User = require('../Models/user');
const Donor = require('../Models/donor');
const { sendEmail } = require('../utils/email');
const asyncHandler = require('../Middleware/asyncHandler');

/**
 * Create reschedule notification and send email
 * POST /api/notifications/reschedule
 * Body: { bookingId, newDate, newTime, reason }
 */
exports.createRescheduleNotification = asyncHandler(async (req, res) => {
  const { bookingId, newDate, newTime, reason } = req.body;
  
  if (!bookingId || !newDate || !newTime) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID, new date, and new time are required'
    });
  }
  
  // Get booking details with populated data
  const booking = await Booking.findById(bookingId)
    .populate('donorId')
    .populate('bloodBankId');
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  // Get donor's user ID
  const donor = await Donor.findById(booking.donorId).populate('userId');
  
  if (!donor || !donor.userId) {
    return res.status(404).json({
      success: false,
      message: 'Donor user not found'
    });
  }
  
  const userId = donor.userId._id;
  const userEmail = donor.userId.email;
  const userName = donor.name || donor.userId.name;
  
  // Store old date and time
  const oldDate = booking.date;
  const oldTime = booking.time;
  
  // Update booking with new date and time
  booking.date = new Date(newDate);
  booking.time = newTime;
  await booking.save();
  
  // Create notification
  const notification = await Notification.create({
    userId,
    type: 'slot_reschedule',
    title: '⚠️ Donation Slot Rescheduled',
    message: `Your blood donation slot has been rescheduled. Please check the new date and time.`,
    bookingId: booking._id,
    donationRequestId: booking.donationRequestId,
    rescheduleData: {
      oldDate,
      oldTime,
      newDate: new Date(newDate),
      newTime,
      reason: reason || 'Rescheduled by blood bank',
      bloodBankName: booking.bloodBankName || booking.bloodBankId?.name,
      patientName: booking.patientName,
      bloodGroup: booking.bloodGroup
    },
    priority: 'high'
  });
  
  // Send email notification
  try {
    const emailSubject = '⚠️ Blood Donation Slot Rescheduled';
    const emailText = `
Dear ${userName},

Your blood donation appointment has been RESCHEDULED.

📅 PREVIOUS SLOT:
   Date: ${new Date(oldDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
   Time: ${oldTime}

📅 NEW SLOT:
   Date: ${new Date(newDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
   Time: ${newTime}

🏥 Blood Bank: ${booking.bloodBankName || booking.bloodBankId?.name || 'N/A'}
🩸 Blood Group: ${booking.bloodGroup}
👤 Patient: ${booking.patientName}
📋 Booking ID: ${booking.bookingId}

${reason ? `📝 Reason: ${reason}\n` : ''}
⚠️ IMPORTANT: Please arrive 15 minutes before your scheduled time.

If you cannot make it to the new slot, please contact the blood bank immediately.

Thank you for your cooperation and willingness to donate blood.

Best regards,
Blood Donation Management System
    `.trim();
    
    await sendEmail(userEmail, emailSubject, emailText);
    
    notification.emailSent = true;
    notification.emailSentAt = new Date();
    await notification.save();
    
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
    // Don't fail the request if email fails
  }
  
  res.json({
    success: true,
    message: 'Reschedule notification created and email sent',
    data: notification
  });
});

/**
 * Get unread notifications for logged-in user
 * GET /api/notifications/unread
 */
exports.getUnreadNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const notifications = await Notification.find({
    userId,
    isRead: false
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(50);
  
  res.json({
    success: true,
    data: notifications,
    count: notifications.length
  });
});

/**
 * Get all notifications for logged-in user
 * GET /api/notifications
 */
exports.getAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, type, isRead } = req.query;
  
  const query = { userId };
  
  if (type) {
    query.type = type;
  }
  
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }
  
  const skip = (page - 1) * limit;
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Notification.countDocuments(query);
  
  res.json({
    success: true,
    data: notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Mark notification as read
 * PUT /api/notifications/:notificationId/read
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  const notification = await Notification.findOne({
    _id: notificationId,
    userId
  });
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
  
  res.json({
    success: true,
    message: 'All notifications marked as read',
    count: result.modifiedCount
  });
});

/**
 * Delete notification
 * DELETE /api/notifications/:notificationId
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId
  });
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Notification deleted'
  });
});

module.exports = exports;

