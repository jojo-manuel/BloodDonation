const User = require('../../users/models/UserModel');

// GET /api/bloodbank/all - List all active blood banks
exports.getAllBloodBanks = async (req, res) => {
    try {
        const bloodBanks = await User.find({ role: 'bloodbank', isActive: true })
            .select('name hospital_id email phone address city district state pincode');
        res.json({ success: true, count: bloodBanks.length, data: bloodBanks });
    } catch (error) {
        console.error('Error fetching blood banks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blood banks' });
    }
};
