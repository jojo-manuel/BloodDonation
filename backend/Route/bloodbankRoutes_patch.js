// Route/bloodbankRoutes.js

// ... (existing imports and setup)

/**
 * PUT /api/bloodbank/bookings/:id/status
 * Update booking status for verified staff
 */
router.put('/bookings/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, weight, bagSerialNumber } = req.body;

        // Check for allowed roles: bloodbank OR bleeding_staff OR doctor
        const allowedRoles = ['bloodbank', 'bleeding_staff', 'doctor', 'frontdesk'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Authorized staff role required.'
            });
        }

        // Determine bloodBankId based on role
        let bloodBankId;
        if (req.user.role === 'bloodbank') {
            const bb = await BloodBank.findOne({ userId: req.user.id });
            if (bb) bloodBankId = bb._id;
        } else {
            bloodBankId = req.user.bloodBankId;
        }

        if (!bloodBankId) {
            return res.status(404).json({ success: false, message: 'Blood Bank context not found' });
        }

        const booking = await Booking.findOne({ _id: id, bloodBankId });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Update fields
        if (status) booking.status = status;

        // If completing donation, save medical details
        if (status === 'completed') {
            booking.completedAt = new Date();
            if (weight) booking.weight = weight;
            if (bagSerialNumber) booking.bagSerialNumber = bagSerialNumber;

            // Also update donation history if needed? 
            // For now, just saving to booking is sufficient as per schema
        }

        await booking.save();

        res.json({
            success: true,
            message: `Booking updated to ${status} successfully`,
            data: booking
        });
    } catch (error) {
        console.error('Booking status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking status'
        });
    }
});

// ... (rest of the file)
