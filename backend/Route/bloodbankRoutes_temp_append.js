
/**
 * Get all staff members for the blood bank
 * GET /api/bloodbank/staff
 */
router.get('/staff', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'bloodbank') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Blood bank role required.'
            });
        }

        const bloodBank = await BloodBank.findOne({ userId: req.user.id });
        if (!bloodBank) {
            return res.status(404).json({
                success: false,
                message: 'Blood bank not found'
            });
        }

        // Find all users with bloodBankId matching this blood bank
        // and exclude standard users/donors/admins (fetch only staff roles)
        const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];

        const staff = await User.find({
            bloodBankId: bloodBank._id,
            role: { $in: staffRoles }
        })
            .select('-password') // Exclude password
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: staff
        });

    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff',
            error: error.message
        });
    }
});

/**
 * Create a new staff member
 * POST /api/bloodbank/staff
 */
router.post('/staff', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'bloodbank') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Blood bank role required.'
            });
        }

        const { name, role, email, phone } = req.body;

        // Validate role
        const allowedRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff role'
            });
        }

        const bloodBank = await BloodBank.findOne({ userId: req.user.id });
        if (!bloodBank) {
            return res.status(404).json({
                success: false,
                message: 'Blood bank not found'
            });
        }

        // Auto-generate credentials
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        // Use provided email or generate a placeholder if not provided
        // If email is provided, use it. If not, generate one.
        // Note: The User model validation for username/email might require a valid format.
        // We'll generate a unique username based on the bloodbank name and role

        const cleanBbName = bloodBank.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
        const generatedUsername = `${role}.${cleanBbName}.${randomSuffix}`;
        const generatedEmail = email || `${generatedUsername}@bloodbank.com`;

        // Generate a secure random password (8 chars)
        const generatedPassword = Math.random().toString(36).slice(-8);

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username: generatedUsername }, { email: generatedEmail }]
        });

        if (existingUser) {
            // Very unlikely with random suffix, but good to handle
            return res.status(409).json({
                success: false,
                message: 'Conflict generating credentials. Please try again.'
            });
        }

        const newStaff = new User({
            name,
            username: generatedUsername,
            email: generatedEmail,
            password: generatedPassword,
            role,
            bloodBankId: bloodBank._id,
            phone: phone || null,
            provider: 'local',
            emailVerificationCode: null, // Auto-verified
            isBlocked: false
        });

        await newStaff.save();

        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: {
                id: newStaff._id,
                name: newStaff.name,
                role: newStaff.role,
                username: newStaff.username,
                email: newStaff.email,
                generatedPassword: generatedPassword // IMPORTANT: Send back the raw password so admin can see it once
            }
        });

    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating staff',
            error: error.message
        });
    }
});

module.exports = router;
