
const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    serialNumber: {
        type: String,
        trim: true,
        // unique: true, // Serial numbers might not be unique across different hospitals? Or maybe they are? Let's keep it simple for now and not enforce unique globally unless requested. 
        // Actually serial numbers for same item type might differ.
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required']
    },
    hospital_id: {
        type: String,
        required: [true, 'Hospital ID is required'],
        index: true
    },
    status: {
        type: String,
        enum: ['available', 'allocated', 'maintenance'],
        default: 'available'
    },
    allocatedTo: {
        type: String, // Name of department or person
        trim: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index to ensure uniqueness of serial number within a hospital if needed, or globally?
// User asked for "serial number", implies tracking individual items or batches.
// If quantity > 1, do they have same serial number? Usually serial number is unique per unit.
// If they want to add "quantity", maybe they mean Batch Number? Or maybe they add 10 items with same serial?
// "add new items , name then and there quantuty serial number and expire date"
// If I add 10 Kits, do they all have serial "ABC"? Probably Batch Number. 
// But if it's "Serial Number", usually quantity is 1.
// Let's implement as requested: Quantity + Serial Number field.
// Maybe it's a batch of items with a serial/batch number.

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
