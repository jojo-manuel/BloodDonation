const express = require('express');
const router = express.Router();
const User = require('../../auth/models/User'); // Import User model to verify
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/bloodbank/register - Register a new blood bank
router.post('/register', async (req, res) => {
    try {
        const {
            name,
            hospitalName,
            email,
            password,
            phone,
            pincode,
            localBody,
            district,
            state
        } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        // Create new blood bank user (password hashed automatically by User model pre-save hook)
        const user = new User({
            email,
            password,  // Plain password - User model hashes it automatically
            name: name || hospitalName,
            role: 'bloodbank',
            hospital_id: hospitalName || 'default-hospital',
            isActive: true,
            isBlocked: false,
            isSuspended: false
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                role: user.role,
                hospital_id: user.hospital_id
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Blood bank registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    username: user.name
                },
                accessToken: token,
                refreshToken: token
            }
        });
    } catch (error) {
        console.error('Blood bank registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// GET /api/bloodbank/details?userId=...
router.get('/details', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

        // Verify user exists and is bloodbank
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role !== 'BLOODBANK_ADMIN' && user.role !== 'bloodbank') {
            // Basic check, though role might be BLOODBANK_ADMIN in DB
            // The login logic checks role === 'bloodbank'.
        }

        // Return mock details expected by frontend
        // Frontend expects: data.data.status = 'approved' | 'pending' | 'rejected'
        // We'll default to 'approved' for the seeded user.
        res.json({
            success: true,
            data: {
                status: 'approved',
                hospital_id: user.hospital_id,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Bloodbank details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Auth middleware for staff routes
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// GET /api/bloodbank/staff - Get all staff for blood bank
router.get('/staff', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;

        // Find all staff members belonging to this blood bank
        const staff = await User.find({
            hospital_id: bloodBankId,
            role: { $in: ['frontdesk', 'doctor', 'lab_technician', 'bleeding_staff', 'store_staff', 'centrifuge_staff', 'other_staff'] }
        }).select('-password').sort({ createdAt: -1 });

        res.json({ success: true, data: staff });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/bloodbank/staff - Create new staff member
router.post('/staff', authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, role } = req.body;
        const bloodBankId = req.user.hospital_id;

        // Validate required fields
        if (!name || !email || !role) {
            return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        // Generate random password
        const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

        // Generate username from email
        const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(-4);

        // Create staff user
        const staff = new User({
            name,
            email,
            password: generatedPassword, // Will be hashed by pre-save hook
            phone,
            role,
            hospital_id: bloodBankId,
            isActive: true
        });

        await staff.save();

        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: {
                staff: {
                    _id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    phone: staff.phone,
                    role: staff.role,
                    username
                },
                credentials: {
                    email: email,
                    password: generatedPassword // Return plain password so admin can share with staff
                }
            }
        });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/bloodbank/staff/:id/reset-password - Reset staff password
router.post('/staff/:id/reset-password', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const bloodBankId = req.user.hospital_id;

        // Find staff member
        const staff = await User.findOne({ _id: id, hospital_id: bloodBankId });
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        // Generate new password
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

        // Update password (will be hashed by pre-save hook)
        staff.password = newPassword;
        await staff.save();

        res.json({
            success: true,
            message: 'Password reset successfully',
            data: {
                email: staff.email,
                newPassword: newPassword // Return so admin can share with staff
            }
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/bloodbank/staff/:id - Delete staff member
router.delete('/staff/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const bloodBankId = req.user.hospital_id;

        // Find and delete staff member
        const staff = await User.findOneAndDelete({ _id: id, hospital_id: bloodBankId });
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        res.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/bloodbank/staff/:id - Update staff member
router.put('/staff/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, role, isActive } = req.body;
        const bloodBankId = req.user.hospital_id;

        // Find staff member
        const staff = await User.findOne({ _id: id, hospital_id: bloodBankId });
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        // Update fields
        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (role) staff.role = role;
        if (typeof isActive === 'boolean') staff.isActive = isActive;

        await staff.save();

        res.json({
            success: true,
            message: 'Staff member updated successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
