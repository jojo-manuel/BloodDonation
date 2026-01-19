const express = require('express');
const router = express.Router();
const User = require('../../auth/models/User'); // Import User model to verify
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Request = require('../../request/models/Request');

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

        const trimmedEmail = email ? email.trim() : '';
        const trimmedName = name ? name.trim() : '';
        const trimmedHospitalName = hospitalName ? hospitalName.trim() : '';

        // Validate required fields
        if (!trimmedEmail || !password || !trimmedName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        // Create new blood bank user (password hashed automatically by User model pre-save hook)
        const user = new User({
            email: trimmedEmail,
            password,  // Plain password - User model hashes it automatically
            name: trimmedName || trimmedHospitalName,
            role: 'bloodbank',
            hospital_id: trimmedHospitalName || 'default-hospital',
            isActive: false, // Require admin approval
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

// GET /api/bloodbank/all - List all active blood banks (for users/donors to select)
router.get('/all', async (req, res) => {
    try {
        const bloodBanks = await User.find({ role: 'bloodbank', isActive: true })
            .select('name hospital_id email phone address city district state pincode');
        res.json({ success: true, count: bloodBanks.length, data: bloodBanks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/details?userId=...
// GET /api/bloodbank/details
router.get('/details', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            data: {
                _id: user._id,
                status: 'approved',
                hospital_id: user.hospital_id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Bloodbank details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});



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
        const { name, role, phone } = req.body;
        let { email } = req.body;
        const bloodBankId = req.user.hospital_id;

        // Auto-generate email if not provided (for "Optional" field in frontend)
        if (!email || !email.trim()) {
            const randomId = Math.random().toString(36).slice(-6);
            // Remove spaces and special chars from name for email prefix
            const safeName = name ? name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8) : 'staff';
            email = `${safeName}_${randomId}@staff.local`;
        }

        // Validate required fields
        if (!name || !role) {
            return res.status(400).json({ success: false, message: 'Name and role are required' });
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

// GET /api/bloodbank/analytics
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        console.log('Analytics Debug - User:', req.user);
        console.log('Analytics Debug - BloodBankID:', bloodBankId);

        const totalBookings = await Booking.countDocuments({ hospital_id: bloodBankId });
        console.log('Analytics Debug - Total Bookings Found:', totalBookings);
        const completedBookings = await Booking.countDocuments({ hospital_id: bloodBankId, status: 'completed' });

        // Dynamic import or require if not already present
        const Patient = require('../../patient/models/Patient');
        const Request = require('../../request/models/Request');

        const totalPatients = await Patient.countDocuments({ hospital_id: bloodBankId });
        const fulfilledPatients = await Request.countDocuments({
            hospital_id: bloodBankId,
            status: 'fulfilled'
        });

        // Calculate trends (mocked for now as it requires complex aggregation)
        // You can add real aggregation here if needed later

        const analyticsData = {
            overview: {
                totalBookings,
                completedBookings,
                totalPatients,
                fulfilledPatients
            },
            timeBased: {
                today: {
                    bookings: await Booking.countDocuments({
                        hospital_id: bloodBankId,
                        date: {
                            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            $lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                    })
                },
                thisWeek: { bookings: 0 }, // Placeholder
                thisMonth: { bookings: 0, patients: 0, requests: 0 } // Placeholder
            },
            bloodGroupDistribution: [],
            monthlyTrend: [],
            recentActivity: []
        };

        res.json({
            success: true,
            data: analyticsData
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/bookings
router.get('/bookings', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        const { date } = req.query;

        let query = { hospital_id: bloodBankId };

        if (date) {
            // Match date exactly (assuming stored as Date or ISO string at start of day)
            // If stored as Date object with time, we need range.
            // Based on frontend 'new Date().toISOString().split('T')[0]', it sends YYYY-MM-DD.
            // Backend Booking model has 'date: Date'.

            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            query.date = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const bookings = await Booking.find(query).sort({ date: 1, time: 1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/bookings/token/:token
router.get('/bookings/token/:token', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        const { token } = req.params;

        const booking = await Booking.findOne({
            hospital_id: bloodBankId,
            tokenNumber: token
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/bloodbank/bookings/:id/status
router.put('/bookings/:id/status', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        const { id } = req.params;
        const { status, rejectionReason, weight, bagSerialNumber } = req.body;

        // Debug logging
        console.log('Update Booking Status Payload:', { id, status, weight, bagSerialNumber });

        const updateData = { status };
        if (rejectionReason) updateData.rejectionReason = rejectionReason;
        if (weight) updateData.weight = weight;
        if (bagSerialNumber) updateData.bagSerialNumber = bagSerialNumber;

        console.log('Constructed Update Data:', updateData);

        const booking = await Booking.findOneAndUpdate(
            { _id: id, hospital_id: bloodBankId },
            updateData,
            { new: true }
        );

        console.log('Updated Booking Result:', booking);


        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, message: `Booking ${status}`, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/bloodbank/bookings/:id/reschedule
router.put('/bookings/:id/reschedule', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        const { id } = req.params;
        const { newDate, newTime } = req.body;

        const booking = await Booking.findOneAndUpdate(
            { _id: id, hospital_id: bloodBankId },
            { date: new Date(newDate), time: newTime, status: 'confirmed' }, // Reset status to confirmed? Or keep pending?
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, message: 'Booking rescheduled', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/donors
router.get('/donors', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        // Donors associated with this hospital (if any) or public donors in region
        // For now, return empty or all donors for testing
        const donors = await User.find({ role: 'donor' }).select('-password').limit(10);
        res.json({ success: true, data: donors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/visited-donors
router.get('/visited-donors', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;

        // Find all bookings for this hospital and populate donor info
        const bookings = await Booking.find({ hospital_id: bloodBankId })
            .populate('donorId', 'name email phone bloodGroup')
            .sort({ date: -1 });

        const donorMap = {};

        bookings.forEach(booking => {
            if (!booking.donorId) return; // Skip if donor deleted or missing

            const donorIdStr = booking.donorId._id.toString();

            if (!donorMap[donorIdStr]) {
                donorMap[donorIdStr] = {
                    donor: booking.donorId, // Populated donor object
                    visits: [],
                    totalVisits: 0,
                    completedDonations: 0,
                    pendingBookings: 0,
                    lastVisit: null
                };
            }

            const entry = donorMap[donorIdStr];
            entry.visits.push(booking);
            entry.totalVisits++;

            if (booking.status === 'completed') {
                entry.completedDonations++;
            } else if (booking.status === 'pending' || booking.status === 'confirmed') {
                entry.pendingBookings++;
            }

            // Check for last visit (assuming bookings sorted by date desc, or check date)
            if (booking.status === 'completed' || booking.status === 'arrived') {
                if (!entry.lastVisit || new Date(booking.date) > new Date(entry.lastVisit)) {
                    entry.lastVisit = booking.date;
                }
            }
        });

        const visitedDonors = Object.values(donorMap);
        res.json({ success: true, data: visitedDonors });
    } catch (error) {
        console.error('Error fetching visited donors:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/donation-requests
router.get('/donation-requests', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        console.log(`[DEBUG] Fetching donation requests for Hospital: '${bloodBankId}'`);

        const requests = await Booking.find({
            hospital_id: bloodBankId,
            status: 'pending'
        }).sort({ date: 1, time: 1 });

        console.log(`[DEBUG] Found ${requests.length} pending requests.`);
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('[DEBUG] Error fetching donation requests:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/bloodbank/donation-requests/:id/status
// Accept or reject a donation request (Booking)
router.put('/donation-requests/:id/status', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected' from frontend

        // Map status: 'accepted' -> 'confirmed', 'rejected' -> 'rejected'
        const bookingStatus = status === 'accepted' ? 'confirmed' : 'rejected';

        const booking = await Booking.findOneAndUpdate(
            { _id: id, hospital_id: bloodBankId },
            { status: bookingStatus },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking request not found' });
        }

        res.json({ success: true, message: `Request ${status}`, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/users
router.get('/users', authMiddleware, async (req, res) => {
    try {
        // Alias for donors or staff? Logs showed this request.
        // Let's return staff for now as 'users' usually implies managed users
        const bloodBankId = req.user.hospital_id;
        const staff = await User.find({
            hospital_id: bloodBankId,
            role: { $in: ['frontdesk', 'doctor', 'lab_technician', 'bleeding_staff', 'store_staff', 'centrifuge_staff', 'other_staff'] }
        }).select('-password');
        res.json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
