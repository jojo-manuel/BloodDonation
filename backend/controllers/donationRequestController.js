const DonationRequest = require('../Models/DonationRequest');
const Donor = require('../Models/donor');
const asyncHandler = require('../Middleware/asyncHandler');

exports.createRequest = asyncHandler(async (req, res) => {
  const { donorId } = req.params;
  const { bloodGroup, issuedAt, patientId } = req.body;

  // Validate donor exists
  const donor = await Donor.findById(donorId).populate('userId', 'role name email');
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  // Get blood bank details if sender is blood bank
  let bloodBankId = null;
  let bloodBankName = null;
  const User = require('../Models/User');
  const sender = await User.findById(req.user.id);
  if (sender.role === 'bloodbank') {
    const BloodBank = require('../Models/BloodBank');
    const bloodBank = await BloodBank.findOne({ userId: req.user.id });
    if (bloodBank) {
      bloodBankId = bloodBank._id;
      bloodBankName = bloodBank.name;
    }
  }

  // Get patient details if patientId is provided
  let patient = null;
  let patientUsername = null;
  let patientMRID = null;
  if (patientId) {
    const Patient = require('../Models/Patient');
    patient = await Patient.findById(patientId).populate('bloodBankId', 'name address');
    if (patient) {
      patientUsername = patient.name || patient.patientName;
      patientMRID = patient.mrid;
      // If no blood bank from sender, get it from patient
      if (!bloodBankId && patient.bloodBankId) {
        bloodBankId = patient.bloodBankId._id;
        bloodBankName = patient.bloodBankId.name;
      }
    }
  }

  const payload = {
    senderId: req.user.id,
    receiverId: donor.userId._id || donor.userId,
    donorUserId: donor.userId._id || donor.userId, // User ID of the donor
    donorId: donor._id,
    bloodBankId: bloodBankId, // ID of the blood bank issuing the request
    patientId: patientId || null, // Patient ID if provided
    bloodGroup: bloodGroup || donor.bloodGroup,
    bloodBankName: bloodBankName, // Name of the blood bank issuing the request
    bloodBankUsername: bloodBankName, // Fallback for display
    patientUsername: patientUsername, // Patient name for display
    patientMRID: patientMRID, // Patient MRID for display
    donorUsername: donor.name || donor.userId?.name, // Donor name for display
    requesterUsername: sender.username || sender.name, // Requester name for display
    status: 'pending',
    requestedAt: new Date(),
    issuedAt: issuedAt ? new Date(issuedAt) : undefined,
    isActive: true,
  };

  const request = await DonationRequest.create(payload);
  return res.status(201).json({ success: true, message: 'Request sent', data: request });
});

exports.listReceived = asyncHandler(async (req, res) => {
  // Return all donation requests in the system
  const requests = await DonationRequest.find()
    .populate({
      path: 'donorId',
      populate: {
        path: 'userId',
        select: 'username name email'
      }
    })
    .populate('senderId', 'username name email')
    .populate('receiverId', 'username name email')
    .populate('bloodBankId', 'name')
    .populate({
      path: 'patientId',
      select: 'name bloodGroup address bloodBankId dateNeeded unitsNeeded',
      populate: {
        path: 'bloodBankId',
        select: 'name address',
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: requests });
});

exports.listAll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get the logged-in user's username
  const User = require('../Models/User');
  const loggedInUser = await User.findById(userId);
  if (!loggedInUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Return all donation requests where the logged-in user is the receiver (To field)
  const requests = await DonationRequest.find({
    'receiverId': userId
  })
    .populate({
      path: 'donorId',
      populate: {
        path: 'userId',
        select: 'username name email'
      }
    })
    .populate('senderId', 'username name email')
    .populate('receiverId', 'username name email')
    .populate('bloodBankId', 'name address')
    .populate({
      path: 'patientId',
      select: 'name bloodGroup address bloodBankId dateNeeded unitsNeeded',
      populate: {
        path: 'bloodBankId',
        select: 'name address',
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: requests });
});

exports.listSent = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requests = await DonationRequest.find({ senderId: userId })
    .populate('senderId', 'username name email')
    .populate('receiverId', 'username name email')
    .populate('bloodBankId', 'name address')
    .populate({
      path: 'patientId',
      select: 'name bloodGroup address bloodBankId dateNeeded unitsNeeded mrid',
      populate: {
        path: 'bloodBankId',
        select: 'name address',
      },
    })
    .populate({
      path: 'donorId',
      populate: {
        path: 'userId',
        select: 'username name email'
      }
    })
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

  // Validate status (aligned with DonationRequest model enum)
  const validStatuses = ['pending', 'pending_booking', 'accepted', 'rejected', 'booked', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  request.status = status;
  if (status === 'accepted' || status === 'rejected') {
    request.respondedAt = new Date();
  }

  await request.save();

  // Send email notification
  try {
    const { sendEmail } = require('../config/emailService');
    const sender = await require('../Models/User').findById(request.senderId);
    const receiver = await require('../Models/User').findById(request.receiverId);

    if (sender && sender.email) {
      const subject = status === 'accepted' ? 'Donation Request Accepted' : 'Donation Request Rejected';
      const message = status === 'accepted'
        ? `Your donation request has been accepted by ${receiver?.username || 'the recipient'}. Please proceed with booking a slot.`
        : `Your donation request has been rejected by ${receiver?.username || 'the recipient'}.`;

      await sendEmail(sender.email, subject, message);
    }
  } catch (emailError) {
    console.error('Email notification failed:', emailError);
    // Don't fail the request if email fails
  }

  return res.json({ success: true, message: 'Status updated', data: request });
});

// Helper function to generate token number based on time
function generateTokenNumber(requestedTime, bloodBankId, requestedDate) {
  // Parse time string (e.g., "10:00 AM")
  const timeMatch = requestedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) throw new Error('Invalid time format');

  let hour = parseInt(timeMatch[1]);
  const minute = parseInt(timeMatch[2]);
  const ampm = timeMatch[3].toUpperCase();

  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  const totalMinutes = hour * 60 + minute;

  // 9 AM = 540 minutes, 4 PM = 960 minutes
  const minMinutes = 9 * 60; // 540
  const maxMinutes = 16 * 60; // 960
  const minToken = 15;
  const maxToken = 70;

  // Linear interpolation
  let baseToken = minToken + ((totalMinutes - minMinutes) / (maxMinutes - minMinutes)) * (maxToken - minToken);
  baseToken = Math.round(baseToken);

  // Ensure within bounds
  if (baseToken < minToken) baseToken = minToken;
  if (baseToken > maxToken) baseToken = maxToken;

  return baseToken;
}

exports.bookSlot = asyncHandler(async (req, res) => {
  const { donorId, requestId } = req.params;
  const { requestedDate, requestedTime, bloodBankName } = req.body;
  const userId = req.user.id;

  // Validate time slot: only between 9 AM and 4 PM
  const timeSlot = new Date(`1970-01-01T${requestedTime}`);
  const hour = timeSlot.getHours();
  if (hour < 9 || hour >= 16) {
    return res.status(400).json({ success: false, message: 'Slot booking is only allowed between 9 AM and 4 PM' });
  }

  // Find the request
  const request = await DonationRequest.findById(requestId);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  // Check if the user is the receiver (donor)
  if (request.receiverId.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Accept the request if it's pending or pending_booking
  if (request.status === 'pending' || request.status === 'pending_booking') {
    request.status = 'accepted';
    request.respondedAt = new Date();
  }

  // Update the request
  request.requestedDate = new Date(requestedDate);
  request.requestedTime = requestedTime;
  request.status = 'booked';
  await request.save();

  // Always create booking
  const Booking = require('../Models/Booking');

  // Generate token number based on time if bloodBankId exists, else set to 'N/A'
  let tokenNumber = 'N/A';
  if (request.bloodBankId) {
    tokenNumber = generateTokenNumber(requestedTime, request.bloodBankId, requestedDate);

    // Check for existing tokens on the same day and increment if necessary
    const bookingDate = new Date(requestedDate);
    const existingBookings = await Booking.find({
      bloodBankId: request.bloodBankId,
      date: {
        $gte: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate()),
        $lt: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate() + 1)
      }
    }).sort({ tokenNumber: -1 });

    const existingTokens = existingBookings.map(b => parseInt(b.tokenNumber)).filter(t => !isNaN(t));
    while (existingTokens.includes(tokenNumber) && tokenNumber < 70) {
      tokenNumber++;
    }

    if (tokenNumber > 70) {
      return res.status(400).json({ success: false, message: 'No slots available for this date. Maximum token number reached.' });
    }

    tokenNumber = tokenNumber.toString();
  }

  // Populate names and details for booking
  const donor = await require('../Models/donor').findById(request.donorId).populate('userId', 'username name');
  const requester = await require('../Models/User').findById(request.senderId);
  const patient = request.patientId ? await require('../Models/Patient').findById(request.patientId) : null;
  const bloodBank = request.bloodBankId ? await require('../Models/BloodBank').findById(request.bloodBankId) : null;

  const booking = await Booking.create({
    donorId: request.donorId,
    bloodBankId: request.bloodBankId || null,
    date: new Date(requestedDate),
    time: requestedTime,
    donationRequestId: request._id,
    tokenNumber,
    status: 'confirmed',
    patientName: patient ? patient.name : 'N/A',
    donorName: donor ? donor.userId.name : 'N/A',
    requesterName: requester ? requester.username : 'N/A',
    bloodBankName: bloodBankName || (bloodBank ? bloodBank.name : 'N/A'),
    bloodGroup: donor ? donor.bloodGroup : 'N/A',
    patientMRID: patient ? patient.mrid : 'N/A'
  });

  // Generate PDF if booking was created
  let pdfUrl = null;
    try {
      const PDFDocument = require('pdfkit');
      const QRCode = require('qrcode');
      const fs = require('fs');
      const path = require('path');

      // Populate booking data
      await booking.populate('donorId', 'userId name bloodGroup contactNumber houseAddress');
      await booking.populate('donorId.userId', 'username name');
      await booking.populate('bloodBankId', 'name address');

      const doc = new PDFDocument();
      const pdfPath = path.join(__dirname, '../uploads', `booking-${booking._id}.pdf`);
      doc.pipe(fs.createWriteStream(pdfPath));

      // PDF Content
      doc.fontSize(20).text('Blood Donation Booking Confirmation', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Token Number: ${booking.tokenNumber}`);
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
        donor: booking.donorId.userId.name,
        donorId: booking.donorId.userId.username,
        bloodBank: booking.bloodBankId.name,
        address: booking.bloodBankId.address,
        date: new Date(booking.date).toLocaleDateString(),
        time: booking.time
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData);
      const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

      // Add QR Code to PDF (simplified - in real implementation you'd need to handle image embedding)
      doc.text('Scan QR Code for details:');
      doc.moveDown();
      doc.text(qrData); // Placeholder - actual QR image would need additional setup

      doc.end();

      pdfUrl = `/uploads/booking-${booking._id}.pdf`;
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Don't fail the booking if PDF fails
    }

  return res.json({
    success: true,
    message: 'Slot booked successfully',
    data: { request, booking, pdfUrl }
  });
});


