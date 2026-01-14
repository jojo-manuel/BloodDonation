const Patient = require('../../donor/models/PatientModel');

exports.getPatients = async (req, res) => {
    try {
        // Find all patients. In a real app, maybe filter by some permission or location.
        // For now, mirroring monolith behavior which likely returned all or filtered by hospital.
        // Since donors might need to search any patient to donate, we return all or allow searching.

        const patients = await Patient.find().sort({ createdAt: -1 });
        res.json({ success: true, data: patients });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch patients' });
    }
};

exports.getPatientByMrid = async (req, res) => {
    try {
        const { mrid } = req.params;
        const patient = await Patient.findOne({ mrid: { $regex: new RegExp(`^${mrid}$`, 'i') } });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, data: patient });
    } catch (error) {
        console.error('Error fetching patient by MRID:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch patient' });
    }
}

exports.searchPatients = async (req, res) => {
    try {
        const { mrid, bloodBankId } = req.query;
        const User = require('../../users/models/UserModel'); // Ensure we can lookup users

        const query = {};

        // MRID Filter (Partial, Case-Insensitive)
        if (mrid) {
            query.mrid = { $regex: new RegExp(mrid, 'i') };
        }

        // Blood Bank Filter
        if (bloodBankId) {
            // Check if it's a mongo ID (User ID) or a string (Hospital ID)
            // But usually frontend sends the User _id.

            // Try to find the user first to get the hospital_id
            let hospitalIdToSearch = bloodBankId;
            try {
                const bbUser = await User.findById(bloodBankId);
                if (bbUser && bbUser.hospital_id) {
                    hospitalIdToSearch = bbUser.hospital_id;
                }
            } catch (err) {
                // Not a valid object ID, treat as string nickname/hospital_id
            }

            query.hospital_id = hospitalIdToSearch;
        }

        console.log('Searching patients with query:', query);
        const patients = await Patient.find(query).sort({ createdAt: -1 });

        res.json({ success: true, count: patients.length, data: patients });

    } catch (error) {
        console.error('Error searching patients:', error);
        res.status(500).json({ success: false, message: 'Failed to search patients' });
    }
};
