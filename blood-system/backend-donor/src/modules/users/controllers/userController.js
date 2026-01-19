const User = require('../models/UserModel');
const Booking = require('../models/Booking');
const Request = require('../../request/models/Request');

exports.directBookSlot = async (req, res) => {
    try {
        const {
            donorId,
            bloodBankId,
            requestedDate,
            requestedTime,
            donationRequestId,
            patientName,
            donorName,
            requesterName,
            medicalConsent
        } = req.body;

        // Generate a sequential token number for the day
        const dateStr = requestedDate.replace(/-/g, ''); // YYYYMMDD
        const count = await Booking.countDocuments({ date: requestedDate });
        const sequence = (count + 1).toString().padStart(4, '0');
        const tokenNumber = `BK-${dateStr}-${sequence}`;
        console.log(`[DEBUG] Generated Token: ${tokenNumber}`);

        const booking = new Booking({
            donorId,
            bloodBankId,
            donationRequestId,
            date: requestedDate,
            time: requestedTime,
            tokenNumber,
            meta: {
                patientName,
                donorName,
                requesterName
            },
            medicalConsent
        });

        await booking.save();

        // Update Request status
        if (donationRequestId) {
            await Request.findByIdAndUpdate(donationRequestId, {
                status: 'booked',
                bookingId: booking._id
            });
        }

        res.json({
            success: true,
            message: 'Slot booked successfully',
            data: booking
        });

    } catch (error) {
        console.error('Error booking slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to book slot',
            error: error.message // Sending error description to frontend for debugging
        });
    }
};
const Donor = require('../../donor/models/donorModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/profiles';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.user_id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
}).single('profileImage'); // Expecting field name 'profileImage'

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getComprehensiveProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Fetch User and Donor data in parallel
        const [user, donor] = await Promise.all([
            User.findById(userId).select('-password'),
            Donor.findOne({ userId })
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Construct comprehensive response
        const responseData = {
            ...user.toObject(),
            donorProfile: donor ? donor.toObject() : null
        };

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error fetching comprehensive profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.uploadProfileImage = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        try {
            const userId = req.user.user_id;
            // In a real app, you'd upload to S3/Cloudinary here. 
            // For local, we serve static files. 
            // Assuming we serve 'uploads' folder statically.
            const imageUrl = `/uploads/profiles/${req.file.filename}`;

            const user = await User.findByIdAndUpdate(
                userId,
                { profileImage: imageUrl },
                { new: true }
            ).select('-password');

            res.json({ success: true, message: 'Profile image uploaded', data: { profileImage: imageUrl, user } });
        } catch (error) {
            console.error('Error saving profile image:', error);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    });
};
