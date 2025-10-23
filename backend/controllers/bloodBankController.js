
const BloodBank = require("../Models/BloodBank");
const User = require("../Models/User");
const Donor = require("../Models/donor");
const Patient = require("../Models/Patient");
const DonationRequest = require("../Models/DonationRequest");
const Booking = require("../Models/Booking");
const Activity = require("../Models/Activity");
const asyncHandler = require("../Middleware/asyncHandler");

// Get all approved blood banks (public endpoint for dropdown lists)
exports.getApprovedBloodBanks = asyncHandler(async (req, res) => {
  const bloodBanks = await BloodBank.find({ status: 'approved' })
    .select('name address phoneNumber email licenseNumber city district state pincode')
    .sort({ name: 1 });
  
  res.json({
    success: true,
    data: bloodBanks,
    count: bloodBanks.length
  });
});

/**
 * Register a new blood bank user and optionally create blood bank details
 * Body (supports both old and new flows):
 * - Old: { username, password }
 * - New: { username, password, name, address, contactNumber, district, licenseNumber }
 */
exports.registerBloodBankUser = asyncHandler(async (req, res) => {
  const { username, password, name, address, contactNumber, district, licenseNumber } = req.body;

  // Check if username exists in User collection
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Username already exists" });
  }

  // Create User with role 'bloodbank'
  const user = new User({
    username,
    name: username, // Use username as name to satisfy User schema requirement
    password,
    role: "bloodbank",
    provider: "local",
  });
  await user.save();

  // If full blood bank details are provided, create the BloodBank record now
  let bloodBank = null;
  const hasFullDetails = name && address && contactNumber && district && licenseNumber;
  if (hasFullDetails) {
    try {
      bloodBank = await BloodBank.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          name,
          address,
          district,
          contactNumber,
          licenseNumber,
          status: "pending",
        },
        { upsert: true, new: true, runValidators: true }
      );
    } catch (err) {
      // If blood bank creation fails (e.g., duplicate licenseNumber), roll back user and report error
      await User.findByIdAndDelete(user._id).catch(() => {});
      return res.status(400).json({ success: false, message: err.message || "Failed to create blood bank details" });
    }
  }

  return res.status(201).json({
    success: true,
    message: hasFullDetails
      ? "Blood bank user and details registered"
      : "Blood bank user registered",
    data: {
      userId: user._id,
      username: user.username,
      bloodBank,
    },
  });
});

/**
 * Submit blood bank details for approval
 * Body: { name, address, contactNumber, district, licenseNumber }
 */
exports.submitBloodBankDetails = asyncHandler(async (req, res) => {
  const { name, address, contactNumber, district, licenseNumber } = req.body;

  console.log("[DEBUG] submitBloodBankDetails called with:", { userId: req.user._id, name, address, contactNumber, district, licenseNumber });

  // Validate required fields (model also enforces this)
  if (!name || !address || !contactNumber || !district || !licenseNumber) {
    console.log("[DEBUG] Validation failed - missing required fields");
    return res.status(400).json({ success: false, message: "name, address, contactNumber, district, and licenseNumber are required" });
  }

  try {
    // Use upsert to create or update blood bank details
    const savedBloodBank = await BloodBank.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        name,
        address,
        district,
        contactNumber,
        licenseNumber,
        status: "pending",
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("[DEBUG] Blood bank saved successfully:", savedBloodBank);

    return res.status(200).json({ success: true, message: "Blood bank details submitted for approval", data: savedBloodBank });
  } catch (error) {
    console.error("[DEBUG] Error saving blood bank:", error);
    return res.status(500).json({ success: false, message: "Error saving blood bank details", error: error.message });
  }
});

/**
 * Get blood bank details for the authenticated user
 */
exports.getBloodBankByUser = asyncHandler(async (req, res) => {
  // Ensure the user is a bloodbank
  if (req.user.role !== 'bloodbank') {
    return res.status(403).json({ success: false, message: "Access denied. Bloodbank role required." });
  }

  const bloodBank = await BloodBank.findOne({ userId: req.user._id });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: "Blood bank details not found. Please submit your details for approval." });
  }
  return res.json({ success: true, data: bloodBank });
});

/**
 * Get all users (excluding admins)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
  res.json({ success: true, data: users });
});

/**
 * Get all donors
 */
exports.getAllDonors = asyncHandler(async (req, res) => {
  const donors = await Donor.find().populate('userId', 'name email username');
  res.json({ success: true, data: donors });
});

/**
 * Set status for a user
 */
exports.setUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, isSuspended, warningMessage } = req.body;

  const user = await User.findByIdAndUpdate(id, { isBlocked, isSuspended, warningMessage }, { new: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, message: 'User status updated', data: user });
});

/**
 * Set status for a donor
 */
exports.setDonorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, isSuspended, warningMessage } = req.body;

  const updateData = { isBlocked, isSuspended, warningMessage };

  if (isBlocked) {
    updateData.blockMessage = "Your account has been blocked permanently.";
  } else if (isSuspended) {
    updateData.suspendUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months
  } else if (warningMessage) {
    updateData.warningCount = 5;
  }

  const donor = await Donor.findByIdAndUpdate(id, updateData, { new: true });
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  // Also update the associated user
  const userUpdateData = { isBlocked, isSuspended, warningMessage };
  if (isBlocked) {
    userUpdateData.blockMessage = "Your account has been blocked permanently.";
  } else if (isSuspended) {
    userUpdateData.suspendUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months
  } else if (warningMessage) {
    userUpdateData.warningCount = 5;
  }

  await User.findByIdAndUpdate(donor.userId, userUpdateData, { new: true });

  res.json({ success: true, message: 'Donor status updated', data: donor });
});

/**
 * Get donation requests for patients uploaded by the bloodbank
 */
exports.getDonationRequests = asyncHandler(async (req, res) => {
  // Find the bloodbank for the current user
  const bloodBank = await BloodBank.findOne({ userId: req.user._id });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }

  // Find patients uploaded by this bloodbank
  const patients = await Patient.find({ bloodBankId: bloodBank._id }).select('_id');

  // Get donation requests for these patients
  const requests = await DonationRequest.find({ patientId: { $in: patients.map(p => p._id) } })
    .populate('donorId', 'userId bloodGroup phone address')
    .populate('donorId.userId', 'username name email')
    .populate('patientId', 'name bloodGroup address')
    .populate('requesterId', 'username name')
    .sort({ createdAt: -1 });

  // Transform the data to match frontend expectations
  const transformedRequests = requests.map(request => ({
    _id: request._id,
    donorName: request.donorId?.userId?.name || request.donorId?.userId?.username || 'Unknown',
    name: request.donorId?.userId?.name || request.donorId?.userId?.username || 'Unknown',
    email: request.donorId?.userId?.email || 'N/A',
    phone: request.donorId?.phone || 'N/A',
    bloodGroup: request.donorId?.bloodGroup || 'N/A',
    address: request.donorId?.address || 'N/A',
    donationDate: request.requestedDate ? new Date(request.requestedDate).toISOString().split('T')[0] : 'N/A',
    timeSlot: request.requestedTime || 'N/A',
    bloodBankName: bloodBank.name || 'N/A',
    status: request.status || 'pending',
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  }));

  res.json({ success: true, data: transformedRequests });
});

/**
 * Confirm a pending booking request and create Booking entry
 * Body: { donationRequestId }
 * Checks capacity: 5 per time slot, 50 per day
 */
exports.createBooking = asyncHandler(async (req, res) => {
  if (req.user.role !== 'bloodbank') {
    return res.status(403).json({ success: false, message: 'Access denied. Blood bank role required.' });
  }

  const { donationRequestId } = req.body;
  if (!donationRequestId) {
    return res.status(400).json({ success: false, message: 'donationRequestId is required' });
  }

  const bloodBank = await BloodBank.findOne({ userId: req.user._id });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }

  // Fetch the donation request
  const donationRequest = await DonationRequest.findById(donationRequestId)
    .populate('bloodBankId', 'name address')
    .populate('donorId', 'userId name bloodGroup houseAddress');
  if (!donationRequest || donationRequest.status !== 'pending_booking' || donationRequest.bloodBankId._id.toString() !== bloodBank._id.toString()) {
    return res.status(400).json({ success: false, message: 'Invalid or non-pending booking request for this blood bank' });
  }

  const { requestedDate, requestedTime } = donationRequest;
  const date = new Date(requestedDate);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  // Check daily limit: 50 confirmed bookings for this blood bank on this date
  const dailyCount = await Booking.aggregate([
    { $match: {
        bloodBankId: bloodBank._id,
        date: date,
        status: 'confirmed'
      } },
    { $count: 'count' }
  ]);
  if (dailyCount[0]?.count >= 50) {
    return res.status(400).json({ success: false, message: 'Daily booking limit (50) reached for this blood bank' });
  }

  // Check time slot limit: 5 confirmed bookings for this blood bank, date, time
  const slotCount = await Booking.aggregate([
    { $match: {
        bloodBankId: bloodBank._id,
        date: date,
        time: requestedTime,
        status: 'confirmed'
      } },
    { $count: 'count' }
  ]);
  if (slotCount[0]?.count >= 5) {
    return res.status(400).json({ success: false, message: `Time slot ${requestedTime} booking limit (5) reached for this blood bank` });
  }

  // Create booking
  const tokenNumber = `TOKEN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const booking = await Booking.create({
    bloodBankId: bloodBank._id,
    date: date,
    time: requestedTime,
    donorId: donationRequest.donorId._id,
    status: 'confirmed',
    tokenNumber,
    donationRequestId: donationRequest._id
  });

  // Update donation request status
  donationRequest.status = 'booked';
  await donationRequest.save();

  // Log booking confirmation activity
  await Activity.create({
    userId: req.user._id,
    role: 'bloodbank',
    action: 'booking_confirmed',
    details: {
      bookingId: booking._id,
      donorId: donationRequest.donorId._id,
      date: date,
      time: requestedTime,
      donationRequestId: donationRequest._id
    }
  });

  // Populate booking for response
  await booking.populate('donorId', 'userId name bloodGroup houseAddress contactNumber');
  await booking.populate('donorId.userId', 'username name email phone');
  await booking.populate('bloodBankId', 'name address');

  // Generate PDF for patient
  let pdfUrl = null;
  try {
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    const fs = require('fs');
    const path = require('path');

    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, '../uploads', `patient-booking-${booking._id}.pdf`);
    doc.pipe(fs.createWriteStream(pdfPath));

    // PDF Content
    doc.fontSize(20).text('Patient Donation Booking Confirmation', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Token Number: ${booking.tokenNumber}`);
    doc.text(`Patient MR Number: ${donationRequest.patientId?.mrid || 'N/A'}`);
    doc.text(`Donor Name: ${booking.donorId.userId.name}`);
    doc.text(`Donor ID: ${booking.donorId.userId.username}`);
    doc.text(`Blood Group: ${booking.donorId.bloodGroup}`);
    doc.text(`Blood Bank: ${booking.bloodBankId.name}`);
    doc.text(`Address: ${booking.bloodBankId.address}`);
    doc.text(`Date: ${new Date(booking.date).toLocaleDateString()}`);
    doc.text(`Time: ${booking.time}`);
    doc.moveDown();

    // Generate QR Code
    const qrData = JSON.stringify({
      token: booking.tokenNumber,
      patientMR: donationRequest.patientId?.mrid || 'N/A',
      donor: booking.donorId.userId.name,
      donorId: booking.donorId.userId.username,
      bloodBank: booking.bloodBankId.name,
      address: booking.bloodBankId.address,
      date: new Date(booking.date).toLocaleDateString(),
      time: booking.time
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData);
    const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

    // Add QR Code to PDF (placeholder)
    doc.text('Scan QR Code for details:');
    doc.moveDown();
    doc.text(qrData); // Placeholder for QR image

    doc.end();

    pdfUrl = `/uploads/patient-booking-${booking._id}.pdf`;
  } catch (pdfError) {
    console.error('Patient PDF generation error:', pdfError);
    // Don't fail the booking if PDF fails
  }

  res.json({
    success: true,
    message: 'Booking confirmed successfully',
    data: { booking, pdfUrl }
  });
});

/**
 * Get all bookings for the authenticated blood bank
 */
exports.getBookingsForBloodBank = asyncHandler(async (req, res) => {
  if (req.user.role !== 'bloodbank') {
    return res.status(403).json({ success: false, message: 'Access denied. Blood bank role required.' });
  }

  const bloodBank = await BloodBank.findOne({ userId: req.user._id });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }

  const bookings = await Booking.find({ bloodBankId: bloodBank._id })
    .populate('donorId', 'userId name bloodGroup houseAddress')
    .populate('donorId.userId', 'username name email phone')
    .populate('donationRequestId', 'requesterId patientId status')
    .sort({ date: 1, time: 1 });

  res.json({ success: true, data: bookings });
});

/**
 * Reschedule a booking
 * Body: { bookingId, newDate, newTime }
 */
exports.rescheduleBooking = asyncHandler(async (req, res) => {
  if (req.user.role !== 'bloodbank') {
    return res.status(403).json({ success: false, message: 'Access denied. Blood bank role required.' });
  }

  const { bookingId, newDate, newTime } = req.body;
  if (!bookingId || !newDate || !newTime) {
    return res.status(400).json({ success: false, message: 'bookingId, newDate, and newTime are required' });
  }

  const bloodBank = await BloodBank.findOne({ userId: req.user._id });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.bloodBankId.toString() !== bloodBank._id.toString()) {
    return res.status(404).json({ success: false, message: 'Booking not found or not owned by this blood bank' });
  }

  // Check capacity for new slot
  const date = new Date(newDate);
  const dateStr = date.toISOString().split('T')[0];

  // Check daily limit
  const dailyCount = await Booking.aggregate([
    { $match: {
        bloodBankId: bloodBank._id,
        date: date,
        status: 'confirmed'
      } },
    { $count: 'count' }
  ]);
  if (dailyCount[0]?.count >= 50) {
    return res.status(400).json({ success: false, message: 'Daily booking limit (50) reached for this blood bank' });
  }

  // Check time slot limit
  const slotCount = await Booking.aggregate([
    { $match: {
        bloodBankId: bloodBank._id,
        date: date,
        time: newTime,
        status: 'confirmed'
      } },
    { $count: 'count' }
  ]);
  if (slotCount[0]?.count >= 5) {
    return res.status(400).json({ success: false, message: `Time slot ${newTime} booking limit (5) reached for this blood bank` });
  }

  // Update booking
  booking.date = date;
  booking.time = newTime;
  await booking.save();

  // Update donation request if exists
  if (booking.donationRequestId) {
    await DonationRequest.findByIdAndUpdate(booking.donationRequestId, {
      requestedDate: date,
      requestedTime: newTime
    });
  }

  // Log reschedule activity
  await Activity.create({
    userId: req.user._id,
    role: 'bloodbank',
    action: 'booking_rescheduled',
    details: {
      bookingId: booking._id,
      oldDate: booking.date,
      oldTime: booking.time,
      newDate: date,
      newTime: newTime
    }
  });

  res.json({ success: true, message: 'Booking rescheduled successfully', data: booking });
});
