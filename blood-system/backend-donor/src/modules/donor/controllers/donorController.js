const axios = require('axios');
const Donor = require('../models/donorModel');

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
        if (availability) query.availability = availability === 'true';

        const donors = await Donor.find(query);
        res.json({ success: true, data: donors });
    } catch (error) {
        console.error('Error searching donors:', error);
        res.status(500).json({ success: false, message: 'Failed to search donors' });
    }
};


exports.searchDonorsByMrid = async (req, res) => {
    try {
        const { mrid } = req.params;
        // Logic to search by MRID would go here if MRID was part of Donor model
        // For now, keeping the mock logic as requested previously or implementing if MRID is added

        // Since MRID is likely on the Patient or Hospital side or a specific field we haven't added to Donor,
        // we'll keep the mock purely for demonstration unless instructed otherwise.

        const mockDonor = {
            _id: '675a7c2d8e4b1a2f3c4d5e6f',
            name: 'Mock Donor',
            bloodGroup: 'O+',
            contactNumber: '1234567890',
            email: 'mock@donor.com',
            address: '123 Mock St, Mock City',
            mrid: mrid
        };

        if (mrid === '123') {
            res.json({ success: true, data: [mockDonor] });
        } else {
            res.status(404).json({ success: false, message: 'Donor not found with this MRID' });
        }
    } catch (error) {
        console.error('Error searching donor by MRID:', error);
        res.status(500).json({ success: false, message: 'Failed to search donor' });
    }
};
