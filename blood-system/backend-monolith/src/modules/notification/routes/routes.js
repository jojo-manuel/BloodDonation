const express = require('express');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const verifyToken = require('../../../middleware/auth');

const router = express.Router();

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

async function sendEmail(to, subject, text) {
    const transporter = createEmailTransporter();
    const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject: subject || 'Blood Bank Notification',
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #d32f2f;">Blood Bank Management System</h2>
          <p>${text.replace(/\n/g, '<br>')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Automated message.</p>
        </div>`
    };
    return await transporter.sendMail(mailOptions);
}

// Routes
router.get('/unread', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const count = await Notification.countDocuments({ recipient: userId, isRead: false });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { limit = 10, skip = 0 } = req.query;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));
        const total = await Notification.countDocuments({ recipient: userId });
        res.json({ success: true, data: { notifications, total } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/send', verifyToken, async (req, res) => {
    try {
        // Only admins can trigger generic sends, but maybe internal services call this?
        // In monolith, internal services call logic directly. This endpoint is for Admins or manual triggers.
        if (!['BLOODBANK_ADMIN', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { type, recipient, subject, message, saveToDb = true } = req.body;
        if (!recipient || !message) return res.status(400).json({ success: false, message: 'Recipient and message required' });

        let result = {};
        if (type === 'email') {
            await sendEmail(recipient, subject, message);
            result.external = 'email sent';
        }

        let savedNotification = null;
        if (saveToDb || type === 'in-app') {
            savedNotification = await new Notification({
                recipient,
                type: type || 'info',
                title: subject || 'Notification',
                message
            }).save();
        }

        res.json({ success: true, message: 'Notification processed', data: { result, savedNotification } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
