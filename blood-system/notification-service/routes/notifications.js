const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// ==========================================
// EMAIL CONFIGURATION
// ==========================================

const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// ==========================================
// ROUTES
// ==========================================

/**
 * POST /notifications/send
 * Send notification (Email or SMS)
 * Access: BLOODBANK_ADMIN
 */
const Notification = require('../models/Notification');

// ... (Email/SMS logic remains)

/**
 * GET /notifications/unread
 * Get unread notification count
 * Access: Authenticated User
 */
router.get('/unread', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ success: false, message: 'User context missing' });

        const count = await Notification.countDocuments({ recipient: userId, isRead: false });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /notifications
 * List notifications for current user
 * Access: Authenticated User
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ success: false, message: 'User context missing' });

        const { limit = 10, skip = 0 } = req.query;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Notification.countDocuments({ recipient: userId });

        res.json({
            success: true,
            data: { notifications, total }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /notifications/:id/read
 * Mark as read
 */
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: userId }, // Ensure ownership
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


/**
 * POST /notifications/send
 * Send notification (Email/SMS + DB)
 * Access: BLOODBANK_ADMIN (or others via internal service calls)
 */
router.post('/send', async (req, res) => {
    try {
        const { type, recipient, subject, message, saveToDb = true } = req.body;

        if (!recipient || !message) {
            return res.status(400).json({ success: false, message: 'Recipient and message required' });
        }

        let result = {};

        // 1. Send External (Email/SMS) if type is specified
        if (type === 'email') {
            await sendEmail(recipient, subject, message); // Assuming recipient is email for email type
            result.external = 'email sent';
        } else if (type === 'sms') {
            await sendSMS(recipient, message);
            result.external = 'sms sent';
        }

        // 2. Save In-App Notification (if recipient is a User ID)
        // Note: For 'email' type, 'recipient' is email address. For In-App, we need User ID.
        // We will assume if saveToDb is true, the caller provides a userId in 'userId' field or we skip it for now.
        // Or better: The Dashboard sends 'userId' as recipient for in-app.
        // Let's support a mixed mode:
        // If type is 'in-app' or unspecified, just save to DB.

        let savedNotification = null;
        if (saveToDb || type === 'in-app') {
            // For In-App, recipient should be the User ID.
            savedNotification = await new Notification({
                recipient,
                type: type || 'info',
                title: subject || 'Notification',
                message
            }).save();
        }

        res.json({
            success: true,
            message: 'Notification processed',
            data: { result, savedNotification }
        });

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Send email notification
 */
async function sendEmail(to, subject, text) {
    const transporter = createEmailTransporter();

    const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject: subject || 'Blood Bank Notification',
        text,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #d32f2f;">Blood Bank Management System</h2>
      <p>${text.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
    </div>`
    };

    const info = await transporter.sendMail(mailOptions);

    return {
        messageId: info.messageId,
        recipient: to,
        type: 'email'
    };
}

/**
 * Send SMS notification (Mock implementation)
 * In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
 */
async function sendSMS(to, message) {
    // Mock SMS sending
    console.log(`[SMS] Sending to ${to}: ${message}`);

    // In production, use SMS API:
    // const response = await axios.post('SMS_PROVIDER_API', {
    //   to,
    //   message,
    //   apiKey: process.env.SMS_API_KEY
    // });

    return {
        recipient: to,
        type: 'sms',
        status: 'mock_sent',
        note: 'SMS sending is mocked. Integrate with SMS provider in production.'
    };
}

module.exports = router;
