// Route/userRoutes.js
// Routes for current-user profile actions.

const express = require('express');
const auth = require('../Middleware/auth');
const validate = require('../Middleware/validate');
const { userUpdateBody } = require('../validators/schemas');
const { me, updateMe, updateDonorAvailability, uploadProfileImage, completeProfile, directBookSlot, getApprovedBloodBanks } = require('../controllers/userController');

console.log('directBookSlot:', typeof directBookSlot);
console.log('getApprovedBloodBanks:', typeof getApprovedBloodBanks);
console.log('directBookSlot value:', directBookSlot);
console.log('All destructured:', { me, updateMe, updateDonorAvailability, uploadProfileImage, completeProfile, directBookSlot, getApprovedBloodBanks });

const router = express.Router();

// Get current logged-in user's profile
router.get('/me', auth(true), me);

// Update current user's profile (partial update)
router.patch('/me', auth(true), validate({ body: userUpdateBody }), updateMe);
router.put('/me', auth(true), validate({ body: userUpdateBody }), updateMe);

// Update donor availability
router.patch('/me/availability', auth(true), updateDonorAvailability);

// Upload profile image
const multer = require('multer');
const path = require('path');

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'backend/uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + ext);
  }
});
let upload = multer({ storage: storage });

router.patch('/me/profile-image', auth(true), upload.single('profileImage'), uploadProfileImage);

// Complete profile for Google users
router.post('/me/complete-profile', auth(true), completeProfile);

 

// Donation request routes
// router.post('/donation-requests', auth(true), requestDonation);
// router.get('/donation-requests', auth(true), getMyRequests);
// router.put('/donation-requests/:id', auth(true), cancelRequest);

// Book donation slot
// router.post('/book-slot', auth(true), bookSlot);

// Direct book slot
router.post('/direct-book-slot', auth(true), directBookSlot);

// Get all approved blood banks (public endpoint)
router.get('/bloodbanks/approved', getApprovedBloodBanks);

module.exports = router;
