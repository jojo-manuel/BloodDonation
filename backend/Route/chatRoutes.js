const express = require('express');
const router = express.Router();
const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const User = require('../Models/User');
const authMiddleware = require('../Middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /conversations - List all conversations for current user
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
            isActive: true
        })
            .sort({ lastMessageAt: -1 })
            .populate('participants', 'name email role')
            .lean();

        // Add unread count based on user role
        const userRole = req.user.role?.toLowerCase();
        const conversationsWithUnread = conversations.map(conv => ({
            ...conv,
            unreadCount: userRole === 'bloodbank' ? conv.unreadByBloodBank : conv.unreadByUser,
            otherParticipant: conv.participants.find(p => p._id.toString() !== userId.toString())
        }));

        res.json({ success: true, data: conversationsWithUnread });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /conversations/:id/messages - Get messages in a conversation
router.get('/conversations/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { limit = 50, before } = req.query;

        // Verify user is part of this conversation
        const conversation = await Conversation.findOne({
            _id: id,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Build query
        let query = { conversationId: id };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        // Mark messages as read
        const userRole = req.user.role?.toLowerCase();
        await Message.updateMany(
            {
                conversationId: id,
                senderId: { $ne: userId },
                read: false
            },
            { read: true, readAt: new Date() }
        );

        // Reset unread count for this user
        if (userRole === 'bloodbank') {
            await Conversation.updateOne({ _id: id }, { unreadByBloodBank: 0 });
        } else {
            await Conversation.updateOne({ _id: id }, { unreadByUser: 0 });
        }

        res.json({ success: true, data: messages.reverse() });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /conversations - Start a new conversation
router.post('/conversations', async (req, res) => {
    try {
        const { userId: targetUserId } = req.body;
        const currentUserId = req.user._id;

        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'Target user ID required' });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] }
        }).populate('participants', 'name email role');

        if (conversation) {
            return res.json({ success: true, data: conversation, existing: true });
        }

        // Get user details (currentUser is already req.user)
        const currentUser = req.user;
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Determine blood bank and participant
        const currentRole = currentUser.role?.toLowerCase();
        const targetRole = targetUser.role?.toLowerCase();

        let bloodBankUserId, participantUserId;
        if (currentRole === 'bloodbank' || currentRole === 'bloodbank_admin') {
            bloodBankUserId = currentUserId;
            participantUserId = targetUserId;
        } else if (targetRole === 'bloodbank' || targetRole === 'bloodbank_admin') {
            bloodBankUserId = targetUserId;
            participantUserId = currentUserId;
        }

        // Create new conversation
        conversation = new Conversation({
            participants: [currentUserId, targetUserId],
            bloodBankUserId,
            participantUserId,
            lastMessage: '',
            lastMessageAt: new Date()
        });

        await conversation.save();
        await conversation.populate('participants', 'name email role');

        res.status(201).json({ success: true, data: conversation, existing: false });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /conversations/:id/messages - Send a message
router.post('/conversations/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Message content required' });
        }

        // Verify user is part of this conversation
        const conversation = await Conversation.findOne({
            _id: id,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Get sender details
        const sender = req.user;
        const senderRole = sender.role?.toLowerCase() || 'user';

        // Create message
        const message = new Message({
            conversationId: id,
            senderId: userId,
            senderRole,
            senderName: sender.name || sender.email,
            content: content.trim()
        });

        await message.save();

        // Update conversation
        const updateData = {
            lastMessage: content.substring(0, 100),
            lastMessageAt: new Date()
        };

        // Increment unread count for the other party
        if (senderRole === 'bloodbank' || senderRole === 'bloodbank_admin') {
            updateData.$inc = { unreadByUser: 1 };
        } else {
            updateData.$inc = { unreadByBloodBank: 1 };
        }

        await Conversation.updateOne({ _id: id }, updateData);

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /messages/:id/read - Mark message as read
router.put('/messages/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        await Message.updateOne(
            { _id: id },
            { read: true, readAt: new Date() }
        );

        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /unread-count - Get total unread message count
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role?.toLowerCase();

        let totalUnread = 0;

        if (userRole === 'bloodbank' || userRole === 'bloodbank_admin') {
            const result = await Conversation.aggregate([
                { $match: { participants: userId, isActive: true } },
                { $group: { _id: null, total: { $sum: '$unreadByBloodBank' } } }
            ]);
            totalUnread = result[0]?.total || 0;
        } else {
            const result = await Conversation.aggregate([
                { $match: { participants: userId, isActive: true } },
                { $group: { _id: null, total: { $sum: '$unreadByUser' } } }
            ]);
            totalUnread = result[0]?.total || 0;
        }

        res.json({ success: true, data: { unreadCount: totalUnread } });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /users - Get list of users that can be messaged
router.get('/users', async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role?.toLowerCase();
        const { search } = req.query;

        let query = { _id: { $ne: userId }, isActive: true };

        // Blood banks can message users/donors, users/donors can message blood banks
        if (userRole === 'bloodbank' || userRole === 'bloodbank_admin') {
            query.role = { $in: ['user', 'donor', 'DONOR'] };
        } else {
            query.role = { $in: ['bloodbank', 'BLOODBANK_ADMIN'] };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('name email role hospital_id')
            .limit(20)
            .lean();

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
