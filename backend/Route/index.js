const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/donors', require('./donorRoutes'));
router.use("/patients", require('/patientRoutes'));
module.exports = router;






