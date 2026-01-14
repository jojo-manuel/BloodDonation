const axios = require('axios');
const Donor = require('../models/donorModel');
const User = require('../../users/models/UserModel');

exports.getAddressByPincode = async (req, res) => {
    try {
        const { pincode } = req.params;
        // Pincode API: https://api.postalpincode.in/pincode/{PINCODE}
        const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch address details' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id; // Assumes auth middleware populates req.user
        const donor = await Donor.findOne({ userId });

        if (!donor) {
            return res.status(404).json({ success: false, message: "Donor profile not found" });
        }

        res.json({ success: true, data: donor });
    } catch (error) {
        console.error('Error fetching donor profile:', error);
        res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
};

exports.createProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Check if profile already exists
        const existingDonor = await Donor.findOne({ userId });
        if (existingDonor) {
            return res.status(400).json({ success: false, message: "Donor profile already exists" });
        }

        const newDonor = new Donor({
            userId,
            ...req.body
        });

        await newDonor.save();
        res.status(201).json({ success: true, message: "Donor registered successfully", data: newDonor });
    } catch (error) {
        console.error('Error creating donor profile:', error);
        res.status(500).json({ success: false, message: 'Failed to register donor', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const donor = await Donor.findOneAndUpdate(
            { userId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!donor) {
            return res.status(404).json({ success: false, message: "Donor profile not found" });
        }

        res.json({ success: true, message: "Donor profile updated successfully", data: donor });
    } catch (error) {
        console.error('Error updating donor profile:', error);
        res.status(500).json({ success: false, message: 'Failed to update donor profile' });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await Donor.findOneAndDelete({ userId });

        if (!result) {
            return res.status(404).json({ success: false, message: "Donor profile not found" });
        }

        res.json({ success: true, message: "Donor profile deleted successfully" });
    } catch (error) {
        console.error('Error deleting donor profile:', error);
        res.status(500).json({ success: false, message: 'Failed to delete donor profile' });
    }
};


exports.getAvailableCities = async (req, res) => {
    try {
        // Fetch distinct cities from the database
        const cities = await Donor.distinct('houseAddress.city');
        res.json({ success: true, data: cities });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cities' });
    }
};

exports.searchDonors = async (req, res) => {
    try {
        const { bloodGroup, city, availability } = req.query;
        let query = {};

        if (bloodGroup) query.bloodGroup = bloodGroup;
        if (city) query['houseAddress.city'] = new RegExp(city, 'i'); // Case-insensitive
        if (availability === 'available') query.availability = true;
        else if (availability === 'unavailable') query.availability = false;
        // If availability is somehow 'true'/'false' strings
        else if (availability === 'true') query.availability = true;
        else if (availability === 'false') query.availability = false;

        const donors = await Donor.find(query)
            .populate('userId', 'username name email phone profileImage');
        res.json({ success: true, data: donors });
    } catch (error) {
        console.error('Error searching donors:', error);
        res.status(500).json({ success: false, message: 'Failed to search donors' });
    }
};


exports.searchDonorsByMrid = async (req, res) => {
    try {
        const { mrid } = req.params;
        const { bloodBankId } = req.query;
        const Patient = require('../models/PatientModel');

        if (!mrid) {
            return res.status(400).json({ success: false, message: 'MRID is required' });
        }

        // Build query
        const query = { mrid: { $regex: new RegExp(`^${mrid}$`, 'i') } };
        if (bloodBankId) {
            // The frontend sends the User _id of the blood bank.
            // But the Patient model stores 'hospital_id' which corresponds to the 'hospital_id' field in the User model.
            // So we must fetch the User to get the correct hospital_id string.
            const bbUser = await User.findById(bloodBankId);
            if (bbUser && bbUser.hospital_id) {
                query.hospital_id = bbUser.hospital_id;
            } else {
                // Fallback: use the provided ID directly
                query.hospital_id = bloodBankId;
            }
        }

        // Find patient by MRID (case-insensitive) and optionally blood bank
        const patient = await Patient.findOne(query);

        if (!patient) {
            console.log(`Patient not found for MRID: ${mrid}${bloodBankId ? ` and Blood Bank: ${bloodBankId}` : ''}`);
            return res.status(404).json({ success: false, message: 'Patient not found with this MRID' });
        }

        console.log(`Found patient: ${patient.patientName || patient.name}, BG: ${patient.bloodGroup}`);

        // Find donors matching the patient's blood group
        const donors = await Donor.find({
            bloodGroup: patient.bloodGroup,
            availability: true
        })
            .populate('userId', 'username name email phone profileImage');

        console.log(`Found ${donors.length} matching donors for BG ${patient.bloodGroup}`);

        res.json({
            success: true,
            data: donors,
            patientInfo: {
                name: patient.patientName || patient.name,
                bloodGroup: patient.bloodGroup,
                mrid: patient.mrid,
                hospital_id: patient.hospital_id
            }
        });

    } catch (error) {
        console.error('Error searching donor by MRID:', error);
        res.status(500).json({ success: false, message: 'Failed to search donor by MRID' });
    }
};
