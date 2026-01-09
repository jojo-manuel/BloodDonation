const axios = require('axios');

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

// Placeholder for other functions to prevent crashes if referenced elsewhere (though app.js doesn't reference controllers directly)

exports.getAvailableCities = async (req, res) => {
    try {
        // Mock data for cities
        const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad"];
        res.json({ success: true, data: cities });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cities' });
    }
};

exports.searchDonors = async (req, res) => {
    try {
        const { bloodGroup, city, availability } = req.query;
        // Mock data for donors
        const donors = [
            {
                _id: "675a7c2d8e4b1a2f3c4d5e6f",
                name: "John Doe",
                bloodGroup: "O+",
                location: "Delhi",
                availability: "available",
                houseAddress: { city: "Delhi" },
                userId: { name: "John Doe", username: "johndoe" },
                eligibilityStatus: "eligible"
            },
            {
                _id: "675a7c2d8e4b1a2f3c4d5e70",
                name: "Jane Smith",
                bloodGroup: "A-",
                location: "Mumbai",
                availability: "available",
                houseAddress: { city: "Mumbai" },
                userId: { name: "Jane Smith", username: "janesmith" },
                eligibilityStatus: "eligible"
            }
        ];

        // Simple mock filtering
        let results = donors;
        if (bloodGroup) results = results.filter(d => d.bloodGroup === bloodGroup);
        // if (city) results = results.filter(d => d.location.toLowerCase() === city.toLowerCase());

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error searching donors:', error);
        res.status(500).json({ success: false, message: 'Failed to search donors' });
    }
};


exports.searchDonorsByMrid = async (req, res) => {
    try {
        const { mrid } = req.params;
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
