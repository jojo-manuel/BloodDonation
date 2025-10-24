# Email Notifications Implementation Guide

## Overview
Gmail-based email notification system for Blood Donation Application with notifications for booking confirmations, reschedules, and taxi bookings.

---

## 📧 Email Service Configuration

### Setup Files

#### 1. **Email Service** (`backend/config/emailService.js`)
```javascript
const nodemailer = require('nodemailer');
const env = require('./env');

// Gmail transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_PASS  // App-specific password
    }
  });
};

// Send email function
const sendEmail = async (to, subject, text, html = null) => {
  // Implementation with error handling
};
```

#### 2. **Environment Variables** (`backend/config/env.js`)
Required variables:
- `GMAIL_USER`: Gmail email address
- `GMAIL_PASS`: Gmail app-specific password (not regular password)

---

## 📬 Implemented Email Notifications

### 1. **Donation Request Status Updates**
**Location:** `backend/controllers/donationRequestController.js` (Line 214-231)

**Triggers:**
- When donation request is **accepted**
- When donation request is **rejected**

**Recipients:**
- Request sender (user who requested blood)

**Email Content:**
```javascript
// Accepted
Subject: "Donation Request Accepted"
Message: "Your donation request has been accepted by [donor_name]. Please proceed with booking a slot."

// Rejected
Subject: "Donation Request Rejected"
Message: "Your donation request has been rejected by [donor_name]."
```

**Code Reference:**
```javascript
// Send email notification
try {
  const { sendEmail } = require('../config/emailService');
  const sender = await require('../Models/User').findById(request.senderId);
  const receiver = await require('../Models/User').findById(request.receiverId);

  if (sender && sender.email) {
    const subject = status === 'accepted' 
      ? 'Donation Request Accepted' 
      : 'Donation Request Rejected';
    const message = status === 'accepted'
      ? `Your donation request has been accepted by ${receiver?.username || 'the recipient'}. Please proceed with booking a slot.`
      : `Your donation request has been rejected by ${receiver?.username || 'the recipient'}.`;

    await sendEmail(sender.email, subject, message);
  }
} catch (emailError) {
  console.error('Email notification failed:', emailError);
  // Don't fail the request if email fails
}
```

---

## 🎯 Recommended Additional Email Notifications

### 2. **Booking Confirmation** ⚠️ RECOMMENDED
**Location:** `backend/controllers/donationRequestController.js` (After line 353)

**When to send:**
- When slot is successfully booked (`bookSlot` function)
- Status changes to `'booked'`

**Suggested Recipients:**
- ✅ **Donor** (receiver) - Confirm their commitment
- ✅ **User** (requester/sender) - Booking confirmation

**Suggested Implementation:**
```javascript
// Add after line 353 (after booking is created)
try {
  const { sendEmail } = require('../config/emailService');
  
  // Email to Donor
  if (donor && donor.userId && donor.userId.email) {
    const donorSubject = 'Blood Donation Slot Booking Confirmation';
    const donorMessage = `
Hello ${donor.userId.name},

Your blood donation slot has been booked:
- Date: ${new Date(requestedDate).toLocaleDateString()}
- Time: ${requestedTime}
- Blood Bank: ${bloodBankName}
- Token Number: ${tokenNumber}
- Patient: ${patient ? patient.name : 'Not Specified'}

Thank you for your commitment to saving lives!

Please arrive 15 minutes before your scheduled time.
    `.trim();
    
    await sendEmail(donor.userId.email, donorSubject, donorMessage);
  }
  
  // Email to Requester (User)
  if (requester && requester.email) {
    const userSubject = 'Blood Donation Booking Confirmed';
    const userMessage = `
Hello ${requester.username},

The blood donation slot has been confirmed:
- Donor: ${donor ? donor.userId.name : 'Unknown'}
- Date: ${new Date(requestedDate).toLocaleDateString()}
- Time: ${requestedTime}
- Blood Bank: ${bloodBankName}
- Token Number: ${tokenNumber}

The donor will visit the blood bank on the scheduled date.
    `.trim();
    
    await sendEmail(requester.email, userSubject, userMessage);
  }
} catch (emailError) {
  console.error('Booking confirmation email failed:', emailError);
}
```

---

### 3. **Slot Reschedule Notification** ⚠️ RECOMMENDED
**Location:** `backend/controllers/bloodBankController.js` (After line 693)

**When to send:**
- When blood bank reschedules a booking slot

**Recipients:**
- ✅ **Donor** - Notify about time change

**Suggested Implementation:**
```javascript
// Add after line 693 (after booking is updated)
try {
  const { sendEmail } = require('../config/emailService');
  
  // Populate donor information
  await booking.populate('donorId');
  await booking.populate('donorId.userId', 'name email');
  
  const donor = booking.donorId;
  
  if (donor && donor.userId && donor.userId.email) {
    const subject = 'Blood Donation Slot Rescheduled';
    const message = `
Hello ${donor.userId.name},

Your blood donation appointment has been rescheduled by the blood bank.

New Schedule:
- Date: ${new Date(date).toLocaleDateString()}
- Time: ${newTime}
- Blood Bank: ${bloodBank.name}
- Token Number: ${booking.tokenNumber}

Previous Schedule:
- Date: ${new Date(booking.date).toLocaleDateString()}
- Time: ${booking.time}

If you cannot make it at the new time, please contact the blood bank as soon as possible.

Thank you for your understanding!
    `.trim();
    
    await sendEmail(donor.userId.email, subject, message);
  }
} catch (emailError) {
  console.error('Reschedule notification email failed:', emailError);
}
```

---

### 4. **Taxi Booking Confirmation** ⚠️ RECOMMENDED
**Location:** `backend/controllers/taxiController.js` (After line 339)

**When to send:**
- When taxi booking payment is verified and confirmed

**Recipients:**
- ✅ **Donor** - Taxi booking details

**Suggested Implementation:**
```javascript
// Add after line 339 (after taxi booking is created)
try {
  const { sendEmail } = require('../config/emailService');
  
  // Fetch donor information
  const Donor = require('../Models/donor');
  const donor = await Donor.findById(bookingData.donorId).populate('userId', 'name email');
  
  if (donor && donor.userId && donor.userId.email) {
    const subject = 'Taxi Booking Confirmed for Blood Donation';
    const message = `
Hello ${donor.userId.name},

Your taxi has been booked for your blood donation appointment!

Pickup Details:
- Date: ${new Date(bookingData.bookingDate).toLocaleDateString()}
- Time: ${bookingData.bookingTime}
- Location: ${bookingData.pickupAddress}

Drop-off:
- Blood Bank: ${bookingData.dropAddress}
- Distance: ${bookingData.distanceKm} km

Fare Details:
- Base Fare: ₹${bookingData.baseFare}
- Distance Charge: ₹${bookingData.totalFare - bookingData.baseFare}
- Total Paid: ₹${bookingData.totalFare}

Booking ID: ${taxiBooking._id}
Payment Status: Paid

Driver details will be shared closer to your appointment time.

Thank you for choosing our taxi service!
    `.trim();
    
    await sendEmail(donor.userId.email, subject, message);
  }
} catch (emailError) {
  console.error('Taxi booking confirmation email failed:', emailError);
}
```

---

### 5. **Driver Assignment Notification** 🆕 BONUS
**Location:** `backend/controllers/taxiController.js` (After line 506)

**When to send:**
- When driver is assigned to taxi booking

**Recipients:**
- ✅ **Donor** - Driver details

**Suggested Implementation:**
```javascript
// Add after line 506 (after driver assignment)
try {
  const { sendEmail } = require('../config/emailService');
  
  // Populate booking to get donor details
  await booking.populate({
    path: 'donorId',
    populate: { path: 'userId', select: 'name email' }
  });
  
  const donor = booking.donorId;
  
  if (donor && donor.userId && donor.userId.email) {
    const subject = 'Driver Assigned for Your Blood Donation Taxi';
    const message = `
Hello ${donor.userId.name},

A driver has been assigned for your taxi booking!

Driver Details:
- Name: ${driverName}
- Phone: ${driverPhone}
- Vehicle: ${vehicleNumber}
- Type: ${vehicleType || 'Sedan'}

Pickup Details:
- Date: ${new Date(booking.bookingDate).toLocaleDateString()}
- Time: ${booking.bookingTime}
- Location: ${booking.pickupAddress}

Please keep your phone handy. The driver will contact you shortly before pickup.

Safe journey!
    `.trim();
    
    await sendEmail(donor.userId.email, subject, message);
  }
} catch (emailError) {
  console.error('Driver assignment email failed:', emailError);
}
```

---

## 🔧 Gmail Configuration Setup

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to **Security**
3. Enable **2-Step Verification**

### Step 2: Generate App-Specific Password
1. Go to **Google Account** > **Security**
2. Select **2-Step Verification**
3. Scroll down to **App passwords**
4. Select app: **Mail**
5. Select device: **Other (Custom name)** - Enter "Blood Donation App"
6. Click **Generate**
7. Copy the 16-character password

### Step 3: Add to Environment Variables
```bash
# .env file
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password
```

### Step 4: Restart Backend Server
```bash
cd backend
npm start
```

---

## 📋 Email Notification Summary

### Currently Implemented ✅
| Event | Recipient | Status | Location |
|-------|-----------|--------|----------|
| Request Accepted | Requester | ✅ Implemented | donationRequestController.js:214 |
| Request Rejected | Requester | ✅ Implemented | donationRequestController.js:214 |

### Recommended to Implement ⚠️
| Event | Recipient | Priority | Location |
|-------|-----------|----------|----------|
| Slot Booked | Donor + User | 🔴 High | donationRequestController.js:353+ |
| Slot Rescheduled | Donor | 🔴 High | bloodBankController.js:693+ |
| Taxi Booked | Donor | 🟡 Medium | taxiController.js:339+ |
| Driver Assigned | Donor | 🟢 Low | taxiController.js:506+ |
| Booking Cancelled | Donor + User | 🟡 Medium | bloodBankController.js:702+ |
| Donation Completed | Donor + User | 🟢 Low | bloodBankController.js:702+ |

---

## 🧪 Testing Email Notifications

### Test 1: Request Accept/Reject
```bash
# Make a donation request
# Accept/Reject it
# Check sender's email inbox
```

### Test 2: Booking Confirmation (To Implement)
```bash
# Book a slot
# Check both donor and user email inboxes
```

### Test 3: Reschedule (To Implement)
```bash
# Login as blood bank
# Reschedule a booking
# Check donor's email inbox
```

### Test 4: Taxi Booking (To Implement)
```bash
# Book a taxi (with payment)
# Check donor's email inbox
```

---

## 🐛 Troubleshooting

### Email Not Sending
1. **Check Gmail credentials** in `.env` file
2. **Verify app-specific password** is correct (not regular password)
3. **Check console logs** for error messages
4. **Ensure nodemailer is installed**: `npm install nodemailer`

### Gmail Blocking Emails
1. Enable **Less secure app access** (if not using 2FA)
2. Use **App-specific password** with 2FA (recommended)
3. Check **Gmail's sent folder** to verify emails are being sent

### Recipients Not Receiving Emails
1. **Check spam/junk folder**
2. **Verify recipient email addresses** are correct in database
3. **Check email logs** in server console

---

## 📦 Dependencies

```json
{
  "nodemailer": "^6.9.0"
}
```

Install if not already installed:
```bash
cd backend
npm install nodemailer
```

---

## 🎉 Benefits of Email Notifications

1. **Improved User Experience** - Real-time updates keep users informed
2. **Increased Transparency** - Clear communication reduces confusion
3. **Better Coordination** - Donors and users stay synchronized
4. **Professional Service** - Automated notifications add credibility
5. **Reduced No-shows** - Reminders help ensure appointments are kept

---

## 📝 Next Steps

1. ✅ Review current implementation (Request Accept/Reject)
2. ⚠️ Implement booking confirmation emails
3. ⚠️ Implement reschedule notification emails
4. ⚠️ Implement taxi booking confirmation emails
5. 🆕 Add driver assignment notifications
6. 🧪 Test all email flows end-to-end
7. 📊 Monitor email delivery rates
8. 🔔 Consider adding SMS notifications (future enhancement)

---

## 🔒 Security Best Practices

1. **Never commit** `.env` file to version control
2. **Use app-specific passwords** instead of regular Gmail password
3. **Implement rate limiting** to prevent email spam
4. **Validate email addresses** before sending
5. **Log email attempts** for debugging
6. **Handle failures gracefully** - don't crash the app if email fails

---

## 📧 Email Template Best Practices

1. **Clear subject lines** - Users should know what the email is about
2. **Personalization** - Use recipient's name
3. **Concise content** - Get to the point quickly
4. **Important details first** - Date, time, location
5. **Call to action** - What should they do next?
6. **Contact information** - How to get help
7. **Branding** - Add app logo/name (optional HTML emails)

---

**Created By:** Blood Donation Team  
**Date:** October 2025  
**Version:** 1.0

