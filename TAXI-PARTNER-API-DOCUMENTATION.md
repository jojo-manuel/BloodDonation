# Taxi Partner API Documentation

## Overview
This API allows third-party taxi service providers to integrate with the Blood Donation Taxi Booking System. The API enables taxi partners to:
- Receive new booking requests in real-time
- Assign drivers to bookings
- Update booking status (in transit, completed, etc.)
- Track driver assignments

---

## Base URL
```
Production: https://your-domain.com/api/taxi/partner
Development: http://localhost:5000/api/taxi/partner
```

---

## Authentication
All API requests require authentication using a Bearer token. Include the token in the request header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Note:** Contact the Blood Donation Platform administrator to obtain your API access token.

---

## API Endpoints

### 1. Get Available Bookings

Retrieve all pending/confirmed bookings that are awaiting driver assignment.

**Endpoint:** `GET /available-bookings`

**Response:**
```json
{
  "success": true,
  "message": "Available bookings retrieved successfully",
  "data": [
    {
      "bookingId": "64abc123...",
      "pickupAddress": "123 Main St, Mumbai, Maharashtra, 400001",
      "pickupLocation": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "dropAddress": "Blood Bank Name, 456 Hospital Rd, Mumbai",
      "dropLocation": {
        "latitude": 19.1136,
        "longitude": 72.8697
      },
      "passengerName": "John Doe",
      "passengerPhone": "+919876543210",
      "scheduledDate": "2025-10-25",
      "scheduledTime": "14:30",
      "distanceKm": 12.5,
      "fare": 237,
      "status": "confirmed",
      "specialInstructions": "Please arrive 5 minutes early",
      "bloodBankName": "City Blood Bank",
      "bloodBankPhone": "+919123456789",
      "donationType": "Blood Donation",
      "priority": "high"
    }
  ],
  "count": 1
}
```

---

### 2. Get Booking Details

Retrieve detailed information about a specific booking.

**Endpoint:** `GET /booking/:bookingId`

**Parameters:**
- `bookingId` (path parameter) - The unique booking ID

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "64abc123...",
    "pickupAddress": "123 Main St, Mumbai",
    "pickupLocation": {
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "dropAddress": "City Blood Bank, 456 Hospital Rd",
    "dropLocation": {
      "latitude": 19.1136,
      "longitude": 72.8697
    },
    "passengerName": "John Doe",
    "passengerPhone": "+919876543210",
    "scheduledDate": "2025-10-25",
    "scheduledTime": "14:30",
    "distanceKm": 12.5,
    "fare": 237,
    "status": "confirmed",
    "paymentStatus": "paid",
    "specialInstructions": "Please arrive 5 minutes early",
    "taxiDetails": null,
    "bloodBankName": "City Blood Bank",
    "bloodBankPhone": "+919123456789",
    "donationType": "Blood Donation",
    "createdAt": "2025-10-24T10:30:00.000Z"
  }
}
```

---

### 3. Assign Driver to Booking

Assign a driver and vehicle to a confirmed booking.

**Endpoint:** `PUT /assign-driver/:bookingId`

**Parameters:**
- `bookingId` (path parameter) - The unique booking ID

**Request Body:**
```json
{
  "driverName": "Rajesh Kumar",
  "driverPhone": "+919988776655",
  "vehicleNumber": "MH-02-AB-1234",
  "vehicleType": "Sedan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver assigned successfully",
  "data": {
    "bookingId": "64abc123...",
    "status": "assigned",
    "taxiDetails": {
      "driverName": "Rajesh Kumar",
      "driverPhone": "+919988776655",
      "vehicleNumber": "MH-02-AB-1234",
      "vehicleType": "Sedan"
    }
  }
}
```

---

### 4. Update Booking Status

Update the status of a booking as it progresses through different stages.

**Endpoint:** `PUT /update-status/:bookingId`

**Parameters:**
- `bookingId` (path parameter) - The unique booking ID

**Request Body:**
```json
{
  "status": "in_transit",
  "notes": "Driver en route to pickup location"
}
```

**Valid Status Values:**
- `assigned` - Driver assigned to booking
- `in_transit` - Driver picked up passenger and heading to destination
- `completed` - Trip completed successfully
- `cancelled` - Booking cancelled

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "bookingId": "64abc123...",
    "status": "in_transit",
    "updatedAt": "2025-10-25T14:35:00.000Z"
  }
}
```

---

### 5. Get Driver's Active Bookings

Retrieve all active bookings assigned to a specific driver.

**Endpoint:** `GET /driver-bookings`

**Query Parameters:**
- `driverPhone` (required) - The driver's phone number

**Example Request:**
```
GET /driver-bookings?driverPhone=%2B919988776655
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "64abc123...",
      "pickupAddress": "123 Main St, Mumbai",
      "pickupLocation": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "dropAddress": "City Blood Bank, 456 Hospital Rd",
      "dropLocation": {
        "latitude": 19.1136,
        "longitude": 72.8697
      },
      "passengerName": "John Doe",
      "passengerPhone": "+919876543210",
      "scheduledDate": "2025-10-25",
      "scheduledTime": "14:30",
      "distanceKm": 12.5,
      "fare": 237,
      "status": "assigned",
      "specialInstructions": "Please arrive 5 minutes early"
    }
  ],
  "count": 1
}
```

---

## Booking Status Flow

```
pending → confirmed → assigned → in_transit → completed
                  ↓
               cancelled
```

1. **pending** - Booking created, awaiting payment confirmation
2. **confirmed** - Payment successful, awaiting driver assignment
3. **assigned** - Driver assigned to booking
4. **in_transit** - Driver picked up passenger
5. **completed** - Trip completed successfully
6. **cancelled** - Booking cancelled (can occur at any stage)

---

## Smart Pickup Time Calculation

The system automatically calculates the optimal pickup time based on:
- **Donation appointment time** from the blood bank
- **Distance** between donor location and blood bank
- **Average speed** of 50 km/h
- **Buffer time** of 15 minutes for early arrival

**Formula:**
```
Pickup Time = Donation Time - (Travel Time + 15 minutes buffer)
Travel Time = (Distance in KM / 50 km/h) * 60 minutes
```

**Example:**
- Donation appointment: 3:00 PM
- Distance: 25 km
- Travel time: (25 / 50) * 60 = 30 minutes
- Suggested pickup time: 3:00 PM - 30 min - 15 min = **2:15 PM**

---

## Error Handling

All endpoints return appropriate HTTP status codes:

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully

### Error Codes
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description here",
  "error": "Detailed error message (in development mode only)"
}
```

---

## Rate Limiting

To ensure fair usage and system stability:
- **Rate limit:** 100 requests per minute per API key
- **Burst limit:** 200 requests per minute (short bursts allowed)

If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

---

## Webhooks (Coming Soon)

Real-time notifications for taxi partners when:
- New booking is created
- Booking is cancelled by customer
- Payment is confirmed

---

## Testing

### Test Mode
Use the development base URL for testing:
```
http://localhost:5000/api/taxi/partner
```

### Sample Test Credentials
Contact the administrator for test API credentials.

---

## Integration Examples

### Example 1: Fetch Available Bookings (Node.js)

```javascript
const axios = require('axios');

async function getAvailableBookings() {
  try {
    const response = await axios.get(
      'http://localhost:5000/api/taxi/partner/available-bookings',
      {
        headers: {
          'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        }
      }
    );
    
    console.log('Available bookings:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getAvailableBookings();
```

### Example 2: Assign Driver (Python)

```python
import requests

def assign_driver(booking_id, driver_info):
    url = f"http://localhost:5000/api/taxi/partner/assign-driver/{booking_id}"
    
    headers = {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json"
    }
    
    payload = {
        "driverName": driver_info["name"],
        "driverPhone": driver_info["phone"],
        "vehicleNumber": driver_info["vehicle"],
        "vehicleType": driver_info["type"]
    }
    
    response = requests.put(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        print("Driver assigned successfully!")
        return response.json()
    else:
        print("Error:", response.json())
        return None

# Usage
driver = {
    "name": "Rajesh Kumar",
    "phone": "+919988776655",
    "vehicle": "MH-02-AB-1234",
    "type": "Sedan"
}

assign_driver("64abc123...", driver)
```

### Example 3: Update Status (cURL)

```bash
curl -X PUT \
  http://localhost:5000/api/taxi/partner/update-status/64abc123... \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "in_transit",
    "notes": "Driver en route to destination"
  }'
```

---

## Support

For technical support and API access:
- **Email:** support@blooddonationplatform.com
- **Phone:** +91-1234567890
- **Documentation:** https://docs.blooddonationplatform.com

---

## Changelog

### Version 1.0 (October 2025)
- Initial release
- Basic booking management
- Driver assignment
- Status updates
- Smart pickup time calculation at 50 km/h average speed

---

## Best Practices

1. **Poll for new bookings** every 30-60 seconds
2. **Update status promptly** when driver accepts, picks up, or completes trip
3. **Store booking IDs** locally for reference
4. **Handle errors gracefully** and retry failed requests
5. **Validate data** before sending to the API
6. **Use HTTPS** in production for secure communication
7. **Keep API tokens secure** - never expose in client-side code
8. **Respect rate limits** to avoid service interruption

---

## License
This API is proprietary to the Blood Donation Platform. Unauthorized use is prohibited.

---

**Last Updated:** October 24, 2025

