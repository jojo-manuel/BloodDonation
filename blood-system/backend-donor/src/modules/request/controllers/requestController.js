const Request = require('../models/Request');
const Donor = require('../../donor/models/donorModel');
const Patient = require('../../patient/models/Patient'); // Ensure Patient model is registered

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
        console.log(`[DEBUG] getMyRequests for UserID: ${userId}`);

        // Find requests where the user is the requester (e.g. looking for donors)
        const sentRequests = await Request.find({ requesterId: userId })
            .populate('donorId', 'name bloodGroup houseAddress contactNumber')
            .populate('patientId', 'patientName name mrid hospital_id bloodGroup requiredUnits requiredDate')
            .populate('bookingId')
            .sort({ createdAt: -1 });

        console.log(`[DEBUG] Found ${sentRequests.length} sent requests`);

        // Find requests where the user is the donor (if they are a donor)
        // First find the donor profile ID for this user
        const donorProfile = await Donor.findOne({ userId });
        let receivedRequests = [];

        if (donorProfile) {
            console.log(`[DEBUG] User is donor: ${donorProfile._id}`);
            receivedRequests = await Request.find({ donorId: donorProfile._id })
                .populate('requesterId', 'name username email phone') // basic user info
                .populate('patientId', 'patientName name mrid hospital_id bloodGroup requiredUnits requiredDate')
                .populate('bookingId')
                .sort({ createdAt: -1 });
            console.log(`[DEBUG] Found ${receivedRequests.length} received requests`);
        } else {
            console.log('[DEBUG] User is NOT a donor');
        }

        // Fetch blood bank data from bloodbank service
        const axios = require('axios');
        const bloodBankServiceUrl = process.env.BLOODBANK_SERVICE_URL || 'http://localhost:3000';

        try {
            const bbResponse = await axios.get(`${bloodBankServiceUrl}/bloodbank/all`);
            const bloodBanks = bbResponse.data.data || [];

            console.log(`[DEBUG] Fetched ${bloodBanks.length} blood banks from service`);
            if (bloodBanks.length > 0) {
                console.log('[DEBUG] Sample blood bank:', {
                    _id: bloodBanks[0]._id,
                    name: bloodBanks[0].name,
                    hospital_id: bloodBanks[0].hospital_id
                });
            }

            // Attach blood bank info to each request based on patient's hospital_id
            const attachBloodBankInfo = (requests) => {
                return requests.map(req => {
                    const reqObj = req.toObject();
                    if (reqObj.patientId && reqObj.patientId.hospital_id) {
                        const patientHospitalId = reqObj.patientId.hospital_id;
                        console.log(`[DEBUG] Looking for blood bank with hospital_id: "${patientHospitalId}"`);

                        const bb = bloodBanks.find(b => {
                            const match = b._id.toString() === patientHospitalId || b.hospital_id === patientHospitalId;
                            if (match) {
                                console.log(`[DEBUG] ✅ MATCH FOUND: ${b.name} (hospital_id: "${b.hospital_id}")`);
                            }
                            return match;
                        });

                        if (bb) {
                            reqObj.bloodBankId = {
                                _id: bb._id,
                                name: bb.name,
                                address: bb.address,
                                phone: bb.phone
                            };
                            console.log(`[DEBUG] Attached blood bank "${bb.name}" to request ${reqObj._id}`);
                        } else {
                            console.log(`[DEBUG] ❌ NO MATCH for hospital_id: "${patientHospitalId}"`);
                            console.log('[DEBUG] Available hospital_ids:', bloodBanks.map(b => `"${b.hospital_id}"`).join(', '));
                        }
                    } else {
                        console.log('[DEBUG] Request has no patient or hospital_id');
                    }
                    return reqObj;
                });
            };

            const enrichedSentRequests = attachBloodBankInfo(sentRequests);
            const enrichedReceivedRequests = attachBloodBankInfo(receivedRequests);

            res.json({
                success: true,
                data: {
                    requests: enrichedSentRequests, // sent by me
                    received: enrichedReceivedRequests // received by me (as a donor)
                }
            });
        } catch (bbError) {
            console.error('[WARN] Failed to fetch blood banks:', bbError.message);
            // Return requests without blood bank info if service is unavailable
            res.json({
                success: true,
                data: {
                    requests: sentRequests,
                    received: receivedRequests
                }
            });
        }
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
        // Check if user is the requester
        if (request.requesterId.toString() === userId) {
            // Special Case: If the requester IS ALSO the donor (self-request), allow them to update to any status
            const donor = await Donor.findById(request.donorId);
            const isSelfRequest = donor && donor.userId.toString() === userId;

            if (!isSelfRequest && status !== 'cancelled') {
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
