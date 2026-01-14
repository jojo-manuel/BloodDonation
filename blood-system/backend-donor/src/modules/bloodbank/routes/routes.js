const express = require('express');
const router = express.Router();
const bloodbankController = require('../controllers/bloodbankController');

// GET /api/bloodbank/all
router.get('/all', bloodbankController.getAllBloodBanks);

module.exports = router;
