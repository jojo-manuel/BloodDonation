# Quick Email Notifications Implementation

## 🚀 Copy-Paste Ready Code

### 1. Booking Confirmation Email
**File:** `backend/controllers/donationRequestController.js`  
**Location:** After line 353 (after `const booking = await Booking.create({...})`)

```javascript
// ============ ADD THIS CODE ============
// Send booking confirmation emails
try {
  const { sendEmail } = require('../config/emailService');
  
  // Email to Donor
  if (donor && donor.userId && donor.userId.email) {
    const donorSubject = 'Blood Donation Slot Booking Confirmation';
    const donorMessage = `
Hello ${donor.userId.name},

Your blood donation slot has been booked successfully!

Booking Details:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date(requestedDate).toLocaleDateString()}
🕐 Time: ${requestedTime}
🏥 Blood Bank: ${bloodBankName}
🎫 Token Number: ${tokenNumber}
${patient ? `👤 Patient: ${patient.name}` : ''}
${patient && patient.mrid ? `🆔 Patient MRID: ${patient.mrid}` : ''}

Important Notes:
━━━━━━━━━━━━━━━━━━━━
• Please arrive 15 minutes before your scheduled time
• Bring a valid ID proof
• Have a good meal before donation
• Stay hydrated

Thank you for your commitment to saving lives! 🩸❤️

Best regards,
Blood Donation Team
    `.trim();
    
    await sendEmail(donor.userId.email, donorSubject, donorMessage);
    console.log(`✅ Booking confirmation sent to donor: ${donor.userId.email}`);
  }
  
  // Email to Requester (User)
  if (requester && requester.email) {
    const userSubject = 'Blood Donation Booking Confirmed';
    const userMessage = `
Hello ${requester.username},

Great news! The blood donation slot has been confirmed.

Booking Details:
━━━━━━━━━━━━━━━━━━━━
👨‍⚕️ Donor: ${donor ? donor.userId.name : 'Unknown'}
🩸 Blood Group: ${donor ? donor.bloodGroup : 'N/A'}
📅 Date: ${new Date(requestedDate).toLocaleDateString()}
🕐 Time: ${requestedTime}
🏥 Blood Bank: ${bloodBankName}
🎫 Token Number: ${tokenNumber}
${patient ? `👤 Patient: ${patient.name}` : ''}

The donor will visit the blood bank on the scheduled date and time.

You will receive updates as the donation progresses.

Thank you for using our platform! 🙏

Best regards,
Blood Donation Team
    `.trim();
    
    await sendEmail(requester.email, userSubject, userMessage);
    console.log(`✅ Booking confirmation sent to user: ${requester.email}`);
  }
} catch (emailError) {
  console.error('❌ Booking confirmation email failed:', emailError);
  // Don't fail the booking if email fails
}
// ============ END OF CODE ============
```

---

### 2. Slot Reschedule Email
**File:** `backend/controllers/bloodBankController.js`  
**Location:** After line 693 (after `res.json({ success: true, message: 'Booking rescheduled successfully', data: booking });`)

```javascript
// ============ ADD THIS CODE ============
// Send reschedule notification email to donor
try {
  const { sendEmail } = require('../config/emailService');
  
  // Populate donor information if not already populated
  if (!booking.populated('donorId')) {
    await booking.populate({
      path: 'donorId',
      populate: { path: 'userId', select: 'name email username' }
    });
  }
  
  const donor = booking.donorId;
  
  if (donor && donor.userId && donor.userId.email) {
    const oldDate = new Date(booking.date).toLocaleDateString();
    const oldTime = booking.time;
    const subject = '⚠️ Blood Donation Appointment Rescheduled';
    const message = `
Hello ${donor.userId.name},

Your blood donation appointment has been RESCHEDULED by ${bloodBank.name}.

New Schedule:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date(date).toLocaleDateString()}
🕐 Time: ${newTime}
🏥 Blood Bank: ${bloodBank.name}
🎫 Token Number: ${booking.tokenNumber}

Previous Schedule:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${oldDate}
🕐 Time: ${oldTime}

Important:
━━━━━━━━━━━━━━━━━━━━
If you CANNOT make it at the new time, please contact the blood bank immediately:
📞 ${bloodBank.contactNumber || 'Contact blood bank'}
📧 ${bloodBank.email || ''}

Please arrive 15 minutes before your NEW scheduled time.

Thank you for your understanding and flexibility! 🙏

Best regards,
Blood Donation Team
    `.trim();
    
    await sendEmail(donor.userId.email, subject, message);
    console.log(`✅ Reschedule notification sent to donor: ${donor.userId.email}`);
  }
} catch (emailError) {
  console.error('❌ Reschedule notification email failed:', emailError);
}
// ============ END OF CODE ============
```

---

### 3. Taxi Booking Confirmation Email
**File:** `backend/controllers/taxiController.js`  
**Location:** After line 339 (inside the try block, after `const taxiBooking = await TaxiBooking.create({...});`)

```javascript
// ============ ADD THIS CODE ============
// Send taxi booking confirmation email to donor
try {
  const { sendEmail } = require('../config/emailService');
  
  // Fetch donor information
  const Donor = require('../Models/donor');
  const donor = await Donor.findById(bookingData.donorId).populate('userId', 'name email username');
  
  if (donor && donor.userId && donor.userId.email) {
    const subject = '🚕 Taxi Booking Confirmed for Blood Donation';
    const message = `
Hello ${donor.userId.name},

Your taxi has been booked successfully for your blood donation appointment!

Pickup Details:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date(bookingData.bookingDate).toLocaleDateString()}
🕐 Time: ${bookingData.bookingTime}
📍 Location: ${bookingData.pickupAddress}

Drop-off Details:
━━━━━━━━━━━━━━━━━━━━
🏥 Blood Bank: ${bookingData.dropAddress}
📏 Distance: ${bookingData.distanceKm} km

Fare Details:
━━━━━━━━━━━━━━━━━━━━
💵 Base Fare: ₹${bookingData.baseFare}
📏 Distance Charge (${bookingData.distanceKm} km × ₹${bookingData.perKmRate}/km): ₹${bookingData.totalFare - bookingData.baseFare}
━━━━━━━━━━━━━━━━━━━━
💰 Total Paid: ₹${bookingData.totalFare}

Booking Information:
━━━━━━━━━━━━━━━━━━━━
🆔 Booking ID: ${taxiBooking._id}
✅ Payment Status: Paid
📱 Status: Confirmed

Driver details will be shared with you 30 minutes before pickup time.

Important Notes:
━━━━━━━━━━━━━━━━━━━━
• Be ready 5 minutes before pickup time
• Keep your phone handy for driver contact
• Carry your booking ID for reference

Thank you for choosing our taxi service! 🚖

Best regards,
Blood Donation Team
    `.trim();
    
    await sendEmail(donor.userId.email, subject, message);
    console.log(`✅ Taxi booking confirmation sent to donor: ${donor.userId.email}`);
  }
} catch (emailError) {
  console.error('❌ Taxi booking confirmation email failed:', emailError);
  // Don't fail the taxi booking if email fails
}
// ============ END OF CODE ============
```

---

### 4. Driver Assignment Email (BONUS)
**File:** `backend/controllers/taxiController.js`  
**Location:** After line 506 (after `await booking.save();`)

```javascript
// ============ ADD THIS CODE ============
// Send driver assignment notification to donor
try {
  const { sendEmail } = require('../config/emailService');
  
  // Populate booking to get donor details
  await booking.populate({
    path: 'donorId',
    populate: { path: 'userId', select: 'name email username' }
  });
  
  const donor = booking.donorId;
  
  if (donor && donor.userId && donor.userId.email) {
    const subject = '🚗 Driver Assigned for Your Blood Donation Taxi';
    const message = `
Hello ${donor.userId.name},

Great news! A driver has been assigned for your taxi booking.

Driver Details:
━━━━━━━━━━━━━━━━━━━━
👨‍✈️ Name: ${driverName}
📞 Phone: ${driverPhone}
🚗 Vehicle Number: ${vehicleNumber}
🚙 Vehicle Type: ${vehicleType || 'Sedan'}

Pickup Details:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date(booking.bookingDate).toLocaleDateString()}
🕐 Time: ${booking.bookingTime}
📍 Location: ${booking.pickupAddress}

Drop-off:
━━━━━━━━━━━━━━━━━━━━
🏥 ${booking.dropAddress}

Important Notes:
━━━━━━━━━━━━━━━━━━━━
• The driver will contact you 30 minutes before pickup
• Please keep your phone handy
• Be ready at the pickup location on time
• Booking ID: ${booking._id}

Have a safe journey! 🛣️

Best regards,
Blood Donation Team
    `.trim();
    
    await sendEmail(donor.userId.email, subject, message);
    console.log(`✅ Driver assignment notification sent to donor: ${donor.userId.email}`);
  }
} catch (emailError) {
  console.error('❌ Driver assignment email failed:', emailError);
}
// ============ END OF CODE ============
```

---

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Verify Gmail credentials in `.env` file
- [ ] Test existing email functionality (Request Accept/Reject)
- [ ] Backup the controller files before editing

### Implementation Steps
- [ ] Add booking confirmation email (donationRequestController.js)
- [ ] Add reschedule notification email (bloodBankController.js)
- [ ] Add taxi booking confirmation email (taxiController.js)
- [ ] Add driver assignment email (taxiController.js) - Optional

### Post-Implementation
- [ ] Restart backend server
- [ ] Test each email flow
- [ ] Check spam/junk folders
- [ ] Verify email content formatting
- [ ] Monitor console logs for errors

---

## 🧪 Quick Test Commands

### Test Booking Email
```bash
# 1. Login as user
# 2. Find a donor
# 3. Send request
# 4. Donor accepts
# 5. Book a slot
# 6. Check both emails (donor + user)
```

### Test Reschedule Email
```bash
# 1. Login as blood bank
# 2. Go to bookings
# 3. Reschedule a booking
# 4. Check donor email
```

### Test Taxi Booking Email
```bash
# 1. Login as user
# 2. Open donation request
# 3. Book taxi
# 4. Complete payment
# 5. Check donor email
```

---

## 🐛 Common Issues & Fixes

### Issue: Emails not sending
**Fix:** Check console logs and verify Gmail credentials

### Issue: "Cannot find module '../config/emailService'"
**Fix:** Verify path is correct relative to controller file

### Issue: Email sent but not received
**Fix:** Check spam folder and verify recipient email in database

### Issue: App crashes when sending email
**Fix:** Wrap email code in try-catch (already included above)

---

## 📊 Expected Results

After implementation, users should receive:

1. **When booking slot:**
   - ✅ Donor receives: Booking confirmation with details
   - ✅ User receives: Booking confirmation notification

2. **When slot rescheduled:**
   - ✅ Donor receives: Reschedule notification with old vs new times

3. **When taxi booked:**
   - ✅ Donor receives: Taxi booking confirmation with fare details

4. **When driver assigned:**
   - ✅ Donor receives: Driver details and vehicle information

---

## 🎉 Success Message

After successful implementation, console should show:
```
✅ Booking confirmation sent to donor: donor@example.com
✅ Booking confirmation sent to user: user@example.com
✅ Reschedule notification sent to donor: donor@example.com
✅ Taxi booking confirmation sent to donor: donor@example.com
✅ Driver assignment notification sent to donor: donor@example.com
```

---

**Quick Implementation Guide**  
**Version:** 1.0  
**Last Updated:** October 2025

