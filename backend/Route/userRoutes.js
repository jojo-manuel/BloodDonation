// Route/userRoutes.js
// Routes for current-user profile actions.

const express = require('express');
const auth = require('../Middleware/auth');
const validate = require('../Middleware/validate');
const { userUpdateBody } = require('../validators/schemas');
const { me, updateMe, updateDonorAvailability, uploadProfileImage, completeProfile } = require('../controllers/userController');

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

module.exports = router;



