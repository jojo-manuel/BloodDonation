# Blood Bank Management System - API Documentation

## Base URL
```
http://localhost:3000/api
```

All requests go through the API Gateway on port 3000.

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@hospital.com",
  "password": "password123",
  "name": "John Doe",
  "role": "DONOR | DOCTOR | BLOODBANK_ADMIN",
  "hospital_id": "hospital1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@hospital.com",
  "password": "password123"
}
```

## Donor Management (Admin Only)

### Create Donor
```http
POST /api/donors
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Donor",
  "blood_group": "O+",
  "contact": "+1234567890",
  "email": "jane@email.com",
  "age": 25,
  "weight": 60,
  "hospital_id": "hospital1"
}
```

### List Donors
```http
GET /api/donors?blood_group=O+&eligible=true&page=1&limit=20
Authorization: Bearer <token>
```

### Get Donor by ID
```http
GET /api/donors/:id
Authorization: Bearer <token>
```

### Update Donor
```http
PUT /api/donors/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "last_donation_date": "2024-01-15"
}
```

### Check Eligibility
```http
GET /api/donors/:id/eligibility
Authorization: Bearer <token>
```

## Inventory Management (Admin: Full, Doctor: Read)

### Add Blood Units
```http
POST /api/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "blood_group": "O+",
  "quantity": 5,
  "expiry_date": "2025-12-31",
  "unit_type": "Whole Blood",
  "hospital_id": "hospital1"
}
```

### List Inventory
```http
GET /api/inventory?blood_group=O+&status=available&page=1&limit=20
Authorization: Bearer <token>
```

### Check Availability
```http
GET /api/inventory/availability?blood_group=O+
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hospital_id": "hospital1",
    "availability": [
      {
        "_id": "O+",
        "total_quantity": 25,
        "units_count": 5,
        "earliest_expiry": "2025-06-15T00:00:00.000Z"
      }
    ]
  }
}
```

### Reserve Blood Unit
```http
PUT /api/inventory/:id/reserve
Authorization: Bearer <token>
```

### Get Expiring Units
```http
GET /api/inventory/expiring/soon?days=7
Authorization: Bearer <token>
```

## Blood Requests (All Roles)

### Create Request
```http
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "blood_group": "O+",
  "quantity": 2,
  "urgency": "high",
  "patient_name": "Emergency Patient",
  "reason": "Surgery",
  "hospital_id": "hospital1"
}
```

### List Requests
```http
GET /api/requests?status=pending&urgency=high&page=1&limit=20
Authorization: Bearer <token>
```

**Note:** Donors can only see their own requests.

### Get Request by ID
```http
GET /api/requests/:id
Authorization: Bearer <token>
```

### Approve Request (Admin Only)
```http
PUT /api/requests/:id/approve
Authorization: Bearer <token>
```

### Reject Request (Admin Only)
```http
PUT /api/requests/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Insufficient blood units"
}
```

### Fulfill Request (Admin Only)
```http
PUT /api/requests/:id/fulfill
Authorization: Bearer <token>
```

### Cancel Request
```http
DELETE /api/requests/:id
Authorization: Bearer <token>
```

## Notification Service (Admin Only - Optional)

### Send Notification
```http
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "email",
  "recipient": "user@email.com",
  "subject": "Blood Request Approved",
  "message": "Your blood request has been approved."
}
```

### Send Bulk Notifications
```http
POST /api/notifications/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "email",
  "recipients": ["user1@email.com", "user2@email.com"],
  "subject": "Blood Drive Announcement",
  "message": "Join our blood drive on..."
}
```

## IoT Service (Admin Only - Optional)

### Submit Sensor Data
```http
POST /api/iot/data
Authorization: Bearer <token>
Content-Type: application/json

{
  "sensor_id": "TEMP_001",
  "sensor_type": "temperature",
  "value": 4.5,
  "unit": "°C",
  "location": "Storage Room A",
  "hospital_id": "hospital1"
}
```

### Get Sensor Data
```http
GET /api/iot/data?sensor_type=temperature&page=1&limit=50
Authorization: Bearer <token>
```

### Get Alerts
```http
GET /api/iot/alerts
Authorization: Bearer <token>
```

## Ledger Service (Admin Only - Optional)

### Log Transaction
```http
POST /api/ledger/log
Authorization: Bearer <token>
Content-Type: application/json

{
  "transaction_type": "blood_donation",
  "data": {
    "donor_id": "123",
    "blood_group": "O+",
    "quantity": 1
  },
  "hospital_id": "hospital1"
}
```

### Get Ledger Entries
```http
GET /api/ledger/entries?transaction_type=blood_donation&page=1&limit=50
Authorization: Bearer <token>
```

### Verify Transaction
```http
GET /api/ledger/verify/:transaction_id
Authorization: Bearer <token>
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## RBAC Summary

| Endpoint | DONOR | DOCTOR | ADMIN |
|----------|-------|--------|-------|
| POST /donors | ❌ | ❌ | ✅ |
| GET /donors | ❌ | ❌ | ✅ |
| POST /inventory | ❌ | ❌ | ✅ |
| GET /inventory | ❌ | ✅ | ✅ |
| POST /requests | ✅ | ✅ | ✅ |
| GET /requests | ✅ (own) | ✅ | ✅ |
| PUT /requests/:id/approve | ❌ | ❌ | ✅ |
| POST /notifications | ❌ | ❌ | ✅ |
| POST /iot | ❌ | ❌ | ✅ |
| POST /ledger | ❌ | ❌ | ✅ |
