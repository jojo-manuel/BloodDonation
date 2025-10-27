# Taxi Booking Cancellation Feature

## Overview
Added the ability to cancel taxi bookings after they have been successfully booked. Once a taxi is booked, the "Book Taxi" button changes to "Cancel Taxi" button, allowing users to cancel their booking if needed.

## Feature Request
User requested: "once taxi is booked change option to cancel taxi"

## Implementation Summary

### Backend Changes

#### 1. New API Endpoint: Check Taxi Booking Status
**File:** `backend/controllers/taxiController.js`

Added `checkTaxiBooking` function to check if a taxi booking exists for a donation request:

```javascript
/**
 * Check if taxi booking exists for a donation request
 * GET /api/taxi/check/:donationRequestId
 */
exports.checkTaxiBooking = asyncHandler(async (req, res) => {
  const { donationRequestId } = req.params;
  
  const booking = await TaxiBooking.findOne({
    donationRequestId,
    status: { $nin: ['cancelled'] } // Exclude cancelled bookings
  }).sort({ createdAt: -1 }); // Get the most recent booking
  
  if (booking) {
    res.json({
      success: true,
      hasBooking: true,
      data: {
        bookingId: booking._id,
        status: booking.status,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        totalFare: booking.totalFare,
        paymentStatus: booking.paymentStatus
      }
    });
  } else {
    res.json({
      success: true,
      hasBooking: false,
      data: null
    });
  }
});
```

#### 2. New Route
**File:** `backend/Route/taxiRoutes.js`

Added route for checking taxi booking status:

```javascript
// Check if taxi booking exists for a donation request
router.get('/check/:donationRequestId', taxiController.checkTaxiBooking);
```

**Note:** The cancel endpoint already existed at `/api/taxi/:bookingId/cancel`

### Frontend Changes

#### 1. State Management
**File:** `frontend/src/Pages/UserDashboard.jsx`

Added new state to track taxi bookings:

```javascript
const [taxiBookings, setTaxiBookings] = useState({}); // Map of requestId -> taxi booking data
```

#### 2. Functions to Check and Cancel Taxi Bookings

**Check Taxi Bookings Function:**
```javascript
// Check taxi booking status for multiple requests
const checkTaxiBookings = async (requests) => {
  const bookingsMap = {};
  
  for (const request of requests) {
    if (request.status === 'booked' || request.status === 'accepted') {
      try {
        const res = await api.get(`/taxi/check/${request._id}`);
        if (res.data.success && res.data.hasBooking) {
          bookingsMap[request._id] = res.data.data;
        }
      } catch (err) {
        console.error(`Failed to check taxi for request ${request._id}:`, err);
      }
    }
  }
  
  setTaxiBookings(bookingsMap);
};
```

**Cancel Taxi Booking Function:**
```javascript
// Cancel taxi booking
const handleCancelTaxi = async (bookingId, requestId) => {
  if (!window.confirm('Are you sure you want to cancel this taxi booking?')) {
    return;
  }

  try {
    const res = await api.put(`/taxi/${bookingId}/cancel`, {
      cancellationReason: 'Cancelled by user'
    });

    if (res.data.success) {
      alert('✅ Taxi booking cancelled successfully!');
      
      // Remove from taxi bookings map
      setTaxiBookings(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
      
      // Refresh requests
      fetchRequests();
      fetchReceivedRequests();
    }
  } catch (err) {
    console.error('Cancel taxi error:', err);
    alert('Failed to cancel taxi booking: ' + (err.response?.data?.message || 'Unknown error'));
  }
};
```

#### 3. useEffect Hooks

Added hooks to check taxi bookings when requests are loaded:

```javascript
// Check taxi bookings when sent requests are loaded
useEffect(() => {
  if (sentRequests.length > 0) {
    checkTaxiBookings(sentRequests);
  }
}, [sentRequests]);

// Check taxi bookings when received requests are loaded
useEffect(() => {
  if (receivedRequests.length > 0) {
    checkTaxiBookings(receivedRequests);
  }
}, [receivedRequests]);
```

#### 4. UI Updates

**Sent Requests - Accepted Status:**
```jsx
{request.status === 'accepted' && (
  <div className="flex flex-col gap-1">
    {taxiBookings[request._id] ? (
      <button onClick={() => handleCancelTaxi(taxiBookings[request._id].bookingId, request._id)}>
        🚫 Cancel Taxi
      </button>
    ) : (
      <button onClick={() => setTaxiBookingModal(request)}>
        🚖 Book Taxi
      </button>
    )}
    <button onClick={() => handleCancelRequest(request._id)}>
      🚫 Cancel Request
    </button>
  </div>
)}
```

**Sent Requests & Received Requests - Booked Status:**
```jsx
{request.status === 'booked' && (
  <div className="flex flex-col gap-1">
    <button onClick={() => setSelectedRequest(request)}>
      📋 View Details
    </button>
    {taxiBookings[request._id] ? (
      <button onClick={() => handleCancelTaxi(taxiBookings[request._id].bookingId, request._id)}>
        🚫 Cancel Taxi
      </button>
    ) : (
      <button onClick={() => setTaxiBookingModal(request)}>
        🚖 Book Taxi
      </button>
    )}
  </div>
)}
```

## User Experience Flow

### Before This Feature
1. User books taxi ✅
2. "Book Taxi" button remains visible
3. User could accidentally book multiple taxis
4. No way to cancel from the interface

### After This Feature
1. User books taxi ✅
2. **"Book Taxi" changes to "Cancel Taxi"** ✅
3. User sees confirmation dialog before canceling
4. Taxi booking is cancelled in database ✅
5. Button changes back to "Book Taxi" ✅
6. Requests lists refresh automatically ✅

## Button Visual Design

### Book Taxi Button
- Gradient: `from-yellow-500 to-orange-500`
- Hover: `from-yellow-600 to-orange-600`
- Icon: 🚖
- Text: "Book Taxi"

### Cancel Taxi Button
- Gradient: `from-orange-600 to-red-600`
- Hover: `from-orange-700 to-red-700`
- Icon: 🚫
- Text: "Cancel Taxi"

## Request Status Workflows

### Sent Requests

#### Pending Status
```
🚫 Cancel (request)
```

#### Accepted Status
```
🚖 Book Taxi  (or)  🚫 Cancel Taxi
🚫 Cancel Request
```

#### Booked Status
```
📋 View Details
🚖 Book Taxi  (or)  🚫 Cancel Taxi
```

### Received Requests

#### Pending Status
```
✓ Accept  |  ✗ Reject
```

#### Accepted Status
```
📅 Book Slot
```

#### Booked Status
```
📋 View Details
🚖 Book Taxi  (or)  🚫 Cancel Taxi
```

## Technical Details

### API Endpoints Used

1. **Check Taxi Booking:**
   - `GET /api/taxi/check/:donationRequestId`
   - Returns booking details if exists

2. **Cancel Taxi Booking:**
   - `PUT /api/taxi/:bookingId/cancel`
   - Body: `{ cancellationReason: string }`
   - Marks booking as cancelled

### Data Flow

1. **Page Load:**
   - Fetch sent requests
   - Fetch received requests
   - For each request with status 'booked' or 'accepted':
     - Check if taxi booking exists
     - Store in `taxiBookings` state map

2. **Booking Check:**
   - Query TaxiBooking collection by `donationRequestId`
   - Exclude cancelled bookings
   - Return most recent booking

3. **Cancel Action:**
   - User clicks "Cancel Taxi"
   - Confirmation dialog appears
   - If confirmed:
     - Call cancel API
     - Update booking status to 'cancelled'
     - Remove from local state
     - Refresh request lists

### Database Operations

**TaxiBooking Model:**
- Status field: `['pending', 'confirmed', 'assigned', 'in_transit', 'completed', 'cancelled']`
- When cancelled: status set to 'cancelled'
- Cancellation reason stored in `cancellationReason` field

## Error Handling

1. **Check Taxi Booking Fails:**
   - Silently fail for individual requests
   - Log error to console
   - Continue checking other requests

2. **Cancel Taxi Fails:**
   - Show error alert to user
   - Display error message from backend
   - Do not update local state
   - User can try again

3. **Network Errors:**
   - Handled by api interceptors
   - User shown appropriate error message

## Performance Considerations

1. **Batch Checking:**
   - Checks taxi bookings for all requests at once
   - Uses async iteration to avoid blocking UI

2. **Conditional Checking:**
   - Only checks requests with status 'booked' or 'accepted'
   - Reduces unnecessary API calls

3. **State Management:**
   - Uses object map for O(1) lookup
   - Efficient updates on cancel

4. **Polling:**
   - Requests refresh every 10 seconds
   - Taxi bookings automatically rechecked

## Testing Checklist

### Sent Requests
- [ ] Book taxi for accepted request
- [ ] Verify button changes to "Cancel Taxi"
- [ ] Click "Cancel Taxi"
- [ ] Confirm cancellation dialog
- [ ] Verify button changes back to "Book Taxi"
- [ ] Verify can book taxi again

### Received Requests
- [ ] Accept request as donor
- [ ] Book slot as blood bank
- [ ] Blood bank books taxi
- [ ] Verify "Cancel Taxi" shows for blood bank
- [ ] Cancel taxi successfully
- [ ] Verify button changes to "Book Taxi"

### Edge Cases
- [ ] Multiple taxis booked (should show most recent)
- [ ] Cancelled taxi doesn't show as booked
- [ ] Page refresh maintains correct button state
- [ ] Network error during cancel handled gracefully
- [ ] Confirmation dialog can be dismissed

## Files Modified

### Backend
1. `backend/controllers/taxiController.js` - Added `checkTaxiBooking` function
2. `backend/Route/taxiRoutes.js` - Added route for checking taxi booking

### Frontend
1. `frontend/src/Pages/UserDashboard.jsx`:
   - Added `taxiBookings` state
   - Added `checkTaxiBookings` function
   - Added `handleCancelTaxi` function
   - Added useEffect hooks for checking bookings
   - Updated UI to show conditional buttons

## Related Documentation
- `TAXI-BOOKING-RAZORPAY-COMPLETE.md` - Original taxi booking feature
- `SENT-REQUESTS-BOOK-TAXI-ENHANCEMENT.md` - Taxi option in sent requests
- `TAXI-BOOKING-CALLBACK-FIX.md` - Fixed fetchSent error

## Status
✅ **COMPLETED** - Taxi bookings can now be cancelled after booking

---

**Feature Added:** October 27, 2025  
**Requested By:** User  
**Implementation:** Full-stack taxi cancellation feature  
**Impact:** Users can now manage their taxi bookings with cancel option

