const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    // Blood bank user ID (for quick filtering)
    bloodBankUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // The other participant (user/donor)
    participantUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Preview of last message
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Unread counts for each side
    unreadByBloodBank: {
        type: Number,
        default: 0
    },
    unreadByUser: {
        type: Number,
        default: 0
    },
    // Metadata
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ bloodBankUserId: 1, lastMessageAt: -1 });
conversationSchema.index({ participantUserId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
