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

exports.listReceived = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requests = await DonationRequest.find({ receiverId: userId })
    .populate('senderId', 'username name email')
    .populate('receiverId', 'username name email')
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ success: true, data: requests });
});

exports.listSent = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requests = await DonationRequest.find({ senderId: userId })
    .populate('senderId', 'username name email')
    .populate('receiverId', 'username name email')
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ success: true, data: requests });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  const request = await DonationRequest.findById(id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  // Allow update if user is sender or receiver
  if (request.senderId.toString() !== userId && request.receiverId.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this request' });
  }

  // Validate status
  const validStatuses = ['pending', 'pending_booking', 'accepted', 'rejected', 'booked'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  request.status = status;
  if (status === 'accepted' || status === 'rejected') {
    request.respondedAt = new Date();
  }

  await request.save();

  return res.json({ success: true, message: 'Status updated', data: request });
});


