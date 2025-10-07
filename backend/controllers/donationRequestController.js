const DonationRequest = require('../Models/DonationRequest');
const Donor = require('../Models/donor');
const asyncHandler = require('../Middleware/asyncHandler');

exports.createRequest = asyncHandler(async (req, res) => {
  const { donorId } = req.params;
  const { bloodGroup, issuedAt } = req.body;

  // Validate donor exists
  const donor = await Donor.findById(donorId);
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  const payload = {
    senderId: req.user.id,
    receiverId: donor.userId,
    donorId: donor._id,
    bloodGroup: bloodGroup || donor.bloodGroup,
    status: 'pending',
    requestedAt: new Date(),
    issuedAt: issuedAt ? new Date(issuedAt) : undefined,
    isActive: true,
  };

  const request = await DonationRequest.create(payload);
  return res.status(201).json({ success: true, message: 'Request sent', data: request });
});


