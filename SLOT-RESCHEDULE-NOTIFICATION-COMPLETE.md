# Slot Reschedule Notification System - Complete Implementation

## Overview
Implemented a comprehensive notification system that alerts donors when their blood donation slots are rescheduled. The system shows a popup modal on login and sends email notifications.

## Feature Request
User requested: "when the reschedule of slot occur i show a pop msg when user login and also send a mail"

## Implementation Summary

### 🎯 Key Features
1. **Popup Notification on Login** - Shows modal with reschedule details when user logs in
2. **Email Notification** - Sends detailed email about the reschedule
3. **Visual Comparison** - Shows old vs new slot in easy-to-understand format
4. **Acknowledge System** - Users must acknowledge the notification
5. **Persistent Storage** - Notifications stored in database until acknowledged

---

## Backend Implementation

### 1. Database Model
**File:** `backend/Models/Notification.js`

Created a comprehensive notification model:

```javascript
const NotificationSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  type: { enum: ['slot_reschedule', 'booking_confirmed', ...] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  bookingId: { type: ObjectId, ref: 'Booking' },
  donationRequestId: { type: ObjectId, ref: 'DonationRequest' },
  
  // Reschedule specific data
  rescheduleData: {
    oldDate: Date,
    oldTime: String,
    newDate: Date,
    newTime: String,
    reason: String,
    bloodBankName: String,
    patientName: String,
    bloodGroup: String
  },
  
  isRead: { type: Boolean, default: false },
  readAt: Date,
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date,
  priority: { enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }
});
```

**Features:**
- Indexed for fast queries
- Stores complete reschedule context
- Tracks email delivery status
- Priority levels for urgent notifications

### 2. Notification Controller
**File:** `backend/controllers/notificationController.js`

#### Key Functions:

**A. Create Reschedule Notification**
```javascript
POST /api/notifications/reschedule
Body: {
  bookingId: "abc123",
  newDate: "2025-11-01",
  newTime: "10:00 AM",
  reason: "Staff availability"
}
```

**What it does:**
1. Fetches booking details with donor information
2. Updates booking with new date/time
3. Creates notification in database
4. Sends email to donor
5. Marks email as sent

**B. Get Unread Notifications**
```javascript
GET /api/notifications/unread
```

Returns all unread notifications for logged-in user.

**C. Mark as Read**
```javascript
PUT /api/notifications/:notificationId/read
```

Marks notification as acknowledged.

**D. Other Endpoints:**
- `GET /api/notifications` - Get all notifications with pagination
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:notificationId` - Delete notification

### 3. Email Notification

**Email Template Includes:**
- ❌ **Previous slot** (crossed out, highlighted in red)
- ✅ **New slot** (highlighted in green)
- 📝 Reason for reschedule
- 🏥 Blood bank details
- 🩸 Blood group and patient info
- ⚠️ Important reminders

**Sample Email:**
```
Subject: ⚠️ Blood Donation Slot Rescheduled

Dear John Doe,

Your blood donation appointment has been RESCHEDULED.

📅 PREVIOUS SLOT:
   Date: Monday, October 28, 2025
   Time: 10:00 AM

📅 NEW SLOT:
   Date: Tuesday, October 29, 2025
   Time: 2:00 PM

🏥 Blood Bank: City Blood Bank
🩸 Blood Group: O+
👤 Patient: Jane Smith
📋 Booking ID: ABCD1234

📝 Reason: Staff availability

⚠️ IMPORTANT: Please arrive 15 minutes before your scheduled time.

Thank you for your cooperation.
```

### 4. Routes
**File:** `backend/Route/notificationRoutes.js`

```javascript
router.post('/reschedule', createRescheduleNotification);
router.get('/unread', getUnreadNotifications);
router.get('/', getAllNotifications);
router.put('/:notificationId/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);
```

### 5. App Integration
**File:** `backend/app.js`

Added notification routes:
```javascript
app.use('/api/notifications', require('./Route/notificationRoutes'));
```

---

## Frontend Implementation

### 1. Reschedule Notification Modal
**File:** `frontend/src/components/RescheduleNotificationModal.jsx`

**Visual Design:**
- 🎨 **Orange-Red gradient header** with animated warning icon
- 📊 **Side-by-side comparison** of old vs new slot
- ❌ **Red section** for cancelled slot
- ↓ **"RESCHEDULED TO" indicator** with arrow
- ✅ **Green section** for new confirmed slot
- 📝 **Reason display** in blue info box
- ⚠️ **Important reminders** in yellow warning box

**Features:**
- Responsive design
- Dark mode support
- Multiple notifications support
- Individual acknowledgment
- "Acknowledge All & Close" option
- "Remind Me Later" option

### 2. UserDashboard Integration
**File:** `frontend/src/Pages/UserDashboard.jsx`

**Added States:**
```javascript
const [rescheduleNotifications, setRescheduleNotifications] = useState([]);
const [showRescheduleModal, setShowRescheduleModal] = useState(false);
```

**Added Functions:**
```javascript
// Fetch unread reschedule notifications
const fetchRescheduleNotifications = async () => {
  const res = await api.get('/notifications/unread');
  const reschedules = res.data.data.filter(n => n.type === 'slot_reschedule');
  if (reschedules.length > 0) {
    setRescheduleNotifications(reschedules);
    setShowRescheduleModal(true);
  }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId) => {
  await api.put(`/notifications/${notificationId}/read`);
  setRescheduleNotifications(prev => prev.filter(n => n._id !== notificationId));
  if (rescheduleNotifications.length <= 1) {
    setShowRescheduleModal(false);
  }
};
```

**useEffect Hook:**
```javascript
useEffect(() => {
  fetchProfileData();
  fetchRescheduleNotifications(); // Check on login
}, []);
```

---

## User Experience Flow

### Flow Diagram

```
Blood Bank Reschedules Slot
          ↓
Backend creates notification
          ↓
Email sent to donor
          ↓
Donor logs in
          ↓
Check for unread notifications
          ↓
Reschedule modal pops up
          ↓
Donor reads and acknowledges
          ↓
Notification marked as read
          ↓
Modal closes
```

### Detailed User Journey

**Step 1: Blood Bank Reschedules**
```
Blood bank staff:
1. Opens booking management
2. Selects booking to reschedule
3. Chooses new date and time
4. Enters reason
5. Confirms reschedule
```

**Step 2: System Processes**
```
Backend:
1. Updates booking in database
2. Creates notification record
3. Sends email to donor
4. Marks email as sent
```

**Step 3: Donor Receives Email**
```
Donor receives:
1. Email with reschedule details
2. Clear comparison of old vs new
3. Reason for change
4. Important reminders
```

**Step 4: Donor Logs In**
```
On login:
1. Dashboard loads
2. Check for unread notifications
3. If reschedule found → show modal
4. Modal displays with all details
```

**Step 5: Donor Acknowledges**
```
Donor can:
1. Read reschedule details
2. Click "I Acknowledge - Close"
3. Or "Remind Me Later"
4. Notification marked as read
```

---

## Visual Design

### Modal Layout

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Slot Rescheduled                 [1 Update]  │ ← Orange-Red Header
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────┐  ┌─────────────┐               │
│ │ 🏥 City BB  │  │ 👤 Patient  │               │
│ └─────────────┘  └─────────────┘               │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ❌ Previous Slot (Cancelled)                │ │ ← Red Section
│ │ Date: Monday, Oct 28, 2025                  │ │
│ │ Time: 10:00 AM                              │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│     ↓ RESCHEDULED TO ↓                          │ ← Orange Indicator
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ✅ New Slot (Confirmed)                     │ │ ← Green Section
│ │ Date: Tuesday, Oct 29, 2025                 │ │
│ │ Time: 2:00 PM                               │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📝 Reason: Staff availability              │ │ ← Blue Info Box
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ⚠️ Important:                               │ │ ← Yellow Warning
│ │ • Arrive 15 minutes early                   │ │
│ │ • Bring ID and confirmation                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌───────────────────────────────────────────┐  │
│ │  ✓ I Acknowledge - Close                  │  │ ← Green Button
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## How to Use (Blood Bank Staff)

### Rescheduling a Slot

**Method 1: API Call**
```javascript
POST /api/notifications/reschedule

{
  "bookingId": "67abc123def456",
  "newDate": "2025-11-01",
  "newTime": "2:00 PM",
  "reason": "Doctor availability changed"
}
```

**Method 2: Frontend (to be added)**
```
1. Go to Booking Management
2. Find booking to reschedule
3. Click "Reschedule" button
4. Select new date and time
5. Enter reason
6. Click "Confirm Reschedule"
```

**What Happens:**
- ✅ Booking updated in database
- ✅ Notification created
- ✅ Email sent to donor
- ✅ Donor will see popup on next login

---

## Testing Guide

### Test Scenario 1: Single Reschedule

1. **Create a booking** with donor
2. **Reschedule the slot** via API:
   ```bash
   POST /api/notifications/reschedule
   {
     "bookingId": "<booking_id>",
     "newDate": "2025-11-05",
     "newTime": "3:00 PM",
     "reason": "Test reschedule"
   }
   ```
3. **Check email** - donor should receive email
4. **Login as donor** - popup should appear
5. **Acknowledge** - popup should close
6. **Login again** - no popup (already acknowledged)

### Test Scenario 2: Multiple Reschedules

1. **Reschedule 3 different bookings** for same donor
2. **Login as donor**
3. **Verify** modal shows all 3 reschedules
4. **Click "Acknowledge All & Close"**
5. **Verify** all marked as read

### Test Scenario 3: Remind Me Later

1. **Trigger reschedule**
2. **Login as donor**
3. **Click "Remind Me Later"**
4. **Verify** modal closes
5. **Refresh page**
6. **Verify** modal appears again (not marked as read)

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/reschedule` | Create reschedule notification |
| GET | `/api/notifications/unread` | Get unread notifications |
| GET | `/api/notifications` | Get all notifications (paginated) |
| PUT | `/api/notifications/:id/read` | Mark notification as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

---

## Database Schema

```javascript
Notification {
  _id: ObjectId,
  userId: ObjectId → User,
  type: 'slot_reschedule',
  title: '⚠️ Donation Slot Rescheduled',
  message: 'Your blood donation slot has been rescheduled...',
  bookingId: ObjectId → Booking,
  donationRequestId: ObjectId → DonationRequest,
  rescheduleData: {
    oldDate: Date,
    oldTime: String,
    newDate: Date,
    newTime: String,
    reason: String,
    bloodBankName: String,
    patientName: String,
    bloodGroup: String
  },
  isRead: Boolean,
  readAt: Date,
  emailSent: Boolean,
  emailSentAt: Date,
  priority: 'high',
  createdAt: Date,
  updatedAt: Date
}
```

---

## Files Created/Modified

### Backend
1. ✅ `backend/Models/Notification.js` - Created notification model
2. ✅ `backend/controllers/notificationController.js` - Created controller
3. ✅ `backend/Route/notificationRoutes.js` - Created routes
4. ✅ `backend/app.js` - Added notification routes

### Frontend
1. ✅ `frontend/src/components/RescheduleNotificationModal.jsx` - Created modal
2. ✅ `frontend/src/Pages/UserDashboard.jsx` - Integrated notifications

---

## Environment Variables Required

Make sure these are set in `.env`:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
```

---

## Future Enhancements

### Possible Additions:
1. **SMS Notifications** - Send SMS in addition to email
2. **Push Notifications** - Browser push notifications
3. **Notification Center** - Bell icon with notification count
4. **Notification History** - View all past notifications
5. **Batch Reschedule** - Reschedule multiple bookings at once
6. **Auto-confirm** - Option to auto-confirm reschedules
7. **Calendar Integration** - Add to Google Calendar
8. **Notification Preferences** - User can choose notification methods

---

## Troubleshooting

### Issue: Email not sending
**Solution:**
- Check Gmail credentials in `.env`
- Enable "Less secure app access" or use App Password
- Check internet connection
- View logs for email errors

### Issue: Modal not appearing
**Solution:**
- Check browser console for errors
- Verify backend is running
- Check `/api/notifications/unread` returns data
- Clear browser cache

### Issue: Notification shows multiple times
**Solution:**
- Verify `markAsRead` function is called
- Check notification `isRead` status in database
- Ensure notification is being removed from local state

---

## Status
✅ **COMPLETED** - Slot reschedule notification system with popup and email

---

**Feature Added:** October 27, 2025  
**Requested By:** User  
**Implementation:** Full-stack reschedule notification system  
**Impact:** Donors are immediately notified of slot changes via popup and email

