const express = require('express');
const router = express.Router();
const User = require('../../auth/models/User'); // Import User model to verify
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Request = require('../../request/models/Request');
const DonationRequest = require('../models/DonationRequest');

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
        console.error('[DEBUG] Auth Middleware Error:', error.message);
        console.error('[DEBUG] Secret used (first 3 chars):', (process.env.JWT_SECRET || 'your-secret-key').substring(0, 3));
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
            username,
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

        // 1. Fetch standard Bookings
        const bookings = await Booking.find(query).lean();

        // 2. Fetch DonationRequests that are effectively bookings (scheduled)
        // Check for scheduledDate and relevant statuses
        let drQuery = {
            scheduledDate: { $exists: true, $ne: null },
            status: { $in: ['rescheduled', 'booked', 'accepted', 'pending', 'arrived', 'completed'] } // Include pending if it has a date? mostly rescheduled
        };

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            drQuery.scheduledDate = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const donationRequests = await DonationRequest.find(drQuery)
            .populate({
                path: 'donorId',
                select: 'name email phone bloodGroup',
                model: 'User'
            })
            .populate({
                path: 'requesterId',
                select: 'name email phone bloodGroup',
                model: 'User'
            })
            .populate('patientId', 'patientName mrid hospital_id')
            .lean();

        console.log(`[DEBUG] GET /bookings - Found ${donationRequests.length} donation requests with scheduledDate.`);
        if (donationRequests.length > 0) {
            console.log(`[DEBUG] Sample DR: ID=${donationRequests[0]._id}, Status=${donationRequests[0].status}, Date=${donationRequests[0].scheduledDate}`);
        }

        // Filter DonationRequests - For now, allow ALL scheduled requests to match GET /donation-requests behavior
        // In a real multi-tenant app, we might want to strictly filter by hospital, but for now we follow the existing pattern.
        const mappedRequests = donationRequests
            // .filter(req => req.patientId && req.patientId.hospital_id === bloodBankId) // Removed strict filter
            .map(req => ({
                _id: req._id,
                bookingId: req.tokenNumber || req._id.toString().slice(-6).toUpperCase(),
                donorName: req.donorId?.name || req.requesterId?.name || 'Unknown',
                donorId: req.donorId || null,
                bloodGroup: req.bloodGroup || req.donorId?.bloodGroup,
                email: req.donorId?.email || req.requesterId?.email,
                phone: req.donorId?.phone || req.requesterId?.phone,
                date: req.scheduledDate,
                time: req.scheduledTime,
                status: req.status,
                tokenNumber: req.tokenNumber,
                hospital_id: req.patientId?.hospital_id || bloodBankId,
                patientName: req.patientId?.patientName,
                patientMrid: req.patientId?.mrid,
                weight: req.weight,
                bagSerialNumber: req.bagSerialNumber,
                isDonationRequest: true, // Flag for frontend
                requesterName: req.requesterId?.name,
                requesterPhone: req.requesterId?.phone,
                requesterEmail: req.requesterId?.email,
                createdAt: req.createdAt
            }));

        // 3. Merge and Sort
        const allBookings = [...bookings, ...mappedRequests].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) {
                return (a.time || '').localeCompare(b.time || '');
            }
            return dateA - dateB;
        });

        res.json({ success: true, data: allBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bloodbank/bookings/token/:token
router.get('/bookings/token/:token', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        const { token } = req.params;

        let booking = await Booking.findOne({
            hospital_id: bloodBankId,
            tokenNumber: token
        });

        if (!booking) {
            const dr = await DonationRequest.findOne({ tokenNumber: token })
                .populate('donorId')
                .populate('patientId');

            if (dr) {
                booking = {
                    _id: dr._id,
                    bookingId: 'N/A',
                    donorName: dr.donorId?.name || 'Unknown',
                    bloodGroup: dr.bloodGroup || dr.donorId?.bloodGroup,
                    email: dr.donorId?.email,
                    phone: dr.donorId?.phone,
                    date: dr.scheduledDate,
                    time: dr.scheduledTime,
                    status: dr.status,
                    hospital_id: dr.patientId?.hospital_id || bloodBankId,
                    tokenNumber: dr.tokenNumber,
                    patientName: dr.patientId?.patientName,
                    patientMrid: dr.patientId?.mrid,
                    patientMRID: dr.patientId?.mrid,
                    weight: dr.weight,
                    bagSerialNumber: dr.bagSerialNumber,
                    rejectionReason: dr.rejectionReason,
                    isDonationRequest: true
                };
            }
        }

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

        let booking = await Booking.findOneAndUpdate(
            { _id: id, hospital_id: bloodBankId },
            updateData,
            { new: true }
        );

        if (!booking) {
            const dr = await DonationRequest.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate('donorId').populate('patientId');

            if (dr) {
                booking = {
                    ...dr.toObject(),
                    donorName: dr.donorId?.name || 'Unknown',
                    patientName: dr.patientId?.patientName,
                    patientMRID: dr.patientId?.mrid,
                    patientMrid: dr.patientId?.mrid
                };
            }
        }

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
        const donors = await User.find({ role: 'donor' }).select('-password');
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

// DonationRequest imported at top
// const Patient = require('../../patient/models/Patient'); // if needed

// GET /api/bloodbank/donation-requests
router.get('/donation-requests', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        console.log(`[DEBUG] Fetching donation requests from 'donationrequests' collection`);

        // Fetch all from DonationRequest collection as we established it might not have hospital_id
        const requests = await DonationRequest.find({})
            .populate({
                path: 'donorId',
                select: 'name email phone bloodGroup',
                model: 'User'
            })
            .populate({
                path: 'requesterId',
                select: 'name email phone bloodGroup',
                model: 'User'
            })
            .populate('patientId', 'patientName mrid bloodGroup phoneNumber hospital_id')
            .sort({ createdAt: -1 });

        console.log(`[DEBUG] Found ${requests.length} documents in 'donationrequests'.`);
        if (requests.length > 0) {
            console.log('[DEBUG] First request donor details:', requests[0].donorId);
            console.log('[DEBUG] First request requester details:', requests[0].requesterId);
        }
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('[DEBUG] Error fetching donation requests:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/bloodbank/donation-requests/:id/status
// Accept or reject a donation request (DonationRequest model)
router.put('/donation-requests/:id/status', authMiddleware, async (req, res) => {
    try {
        // const bloodBankId = req.user.hospital_id; // DonationRequest might not have hospital_id to check against yet
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        console.log(`[DEBUG] Updating status of DonationRequest ${id} to ${status}`);

        const request = await DonationRequest.findByIdAndUpdate(
            id,
            { status: status },
            { new: true }
        ).populate('donorId requesterId');

        if (!request) {
            return res.status(404).json({ success: false, message: 'Donation request not found' });
        }

        if (status === 'accepted') {
            const bookingExists = await Booking.findOne({
                $or: [
                    { tokenNumber: request.tokenNumber },
                    { donorId: request.donorId?._id }
                ],
                date: request.scheduledDate,
                hospital_id: req.user.hospital_id
            });

            if (!bookingExists) {
                const newBooking = new Booking({
                    bookingId: 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    donorId: request.donorId?._id || request.requesterId?._id, // Fallback if needed
                    donorName: request.donorId?.name || request.requesterId?.name || 'Unknown',
                    bloodGroup: request.bloodGroup || request.donorId?.bloodGroup,
                    email: request.donorId?.email || request.requesterId?.email,
                    phone: request.donorId?.phone || request.requesterId?.phone,
                    date: request.scheduledDate || new Date(),
                    time: request.scheduledTime || '09:00 AM',
                    status: 'confirmed',
                    hospital_id: req.user.hospital_id || request.patientId?.hospital_id || 'default_hospital',
                    tokenNumber: request.tokenNumber || (String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10)),
                    patientName: request.patientId?.patientName,
                    patientMrid: request.patientId?.mrid,
                    requesterName: request.requesterId?.name,
                    bagSerialNumber: request.bagSerialNumber,
                    weight: request.weight
                });
                await newBooking.save();
                console.log(`[DEBUG] Created new Booking ${newBooking.bookingId} for accepted donation request`);
            }
        }

        // Send Notification
        const recipientId = request.donorId?._id || request.requesterId?._id;
        if (recipientId) {
            await Notification.create({
                recipient: recipientId,
                type: status === 'accepted' ? 'success' : 'warning',
                title: `Donation Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: `Your donation request has been ${status}.`,
                data: { requestId: request._id, status }
            });
        }

        res.json({ success: true, message: `Request ${status}`, data: request });
    } catch (error) {
        console.error('[DEBUG] Error updating donation request status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Import Notification model
const Notification = require('../../notification/models/Notification');

// PUT /api/bloodbank/donation-requests/:id/reschedule
router.put('/donation-requests/:id/reschedule', authMiddleware, async (req, res) => {
    try {
        const bloodBankId = req.user.hospital_id;
        const { id } = req.params;
        const { newDate, newTime } = req.body;

        console.log(`[DEBUG] Rescheduling request ${id} to ${newDate} ${newTime}`);

        // Check for existing token
        const existingRequest = await DonationRequest.findById(id);
        const updateData = {
            status: 'booked', // Changed from 'rescheduled' to 'booked'
            scheduledDate: new Date(newDate),
            scheduledTime: newTime
        };

        if (existingRequest && !existingRequest.tokenNumber) {
            updateData.tokenNumber = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10);
        }

        const request = await DonationRequest.findOneAndUpdate(
            { _id: id },
            updateData,
            { new: true }
        )
            .populate({
                path: 'donorId',
                select: 'name email phone bloodGroup',
                model: 'User'
            })
            .populate({
                path: 'requesterId',
                select: 'name email phone bloodGroup',
                model: 'User'
            })
            .populate('patientId', 'patientName mrid bloodGroup phoneNumber hospital_id');

        if (!request) {
            console.log('[DEBUG] Request not found for rescheduling');
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Also update Booking if it exists (for confirmed/accepted requests that became bookings)
        // Match by tokenNumber if available, or donor + old date
        if (existingRequest) {
            const query = {};
            if (existingRequest.tokenNumber) {
                query.tokenNumber = existingRequest.tokenNumber;
            } else {
                query.donorId = existingRequest.donorId;
                query.date = existingRequest.scheduledDate; // Use old date
            }
            query.hospital_id = bloodBankId;

            console.log('[DEBUG] Attempting to update associated Booking with query:', query);

            await Booking.findOneAndUpdate(
                query,
                {
                    date: new Date(newDate),
                    time: newTime,
                    status: 'confirmed', // Keep it confirmed or match new status? confirmed is fine.
                    tokenNumber: updateData.tokenNumber || existingRequest.tokenNumber // Ensure token is synced if generated
                }
            );
        }

        // Send Notification
        const recipientId = request.donorId?._id || request.requesterId?._id;
        if (recipientId) {
            await Notification.create({
                recipient: recipientId,
                type: 'info',
                title: 'Donation Rescheduled',
                message: `Your donation request has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newTime}. Please contact the blood bank if this does not work for you.`,
                data: { requestId: request._id, newDate, newTime }
            });
            console.log(`[DEBUG] Notification sent to ${recipientId}`);
        }

        res.json({ success: true, message: 'Request rescheduled and user notified', data: request });
    } catch (error) {
        console.error('[DEBUG] Error rescheduling request:', error);
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

// POST /api/bloodbank/users - Create a new user (Donor, Staff, or User)
router.post('/users', authMiddleware, async (req, res) => {
    try {
        const { name, email, password, phone, role: rawRole, bloodGroup, address } = req.body;
        const bloodBankId = req.user.hospital_id;

        // Normalize role (frontend sends 'donor', schema expects 'DONOR')
        const role = rawRole === 'donor' ? 'DONOR' : rawRole;


        // Auto-generate password if not provided
        const finalPassword = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const newUser = new User({
            name,
            email,
            password: finalPassword,
            phone,
            role: role || 'user',
            bloodGroup,
            address,
            confirmed: true, // Auto-confirm since created by admin/bloodbank
            isActive: true,
            // Only set hospital_id if it's a staff role
            hospital_id: ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'].includes(role) ? bloodBankId : 'public-user'
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                },
                credentials: {
                    email: newUser.email,
                    password: finalPassword
                }
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
