const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate } = require('../../../middleware/authMiddleware');

router.get('/search', authenticate, patientController.searchPatients);
router.get('/', authenticate, patientController.getPatients);
router.get('/:mrid', authenticate, patientController.getPatientByMrid);

module.exports = router;
