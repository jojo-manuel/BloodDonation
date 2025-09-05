// Route/userRoutes.js
// Routes for current-user profile actions.

const express = require('express');
const auth = require('../Middleware/auth');
const validate = require('../Middleware/validate');
const { userUpdateBody } = require('../validators/schemas');
const { me, updateMe } = require('../controllers/userController');

const router = express.Router();

// Get current logged-in user's profile
router.get('/me', auth(true), me);

// Update current user's profile (partial update)
router.patch('/me', auth(true), validate({ body: userUpdateBody }), updateMe);
router.put('/me', auth(true), validate({ body: userUpdateBody }), updateMe);

module.exports = router;



