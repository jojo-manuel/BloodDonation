const express = require('express');
const router = express.Router();

const requestController = require('../controllers/requestController');
const { authenticate } = require('../../../middleware/authMiddleware');

// Get all requests for current user (sent and received)
router.get('/', authenticate, requestController.getMyRequests);

// Update request status (accept/reject/cancel)
router.put('/:requestId/status', authenticate, requestController.updateRequestStatus);


module.exports = router;
