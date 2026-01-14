const Request = require('../models/Request');
const Donor = require('../../donor/models/donorModel');

exports.createRequest = async (req, res) => {
    try {
        const { bloodGroup, patientId, notes } = req.body;
        const donorId = req.params.donorId;
        const requesterId = req.user.user_id;

        const request = new Request({
            donorId,
            patientId,
            requesterId, // This is the user ID of the person making the request
            bloodGroup,
            notes,
            status: 'pending'
        });

        await request.save();

        // Notify donor logic here (e.g. push notification, email)

        res.status(201).json({ success: true, message: 'Request sent successfully', data: request });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ success: false, message: 'Failed to create request' });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        const userId = req.user.user_id;
        // Find requests where the user is the requester (e.g. looking for donors)
        const sentRequests = await Request.find({ requesterId: userId })
            .populate('donorId', 'name bloodGroup houseAddress contactNumber')
            .populate('patientId', 'patientName mrid hospital_id')
            .sort({ createdAt: -1 });

        // Find requests where the user is the donor (if they are a donor)
        // First find the donor profile ID for this user
        const donorProfile = await Donor.findOne({ userId });
        let receivedRequests = [];

        if (donorProfile) {
            receivedRequests = await Request.find({ donorId: donorProfile._id })
                .populate('requesterId', 'name email phone') // basic user info
                .populate('patientId', 'patientName mrid hospital_id')
                .sort({ createdAt: -1 });
        }

        res.json({
            success: true,
            data: {
                requests: sentRequests, // sent by me
                received: receivedRequests // received by me (as a donor)
            }
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const userId = req.user.user_id;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Verify ownership: either the requester can cancel, or the donor can accept/reject
        // We need to check if userId matches requesterId or if userId matches the donor's userId

        // Check if user is the requester (can only cancel)
        if (request.requesterId.toString() === userId) {
            if (status !== 'cancelled') {
                return res.status(403).json({ success: false, message: 'Requester can only cancel requests' });
            }
        } else {
            // Check if user is the donor
            const donor = await Donor.findById(request.donorId);
            if (!donor || donor.userId.toString() !== userId) {
                return res.status(403).json({ success: false, message: 'Not authorized to update this request' });
            }
        }

        request.status = status;
        await request.save();

        res.json({ success: true, message: `Request ${status} successfully`, data: request });

    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ success: false, message: 'Failed to update request' });
    }
};
