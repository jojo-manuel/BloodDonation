# 🏥 Blood Bank Request & Booking Workflow - Complete ✅

## Overview

Fixed the blood bank dashboard to properly display **Received Requests** and **Booked Slots** in separate tabs with clear workflow stages.

---

## 🔄 Complete Workflow

### **Stage 1: Donation Request Sent** 📤

**Who:** User/Patient sends request to donor  
**Action:** User selects patient, blood bank, and donor → Sends donation request

**API Call:**
```http
POST /api/donation-request/donor/:donorId
Body: {
  "bloodGroup": "A+",
  "patientId": "patient_id",
  "issuedAt": "2025-10-27"
}
```

**Result:** DonationRequest created with `status: 'pending'`

---

### **Stage 2: Donor Books a Slot** 📅

**Who:** Donor receives request and books a slot  
**Action:** Donor selects date/time → Sends booking request

**API Call:**
```http
POST /api/users/direct-book-slot
Body: {
  "donorId": "donor_id",
  "bloodBankId": "bloodbank_id",
  "requestedDate": "2025-10-27",
  "requestedTime": "14:30",
  "donationRequestId": "request_id",
  "patientName": "John Doe",
  "donorName": "Jane Smith",
  "requesterName": "Dr. Kumar"
}
```

**Result:** 
- Booking created with `status: 'pending'`
- DonationRequest updated to `status: 'booked'`
- **Shows in Blood Bank "Received Requests" tab** 🆕

---

### **Stage 3: Blood Bank Reviews Request** 🔍

**Who:** Blood Bank Staff  
**Where:** Blood Bank Dashboard → **"Received Requests" Tab**

**What They See:**
```
┌─────────────────────────────────────────────────┐
│ Received Requests (Pending Booking Confirmation)│
├─────────────────────────────────────────────────┤
│ 1. Donor: Jane Smith                            │
│    Blood Group: A+                              │
│    Patient: John Doe                            │
│    Date: Oct 27, 2025                           │
│    Time: 14:30                                  │
│    Status: pending ⏳                           │
│    [Confirm] [Reject] [Reschedule]              │
└─────────────────────────────────────────────────┘
```

**API Call to Fetch:**
```http
GET /api/bloodbank/donation-requests
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "request_id",
      "donorName": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "bloodGroup": "A+",
      "donationDate": "2025-10-27",
      "timeSlot": "14:30",
      "bloodBankName": "City Blood Bank",
      "status": "pending",
      "patientName": "John Doe"
    }
  ]
}
```

---

### **Stage 4: Blood Bank Confirms Booking** ✅

**Who:** Blood Bank Staff  
**Action:** Clicks "Confirm" button

**API Call:**
```http
POST /api/bloodbank/bookings/confirm
Body: {
  "donationRequestId": "request_id"
}
```

**Backend Logic:**
1. Validates capacity:
   - Max 5 bookings per time slot
   - Max 50 bookings per day
2. Generates token number
3. Updates Booking `status: 'confirmed'`
4. Updates DonationRequest `status: 'booked'`
5. **Moves to "Booked Slots" tab** 🆕

---

### **Stage 5: Confirmed Bookings** 📋

**Who:** Blood Bank Staff  
**Where:** Blood Bank Dashboard → **"Booked Slots" Tab**

**What They See:**
```
┌─────────────────────────────────────────────────┐
│ Booked Slots (Confirmed Donations)              │
├─────────────────────────────────────────────────┤
│ 1. Token: #25                                   │
│    Donor: Jane Smith                            │
│    Blood Group: A+                              │
│    Patient: John Doe                            │
│    Date: Oct 27, 2025                           │
│    Time: 14:30                                  │
│    Status: confirmed ✅                         │
│    [Mark Arrived] [Complete] [Reject]           │
└─────────────────────────────────────────────────┘
```

**API Call to Fetch:**
```http
GET /api/bloodbank/bookings
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking_id",
      "tokenNumber": "25",
      "donorName": "Jane Smith",
      "bloodGroup": "A+",
      "patientName": "John Doe",
      "patientMRID": "MR12345",
      "bloodBankName": "City Blood Bank",
      "date": "2025-10-27",
      "time": "14:30",
      "status": "confirmed",
      "arrived": false
    }
  ]
}
```

---

## 📊 Tab Separation Summary

### **"Received Requests" Tab**
**Purpose:** Shows pending booking requests that need blood bank confirmation  
**Status:** `pending` or `pending_booking`  
**Actions:**
- ✅ Confirm (creates booking)
- ❌ Reject
- 🔄 Reschedule

**API Endpoint:**
```http
GET /api/bloodbank/donation-requests
```

---

### **"Booked Slots" Tab**
**Purpose:** Shows confirmed bookings with assigned token numbers  
**Status:** `confirmed`, `completed`, `rejected`  
**Actions:**
- 👤 Mark Arrived
- ✅ Mark Complete
- ❌ Reject
- 📅 Reschedule

**API Endpoint:**
```http
GET /api/bloodbank/bookings
```

---

## 🔧 API Endpoints Added/Fixed

### 1. **Get Donation Requests** (FIXED - Route was missing!)
```http
GET /api/bloodbank/donation-requests
Authorization: Bearer <token>
```

**Response:**
- Lists all donation requests for patients in this blood bank
- Shows pending booking requests
- Includes donor and patient details

---

### 2. **Confirm Booking** (FIXED - Route was missing!)
```http
POST /api/bloodbank/bookings/confirm
Authorization: Bearer <token>
Body: {
  "donationRequestId": "request_id"
}
```

**Response:**
- Creates confirmed Booking record
- Generates token number
- Updates donation request status
- Validates capacity limits

---

### 3. **Get Bookings** (Already existed)
```http
GET /api/bloodbank/bookings
Authorization: Bearer <token>
```

**Response:**
- Lists all bookings for this blood bank
- Shows confirmed, completed, and rejected bookings
- Includes token numbers

---

### 4. **Update Booking Status** (Already existed)
```http
PUT /api/bloodbank/bookings/:bookingId/status
Body: {
  "status": "confirmed" | "rejected" | "completed",
  "arrived": true,
  "arrivalTime": "2025-10-27T10:30:00Z",
  "completedAt": "2025-10-27T11:00:00Z",
  "rejectionReason": "Donor did not show up"
}
```

---

### 5. **Reschedule Booking** (Already existed)
```http
PUT /api/bloodbank/bookings/:bookingId/reschedule
Body: {
  "newDate": "2025-10-28",
  "newTime": "10:00 AM"
}
```

---

## 🎯 Frontend Integration

### Blood Bank Dashboard Component

```jsx
export default function BloodBankDashboard() {
  const [activeTab, setActiveTab] = useState('received'); // or 'booked'
  const [donationRequests, setDonationRequests] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Fetch received requests (pending confirmation)
  const fetchDonationRequests = async () => {
    const res = await api.get('/bloodbank/donation-requests');
    if (res.data.success) {
      setDonationRequests(res.data.data);
    }
  };

  // Fetch confirmed bookings
  const fetchBookings = async () => {
    const res = await api.get('/bloodbank/bookings');
    if (res.data.success) {
      setBookings(res.data.data);
    }
  };

  // Confirm a donation request
  const handleConfirm = async (donationRequestId) => {
    await api.post('/bloodbank/bookings/confirm', { donationRequestId });
    alert('Booking confirmed!');
    fetchDonationRequests(); // Refresh received requests
    fetchBookings(); // Refresh booked slots
  };

  useEffect(() => {
    if (activeTab === 'received') {
      fetchDonationRequests();
    } else if (activeTab === 'booked') {
      fetchBookings();
    }
  }, [activeTab]);

  return (
    <div>
      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab('received')}>
          Received Requests
        </button>
        <button onClick={() => setActiveTab('booked')}>
          Booked Slots
        </button>
      </div>

      {/* Content */}
      {activeTab === 'received' && (
        <div>
          <h2>Pending Booking Requests</h2>
          {donationRequests.map(req => (
            <div key={req._id}>
              <p>Donor: {req.donorName}</p>
              <p>Blood: {req.bloodGroup}</p>
              <p>Date: {req.donationDate}</p>
              <p>Time: {req.timeSlot}</p>
              <button onClick={() => handleConfirm(req._id)}>
                Confirm
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'booked' && (
        <div>
          <h2>Confirmed Bookings</h2>
          {bookings.map(booking => (
            <div key={booking._id}>
              <p>Token: #{booking.tokenNumber}</p>
              <p>Donor: {booking.donorName}</p>
              <p>Blood: {booking.bloodGroup}</p>
              <p>Date: {new Date(booking.date).toLocaleDateString()}</p>
              <p>Time: {booking.time}</p>
              <p>Status: {booking.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📈 Status Flow Diagram

```
Donation Request Creation
         ↓
    status: 'pending'
         ↓
  Donor Books Slot
         ↓
  status: 'booked' + Booking created (status: 'pending')
         ↓
    Shows in "Received Requests" tab
         ↓
  Blood Bank Clicks "Confirm"
         ↓
  Booking status: 'confirmed' + Token assigned
         ↓
    Shows in "Booked Slots" tab
         ↓
  Donor Arrives → Mark Arrived
         ↓
  Donation Complete → Mark Complete
         ↓
  Booking status: 'completed'
```

---

## ✅ What Was Fixed

1. **Missing Route:** `GET /api/bloodbank/donation-requests` - Added ✅
2. **Missing Route:** `POST /api/bloodbank/bookings/confirm` - Added ✅
3. **Tab Separation:** Clear distinction between pending and confirmed ✅
4. **Workflow Clarity:** Documented complete booking flow ✅

---

## 🎯 Key Differences Between Tabs

| Feature | Received Requests | Booked Slots |
|---------|------------------|--------------|
| **Purpose** | Pending confirmation | Confirmed bookings |
| **Status** | `pending`, `pending_booking` | `confirmed`, `completed`, `rejected` |
| **Has Token** | ❌ No | ✅ Yes |
| **Actions** | Confirm, Reject, Reschedule | Mark Arrived, Complete, Reject |
| **API** | `/donation-requests` | `/bookings` |
| **Next Step** | Blood bank confirms | Donor arrives |

---

## 🚀 Backend Status

✅ **Server running on port 5000**  
✅ **New routes registered**  
✅ **Endpoints working**  
✅ **Workflow complete**

---

## 🧪 Test the Workflow

### 1. Send Donation Request (as User)
```bash
POST http://localhost:5000/api/donation-request/donor/:donorId
{
  "bloodGroup": "A+",
  "patientId": "patient_id"
}
```

### 2. Book Slot (as Donor)
```bash
POST http://localhost:5000/api/users/direct-book-slot
{
  "donorId": "donor_id",
  "bloodBankId": "bloodbank_id",
  "requestedDate": "2025-10-27",
  "requestedTime": "14:30",
  "donationRequestId": "request_id"
}
```

### 3. View Received Requests (as Blood Bank)
```bash
GET http://localhost:5000/api/bloodbank/donation-requests
Authorization: Bearer <bloodbank_token>
```

### 4. Confirm Booking (as Blood Bank)
```bash
POST http://localhost:5000/api/bloodbank/bookings/confirm
Authorization: Bearer <bloodbank_token>
{
  "donationRequestId": "request_id"
}
```

### 5. View Booked Slots (as Blood Bank)
```bash
GET http://localhost:5000/api/bloodbank/bookings
Authorization: Bearer <bloodbank_token>
```

---

## 📝 Summary

The workflow is now crystal clear:

1. **User sends request** → DonationRequest created
2. **Donor books slot** → Booking created (pending) → Shows in "Received Requests"
3. **Blood bank confirms** → Booking confirmed (token assigned) → Shows in "Booked Slots"
4. **Donor arrives** → Mark arrived → Mark complete

**All routes are working!** The frontend can now properly display received requests and confirmed bookings in separate tabs. ✅

---

**Last Updated:** October 23, 2025  
**Status:** ✅ Complete and Fully Functional

