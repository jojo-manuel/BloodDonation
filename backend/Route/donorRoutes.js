// Route/donorRoutes.js
// Public donor search and private donor profile management.

const express = require('express');
const authMiddleware = require('../Middleware/authMiddleware');
const validate = require('../Middleware/validate');
const { donorRegisterBody } = require('../validators/schemas');
const { registerOrUpdateDonor, searchDonors, getOne } = require('../controllers/donorController');

const router = express.Router();

// Create or update the authenticated user's donor profile
router.post('/register', authMiddleware, validate({ body: donorRegisterBody }), registerOrUpdateDonor);

// Public donor search with filters
router.get('/search', searchDonors);

// Get a single donor by id
router.get('/:id', getOne);

module.exports = router;



