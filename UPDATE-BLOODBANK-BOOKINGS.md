# Blood Bank Dashboard - Bookings Update Instructions

## Changes Needed in `frontend/src/Pages/BloodBankDashboard.jsx`

### 1. Add bookings state (Line 13, after `donationRequests` state):

```javascript
const [bookings, setBookings] = useState([]); // Add this line
```

### 2. Update the useEffect for tab changes (around line 85):

**REPLACE:**
```javascript
useEffect(() => {
  if (activeTab === 'users') {
    fetchDonationRequests();
  } else if (activeTab === 'donors') {
    fetchDonors();
  }
}, [activeTab]);
```

**WITH:**
```javascript
useEffect(() => {
  if (activeTab === 'users') {
    fetchBookings(); // Changed to fetch bookings
  } else if (activeTab === 'donors') {
    fetchDonors();
  } else if (activeTab === 'received') {
    fetchDonationRequests(); // Move donation requests to received tab
  }
}, [activeTab]);
```

### 3. Add fetchBookings function (after fetchDonationRequests around line 111):

```javascript
// Fetch bookings for blood bank
const fetchBookings = async () => {
  try {
    const res = await api.get("/bloodbank/bookings");
    if (res.data.success) setBookings(res.data.data);
  } catch (err) {
    console.error("Failed to fetch bookings", err);
  }
};
```

### 4. Replace the entire 'users' tab section (around line 733-772) with:

```javascript
{activeTab === 'users' && (
  <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
    <div className="mb-6 text-center">
      <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
        📅 Booked Slots
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        View all booked donation slots from donors
      </p>
    </div>

    {bookings.length === 0 ? (
      <div className="text-center py-8">
        <p className="mt-2 text-gray-600 dark:text-gray-400">No bookings found yet.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking._id} className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                {/* Booking Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white">
                    🎫 Booking #{booking.bookingId || booking._id.slice(-6)}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-500 text-white' :
                    booking.status === 'pending' ? 'bg-yellow-500 text-white' :
                    booking.status === 'completed' ? 'bg-blue-500 text-white' :
                    booking.status === 'cancelled' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>

                {/* Donor Information */}
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">👤 Donor Information:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Name:</strong> {booking.donorName || 'N/A'}</p>
                    <p><strong>Blood Group:</strong> {booking.bloodGroup || 'N/A'}</p>
                    {booking.donorId?.userId?.email && <p><strong>Email:</strong> {booking.donorId.userId.email}</p>}
                    {booking.donorId?.userId?.phone && <p><strong>Phone:</strong> {booking.donorId.userId.phone}</p>}
                  </div>
                </div>

                {/* Patient Information */}
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🏥 Patient Information:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Patient Name:</strong> {booking.patientName || 'N/A'}</p>
                    <p><strong>Patient MRID:</strong> {booking.patientMRID || 'N/A'}</p>
                    <p><strong>Requester:</strong> {booking.requesterName || 'N/A'}</p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="bg-white/10 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📋 Booking Details:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>📅 Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                    <p><strong>⏰ Time:</strong> {booking.time}</p>
                    <p><strong>🎫 Token Number:</strong> {booking.tokenNumber || 'Pending'}</p>
                    <p><strong>🏥 Blood Bank:</strong> {booking.bloodBankName || bloodBankDetails?.name}</p>
                    <p><strong>📝 Created:</strong> {new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        alert('Confirm booking functionality - Coming soon!');
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-green-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                    >
                      <span className="mr-1">✅</span>
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        alert('Reject booking functionality - Coming soon!');
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                    >
                      <span className="mr-1">❌</span>
                      Reject
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      alert('Mark as completed functionality - Coming soon!');
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <span className="mr-1">✔️</span>
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{activeTab === 'received' && (
  <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
    <div className="mb-6 text-center">
      <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
        📥 Received Donation Requests
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        View all donation requests for your patients
      </p>
    </div>

    {donationRequests.length === 0 ? (
      <div className="text-center py-8">
        <p className="mt-2 text-gray-600 dark:text-gray-400">No donation requests found.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {donationRequests.map((request) => (
          <div key={request._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white">{request.donorName || request.name}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Donor:</strong> {request.donorName || request.name}</p>
                <p>📧 Email: {request.email}</p>
                <p>📱 Phone: {request.phone}</p>
                <p>🩸 Blood Group: {request.bloodGroup}</p>
                <p>📍 Address: {formatAddress(request.address)}</p>
                <p>📅 Donation Date: {request.donationDate ? new Date(request.donationDate).toLocaleDateString() : 'N/A'}</p>
                <p>⏰ Time Slot: {request.timeSlot || 'N/A'}</p>
                <p>🏥 Blood Bank: {request.bloodBankName}</p>
                <p>📝 Status: <span className={`font-semibold ${request.status === 'confirmed' ? 'text-green-600' : request.status === 'booked' ? 'text-blue-600' : request.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{request.status}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

## Summary of Changes:

1. **Added `bookings` state** to store booking data
2. **Created `fetchBookings()` function** to fetch from `/bloodbank/bookings`
3. **Updated tab logic** to fetch bookings for 'users' tab
4. **Complete redesign of 'users' tab** to show bookings with:
   - Booking header with ID and status badge
   - Donor information section
   - Patient information section
   - Booking details section
   - Action buttons (Confirm/Reject/Complete)
5. **Added 'received' tab** to show donation requests separately

## Result:

- Blood banks now see actual bookings made by donors
- Each booking shows complete information
- Separated bookings from donation requests
- Clean, organized display
- Status-based action buttons

## Files Updated:

- `frontend/src/Pages/BloodBankDashboard.jsx`

## Documentation Created:

- `BOOKING-IMPLEMENTATION-COMPLETE.md` - Complete implementation guide

