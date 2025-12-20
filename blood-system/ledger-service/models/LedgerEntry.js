const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
    transaction_id: {
        type: String,
        required: [true, 'Transaction ID is required'],
        unique: true,
        trim: true
    },
    transaction_type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: ['blood_donation', 'blood_request', 'inventory_update', 'user_action']
    },
    hospital_id: {
        type: String,
        required: [true, 'Hospital ID is required'],
        trim: true
    },
    user_id: {
        type: String,
        trim: true
    },
    data_hash: {
        type: String,
        required: [true, 'Data hash is required']
    },
    previous_hash: {
        type: String
    },
    metadata: {
        type: Map,
        of: String
    },
    blockchain_reference: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
ledgerEntrySchema.index({ hospital_id: 1, createdAt: -1 });
ledgerEntrySchema.index({ transaction_id: 1 });
ledgerEntrySchema.index({ transaction_type: 1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
