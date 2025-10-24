# 🗄️ Blood Donation System - Complete Database Schema Design

**Database:** MongoDB (NoSQL)  
**ORM/ODM:** Mongoose  
**Total Collections:** 10

---

## 📋 Table of Contents

1. [User](#1-user-collection)
2. [Donor](#2-donor-collection)
3. [Patient](#3-patient-collection)
4. [BloodBank](#4-bloodbank-collection)
5. [DonationRequest](#5-donationrequest-collection)
6. [Booking](#6-booking-collection)
7. [Review](#7-review-collection)
8. [TaxiBooking](#8-taxibooking-collection)
9. [Activity](#9-activity-collection)
10. [DonorSearchPatient](#10-donorsearchpatient-collection)
11. [Relationships & ER Diagram](#relationships-overview)
12. [Indexes](#indexes-summary)

---

## 1. User Collection

**Purpose:** Core authentication and user management  
**Collection Name:** `users`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `username` | String | Yes | Yes | - | Email format, 3-100 chars | User login (email format) |
| `name` | String | Yes | No | - | 1-100 chars | Full name |
| `email` | String | No | No | - | Valid email | Optional email |
| `password` | String | Conditional | No | - | Min 6 chars (if provider=local) | Hashed password |
| `role` | String | Yes | No | - | Enum: user, donor, bloodbank, admin | User role |
| `resetPasswordToken` | String | No | No | null | - | Password reset token |
| `resetPasswordExpires` | Date | No | No | null | - | Token expiry |
| `googleId` | String | No | Sparse | null | - | Google OAuth ID |
| `firebaseId` | String | No | Sparse | null | - | Firebase Auth ID |
| `isBlocked` | Boolean | No | No | false | - | Account blocked status |
| `isSuspended` | Boolean | No | No | false | - | Account suspended status |
| `warningMessage` | String | No | No | null | - | Admin warning message |
| `warningCount` | Number | No | No | 0 | - | Number of warnings |
| `suspendUntil` | Date | No | No | null | - | Suspension end date |
| `blockMessage` | String | No | No | null | - | Block reason message |
| `provider` | String | No | No | 'local' | Enum: local, google, firebase | Auth provider |
| `phone` | String | No | Sparse | - | Indian number (10 digits, starts 6-9) | Phone number |
| `address` | Object | No | No | - | See sub-fields | User address |
| `address.houseName` | String | No | No | - | - | House name |
| `address.houseAddress` | String | No | No | - | - | Street address |
| `address.localBody` | String | No | No | - | - | Local government body |
| `address.city` | String | No | No | - | - | City |
| `address.district` | String | No | No | - | - | District |
| `address.pincode` | String | No | No | - | 6 digits | Postal code |
| `profileImage` | String | No | No | null | - | Profile image URL |
| `needsProfileCompletion` | Boolean | No | No | false | - | Profile completion flag |
| `isDeleted` | Boolean | No | No | false | - | Soft delete flag |
| `emailVerificationCode` | String | No | No | null | - | Email verification code |
| `emailVerificationExpires` | Date | No | No | null | - | Verification code expiry |
| `settings` | Object | No | No | - | See sub-fields | User preferences |
| `settings.notifications.email` | Boolean | No | No | true | - | Email notifications |
| `settings.notifications.sms` | Boolean | No | No | false | - | SMS notifications |
| `settings.notifications.push` | Boolean | No | No | true | - | Push notifications |
| `settings.notifications.donationReminders` | Boolean | No | No | true | - | Donation reminders |
| `settings.notifications.marketing` | Boolean | No | No | false | - | Marketing emails |
| `settings.security.twoFactorAuth` | Boolean | No | No | false | - | 2FA enabled |
| `settings.appearance.darkMode` | Boolean | No | No | false | - | Dark mode preference |
| `settings.appearance.language` | String | No | No | 'en' | Enum: en, hi, es, fr | Language |
| `settings.privacy.profileVisibility` | String | No | No | 'public' | Enum: public, private, friends | Profile visibility |
| `settings.privacy.showEmail` | Boolean | No | No | false | - | Show email publicly |
| `settings.privacy.showPhone` | Boolean | No | No | false | - | Show phone publicly |
| `settings.regional.timezone` | String | No | No | 'Asia/Kolkata' | - | Timezone |
| `settings.regional.dateFormat` | String | No | No | 'DD/MM/YYYY' | Enum: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD | Date format |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- `username` (unique)
- `resetPasswordToken`
- `resetPasswordExpires`
- `googleId` (sparse)
- `firebaseId` (sparse)
- `phone` (unique, sparse)

**Methods:**
- `comparePassword(enteredPassword)` - Compare hashed password

**Hooks:**
- Pre-save: Hash password if modified

---

## 2. Donor Collection

**Purpose:** Donor profile and donation history  
**Collection Name:** `donors`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `userId` | ObjectId | Yes | Yes | - | Ref: User | User reference (unique) |
| `name` | String | Yes | No | - | - | Donor name |
| `dob` | Date | Yes | No | - | - | Date of birth |
| `gender` | String | Yes | No | - | Enum: Male, Female, Other | Gender |
| `bloodGroup` | String | Yes | No | - | Enum: A+, A-, B+, B-, AB+, AB-, O+, O- | Blood group |
| `contactNumber` | String | Yes | Yes | - | 10 digits | Contact number |
| `emergencyContactNumber` | String | Yes | No | - | 10 digits, different from contactNumber | Emergency contact |
| `houseAddress` | Object | Yes | No | - | See sub-fields | House address |
| `houseAddress.houseName` | String | Yes | No | - | - | House name |
| `houseAddress.houseAddress` | String | No | No | - | - | Street address (auto-filled) |
| `houseAddress.localBody` | String | No | No | - | - | Local body (auto-filled) |
| `houseAddress.city` | String | No | No | - | - | City (auto-filled) |
| `houseAddress.district` | String | No | No | - | - | District (auto-filled) |
| `houseAddress.state` | String | No | No | - | - | State (auto-filled) |
| `houseAddress.pincode` | String | Yes | No | - | 6 digits | Pincode |
| `workAddress` | String | Yes | No | - | - | Work address |
| `weight` | Number | Yes | No | - | Min: 55.1 kg | Weight in kg |
| `availability` | Boolean | No | No | true | - | Available for donation |
| `contactPreference` | String | No | No | 'phone' | Enum: phone, email | Preferred contact method |
| `phone` | String | No | No | - | - | Additional phone |
| `bloodBankName` | String | No | No | - | - | Associated blood bank |
| `lastDonatedDate` | Date | No | No | - | - | Last donation date |
| `priorityPoints` | Number | No | No | 0 | Min: 0 | Priority score |
| `donatedDates` | Array[Date] | No | No | [] | - | Donation history dates |
| `isBlocked` | Boolean | No | No | false | - | Blocked status |
| `isSuspended` | Boolean | No | No | false | - | Suspended status |
| `location.latitude` | Number | No | No | - | - | Latitude for matching |
| `location.longitude` | Number | No | No | - | - | Longitude for matching |
| `warningMessage` | String | No | No | null | - | Warning message |
| `warningCount` | Number | No | No | 0 | - | Warning count |
| `suspendUntil` | Date | No | No | null | - | Suspension end date |
| `blockMessage` | String | No | No | null | - | Block reason |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- `userId` (unique)
- `contactNumber` (unique)

**Business Rules:**
- Weight must be above 55kg
- Emergency contact must be different from primary contact
- One donor profile per user

---

## 3. Patient Collection

**Purpose:** Patient blood requirements  
**Collection Name:** `patients`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `bloodBankId` | ObjectId | Yes | No | - | Ref: BloodBank | Blood bank reference |
| `bloodBankName` | String | Yes | No | - | - | Blood bank name |
| `name` | String | Yes | No | - | - | Patient name |
| `address` | Object | No | No | - | See sub-fields | Patient address |
| `address.houseName` | String | No | No | - | - | House name |
| `address.houseAddress` | String | No | No | - | - | Street address |
| `address.localBody` | String | No | No | - | - | Local body |
| `address.city` | String | No | No | - | - | City |
| `address.district` | String | No | No | - | - | District |
| `address.state` | String | No | No | - | - | State |
| `address.pincode` | String | Yes | No | - | 6 digits | Pincode |
| `bloodGroup` | String | Yes | No | - | Enum: A+, A-, B+, B-, O+, O-, AB+, AB- | Blood group |
| `mrid` | String | Yes | No | - | Uppercase | Medical Record ID |
| `phoneNumber` | String | Yes | Yes | - | - | Phone number |
| `unitsRequired` | Number | Yes | No | - | Min: 1 | Blood units needed |
| `unitsReceived` | Number | No | No | 0 | Min: 0 | Blood units received |
| `isFulfilled` | Boolean | No | No | false | - | Requirement fulfilled |
| `fulfilledAt` | Date | No | No | - | - | Fulfillment date |
| `dateNeeded` | Date | Yes | No | - | Must be today or future | Date blood needed |
| `requestDate` | Date | No | No | Date.now | - | Request creation date |
| `isDeleted` | Boolean | No | No | false | - | Soft delete flag |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- `phoneNumber` (unique)
- `bloodBankId`

**Hooks:**
- Pre-save: Auto-fulfill when `unitsReceived >= unitsRequired`

**Business Rules:**
- `dateNeeded` must be today or in the future
- Auto-fulfillment when units received meets required units

---

## 4. BloodBank Collection

**Purpose:** Blood bank profiles and management  
**Collection Name:** `bloodbanks`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `userId` | ObjectId | Yes | Yes | - | Ref: User | User reference (unique) |
| `name` | String | Yes | No | - | Min: 3 chars | Blood bank name |
| `address` | String | Yes | No | - | - | Full address |
| `district` | String | Yes | No | - | - | District |
| `contactNumber` | String | Yes | No | - | 10 digits | Contact number |
| `licenseNumber` | String | Yes | Yes | - | - | Unique license number |
| `status` | String | No | No | 'pending' | Enum: pending, approved, rejected | Approval status |
| `isBlocked` | Boolean | No | No | false | - | Blocked status |
| `isSuspended` | Boolean | No | No | false | - | Suspended status |
| `warningMessage` | String | No | No | null | - | Warning message |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- `userId` (unique)
- `licenseNumber` (unique)

**Business Rules:**
- One blood bank per user
- Must be approved by admin before active

---

## 5. DonationRequest Collection

**Purpose:** Blood donation requests and tracking  
**Collection Name:** `donationrequests`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `senderId` | ObjectId | No | No | - | Ref: User | Request sender |
| `receiverId` | ObjectId | No | No | - | Ref: User | Request receiver |
| `donorUserId` | ObjectId | No | No | - | Ref: User | Donor's user ID |
| `bloodBankName` | String | No | No | - | - | Blood bank name |
| `bloodGroup` | String | Yes | No | - | Enum: A+, A-, B+, B-, O+, O-, AB+, AB- | Blood group |
| `issuedAt` | Date | No | No | - | - | Request issued date |
| `isActive` | Boolean | No | No | true | - | Request active status |
| `requesterId` | ObjectId | No | No | - | Ref: User | Admin/blood bank requester |
| `donorId` | ObjectId | No | No | - | Ref: Donor | Donor reference |
| `patientId` | ObjectId | No | No | - | Ref: Patient | Patient reference |
| `bloodBankId` | ObjectId | No | No | - | Ref: BloodBank | Blood bank reference |
| `status` | String | No | No | 'pending' | Enum: pending, pending_booking, accepted, rejected, booked, cancelled, completed | Request status |
| `message` | String | No | No | Default message | - | Request message |
| `requestedAt` | Date | No | No | Date.now | - | Request timestamp |
| `respondedAt` | Date | No | No | - | - | Response timestamp |
| `requestedDate` | Date | No | No | - | - | Requested donation date |
| `requestedTime` | String | No | No | - | - | Requested donation time |
| `tokenNumber` | String | No | No | - | - | Assigned token number |
| `requesterUsername` | String | No | No | - | - | Requester username (denormalized) |
| `donorUsername` | String | No | No | - | - | Donor username (denormalized) |
| `bloodBankUsername` | String | No | No | - | - | Blood bank username (denormalized) |
| `bloodBankAddress` | String | No | No | - | - | Blood bank address (denormalized) |
| `patientUsername` | String | No | No | - | - | Patient username (denormalized) |
| `patientMRID` | String | No | No | - | - | Patient MRID (denormalized) |
| `userPhone` | String | No | No | - | - | User phone (denormalized) |
| `bookingId` | ObjectId | No | No | - | Ref: Booking | Linked booking reference |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Status Flow:**
```
pending → accepted → pending_booking → booked → completed
   ↓
rejected / cancelled
```

---

## 6. Booking Collection

**Purpose:** Donation appointment bookings  
**Collection Name:** `bookings`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `bookingId` | String | No | Yes | - | Format: 4 letters + 4 numbers | Custom booking ID |
| `bloodBankId` | ObjectId | Yes | No | - | Ref: BloodBank | Blood bank reference |
| `date` | Date | Yes | No | - | - | Booking date |
| `time` | String | Yes | No | - | Format: "10:00 AM" | Booking time |
| `donorId` | ObjectId | Yes | No | - | Ref: Donor | Donor reference |
| `status` | String | No | No | 'pending' | Enum: pending, confirmed, completed, rejected, cancelled | Booking status |
| `tokenNumber` | String | No | No | - | Range: 15-50 | Token number after confirmation |
| `donationRequestId` | ObjectId | No | No | - | Ref: DonationRequest | Original request reference |
| `patientName` | String | No | No | - | - | Patient name (denormalized) |
| `donorName` | String | No | No | - | - | Donor name (denormalized) |
| `requesterName` | String | No | No | - | - | Requester name (denormalized) |
| `bloodBankName` | String | No | No | - | - | Blood bank name (denormalized) |
| `bloodGroup` | String | No | No | - | Enum: A+, A-, B+, B-, O+, O-, AB+, AB- | Blood group |
| `patientMRID` | String | No | No | - | - | Patient MRID (denormalized) |
| `arrived` | Boolean | No | No | false | - | Donor arrival status |
| `arrivalTime` | Date | No | No | - | - | Arrival timestamp |
| `completedAt` | Date | No | No | - | - | Completion timestamp |
| `rejectionReason` | String | No | No | - | - | Rejection reason |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- `bookingId` (unique)

**Business Rules:**
- Token numbers assigned in range 15-50
- Custom booking ID format: 4 alphabets + 4 numbers

---

## 7. Review Collection

**Purpose:** Donor and blood bank reviews  
**Collection Name:** `reviews`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `reviewerId` | ObjectId | Yes | No | - | Ref: User | Reviewer reference |
| `type` | String | Yes | No | - | Enum: donor, bloodbank | Review type |
| `donorId` | ObjectId | Conditional | No | - | Ref: Donor (if type=donor) | Donor reference |
| `bloodBankId` | ObjectId | Conditional | No | - | Ref: BloodBank (if type=bloodbank) | Blood bank reference |
| `rating` | Number | Yes | No | - | Min: 1, Max: 5 | Rating (1-5 stars) |
| `comment` | String | Yes | No | - | Max: 500 chars | Review comment |
| `isActive` | Boolean | No | No | true | - | Review active status |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- Compound: `(reviewerId, type, donorId, bloodBankId)` (unique) - Prevents duplicate reviews
- `(type, donorId, createdAt)`
- `(type, bloodBankId, createdAt)`

**Business Rules:**
- One review per user per entity (donor or blood bank)
- Rating must be 1-5
- Comment max 500 characters

---

## 8. TaxiBooking Collection

**Purpose:** Taxi bookings for donation appointments  
**Collection Name:** `taxibookings`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `userId` | ObjectId | Yes | No | - | Ref: User | User who booked |
| `donorId` | ObjectId | Yes | No | - | Ref: Donor | Donor reference |
| `donationRequestId` | ObjectId | Yes | No | - | Ref: DonationRequest | Related donation request |
| `bloodBankId` | ObjectId | Yes | No | - | Ref: BloodBank | Destination blood bank |
| `pickupAddress` | String | Yes | No | - | - | Pickup address |
| `dropAddress` | String | Yes | No | - | - | Drop address |
| `pickupLocation.latitude` | Number | No | No | - | - | Pickup latitude |
| `pickupLocation.longitude` | Number | No | No | - | - | Pickup longitude |
| `dropLocation.latitude` | Number | No | No | - | - | Drop latitude |
| `dropLocation.longitude` | Number | No | No | - | - | Drop longitude |
| `distanceKm` | Number | Yes | No | - | - | Distance in kilometers |
| `baseFare` | Number | No | No | 50 | - | Base fare (INR) |
| `perKmRate` | Number | No | No | 15 | - | Per km rate (INR) |
| `totalFare` | Number | Yes | No | - | - | Total calculated fare |
| `bookingDate` | Date | Yes | No | - | - | Booking date |
| `bookingTime` | String | Yes | No | - | - | Booking time |
| `donorName` | String | No | No | - | - | Donor name |
| `donorPhone` | String | No | No | - | - | Donor phone |
| `paymentStatus` | String | No | No | 'pending' | Enum: pending, paid, failed, refunded | Payment status |
| `razorpayOrderId` | String | No | No | - | - | Razorpay order ID |
| `razorpayPaymentId` | String | No | No | - | - | Razorpay payment ID |
| `razorpaySignature` | String | No | No | - | - | Razorpay signature |
| `amountPaid` | Number | No | No | - | - | Amount paid |
| `paidAt` | Date | No | No | - | - | Payment timestamp |
| `status` | String | No | No | 'pending' | Enum: pending, confirmed, assigned, in_transit, completed, cancelled | Taxi booking status |
| `taxiDetails.driverName` | String | No | No | - | - | Driver name |
| `taxiDetails.driverPhone` | String | No | No | - | - | Driver phone |
| `taxiDetails.vehicleNumber` | String | No | No | - | - | Vehicle number |
| `taxiDetails.vehicleType` | String | No | No | - | - | Vehicle type |
| `notes` | String | No | No | - | - | Additional notes |
| `cancellationReason` | String | No | No | - | - | Cancellation reason |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- `(userId, createdAt)` (descending)
- `donorId`
- `donationRequestId`
- `razorpayOrderId`

**Business Rules:**
- Base fare: ₹50
- Per km rate: ₹15
- Total fare = baseFare + (distanceKm × perKmRate)

---

## 9. Activity Collection

**Purpose:** User activity logging  
**Collection Name:** `activities`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `userId` | ObjectId | Yes | No | - | Ref: User | User reference |
| `role` | String | Yes | No | - | - | User role at time of action |
| `action` | String | Yes | No | - | - | Action performed |
| `timestamp` | Date | No | No | Date.now | - | Action timestamp |
| `details` | Mixed | No | No | {} | - | Additional details (any type) |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Business Rules:**
- Logs all significant user actions
- Details field accepts any data structure

---

## 10. DonorSearchPatient Collection

**Purpose:** Legacy/alternate patient search system  
**Collection Name:** `donorsearchpatients`

| Field Name | Data Type | Required | Unique | Default | Validation | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | Auto | - | Primary Key |
| `name` | String | Yes | No | - | 3-50 chars, letters only | Patient name |
| `address` | String | Yes | No | - | 5-200 chars | Address |
| `bloodGroup` | String | Yes | No | - | Enum: A+, A-, B+, B-, O+, O-, AB+, AB- | Blood group |
| `mrid` | String | Yes | Yes | - | Uppercase, alphanumeric, 5-15 chars | Medical Record ID |
| `unitsRequired` | Number | Yes | No | - | Min: 1, Max: 10, integer | Blood units required |
| `dateNeeded` | Date | Yes | No | - | Today or future | Date needed |
| `requestDate` | Date | No | No | Date.now | - | Request date (immutable) |
| `phone` | String | Yes | No | - | 10 digits | Phone number |
| `email` | String | Yes | Yes | - | Valid email | Email address |
| `emergencyContact.name` | String | Yes | No | - | 3-50 chars, letters only | Emergency contact name |
| `emergencyContact.phone` | String | Yes | No | - | 10 digits | Emergency contact phone |
| `emergencyContact.relation` | String | Yes | No | - | 3-30 chars, letters only | Relation to patient |
| `createdAt` | Date | Auto | No | Auto | - | Created timestamp |
| `updatedAt` | Date | Auto | No | Auto | - | Updated timestamp |

**Indexes:**
- `mrid` (unique)
- `email` (unique)

**Business Rules:**
- MRID must be unique and uppercase
- Units required: 1-10
- Date needed must be today or future

---

## 🔗 Relationships Overview

### Entity Relationship Diagram (Text Format)

```
┌──────────────┐
│     User     │
│   (Central)  │
└──────┬───────┘
       │
       ├─────── 1:1 ─────→ Donor
       │
       ├─────── 1:1 ─────→ BloodBank
       │
       ├─────── 1:N ─────→ Review (as reviewer)
       │
       ├─────── 1:N ─────→ DonationRequest (as sender/receiver/donor/requester)
       │
       ├─────── 1:N ─────→ TaxiBooking (as user)
       │
       └─────── 1:N ─────→ Activity (logging)


┌──────────────┐
│  BloodBank   │
└──────┬───────┘
       │
       ├─────── 1:N ─────→ Patient
       │
       ├─────── 1:N ─────→ DonationRequest
       │
       ├─────── 1:N ─────→ Booking
       │
       ├─────── 1:N ─────→ TaxiBooking (as destination)
       │
       └─────── 1:N ─────→ Review (as reviewed entity)


┌──────────────┐
│    Donor     │
└──────┬───────┘
       │
       ├─────── 1:N ─────→ DonationRequest
       │
       ├─────── 1:N ─────→ Booking
       │
       ├─────── 1:N ─────→ TaxiBooking
       │
       └─────── 1:N ─────→ Review (as reviewed entity)


┌──────────────┐
│   Patient    │
└──────┬───────┘
       │
       └─────── 1:N ─────→ DonationRequest


┌──────────────────┐
│ DonationRequest  │
└────────┬─────────┘
         │
         ├─────── 1:1 ─────→ Booking (optional)
         │
         └─────── 1:1 ─────→ TaxiBooking (optional)
```

### Key Relationships

| Parent Collection | Child Collection | Relationship Type | Foreign Key | Description |
|---|---|---|---|---|
| User | Donor | One-to-One | `userId` | Each user can have one donor profile |
| User | BloodBank | One-to-One | `userId` | Each user can have one blood bank profile |
| User | Review | One-to-Many | `reviewerId` | Users can write multiple reviews |
| User | Activity | One-to-Many | `userId` | User actions are logged |
| User | TaxiBooking | One-to-Many | `userId` | Users can book multiple taxis |
| Donor | DonationRequest | One-to-Many | `donorId` | Donors receive multiple requests |
| Donor | Booking | One-to-Many | `donorId` | Donors have multiple bookings |
| Donor | Review | One-to-Many | `donorId` | Donors can be reviewed multiple times |
| BloodBank | Patient | One-to-Many | `bloodBankId` | Blood banks manage multiple patients |
| BloodBank | DonationRequest | One-to-Many | `bloodBankId` | Blood banks create multiple requests |
| BloodBank | Booking | One-to-Many | `bloodBankId` | Blood banks manage multiple bookings |
| BloodBank | Review | One-to-Many | `bloodBankId` | Blood banks can be reviewed |
| Patient | DonationRequest | One-to-Many | `patientId` | Patients can have multiple requests |
| DonationRequest | Booking | One-to-One | `donationRequestId` | Request can have one booking |
| DonationRequest | TaxiBooking | One-to-One | `donationRequestId` | Request can have one taxi booking |

---

## 📊 Indexes Summary

### Critical Indexes for Performance

| Collection | Index Fields | Type | Purpose |
|---|---|---|---|
| User | `username` | Unique | Login authentication |
| User | `phone` | Unique, Sparse | Phone authentication |
| User | `resetPasswordToken` | Regular | Password reset lookup |
| User | `googleId`, `firebaseId` | Sparse | OAuth authentication |
| Donor | `userId` | Unique | One donor per user |
| Donor | `contactNumber` | Unique | Unique contact validation |
| Patient | `phoneNumber` | Unique | Unique contact validation |
| Patient | `bloodBankId` | Regular | Blood bank's patients lookup |
| BloodBank | `userId` | Unique | One blood bank per user |
| BloodBank | `licenseNumber` | Unique | License validation |
| DonationRequest | Multiple ObjectIds | Regular | Relationship queries |
| Booking | `bookingId` | Unique | Booking lookup |
| Review | `(reviewerId, type, donorId, bloodBankId)` | Compound Unique | Prevent duplicate reviews |
| Review | `(type, donorId, createdAt)` | Compound | Donor reviews query |
| Review | `(type, bloodBankId, createdAt)` | Compound | Blood bank reviews query |
| TaxiBooking | `(userId, createdAt)` | Compound | User's bookings |
| TaxiBooking | `razorpayOrderId` | Regular | Payment tracking |
| DonorSearchPatient | `mrid` | Unique | MRID uniqueness |
| DonorSearchPatient | `email` | Unique | Email uniqueness |

---

## 📝 Business Rules & Constraints

### User Management
1. **Username must be email format** (for authentication)
2. **Password required only for local users** (not for OAuth users)
3. **One user can have only one donor OR one blood bank profile** (via unique userId index)
4. **Soft delete implemented** (`isDeleted` flag instead of hard delete)

### Donor Management
1. **Weight must be > 55kg** (blood donation eligibility)
2. **Emergency contact must differ from primary contact**
3. **Priority points system** for donor ranking
4. **Location coordinates** for smart matching algorithm

### Patient Management
1. **Auto-fulfillment** when `unitsReceived >= unitsRequired`
2. **MRID stored in uppercase** for consistency
3. **Date needed must be today or future**
4. **Unique phone numbers** across patients

### Blood Bank Management
1. **Approval workflow** (pending → approved/rejected)
2. **Unique license number** validation
3. **One blood bank per user account**

### Donation Request Flow
1. **Status progression:** pending → accepted → pending_booking → booked → completed
2. **Can be rejected or cancelled** at any stage
3. **Linked to booking** when confirmed
4. **Denormalized fields** for performance (usernames, addresses)

### Booking System
1. **Token numbers assigned** in range 15-50
2. **Custom booking IDs** (4 letters + 4 numbers)
3. **Arrival tracking** with timestamps
4. **Rejection reasons** captured

### Review System
1. **One review per user per entity** (donor or blood bank)
2. **Rating must be 1-5 stars**
3. **500 character limit** on comments
4. **Can be marked inactive** (soft delete)

### Taxi Booking System
1. **Pricing:** Base fare ₹50 + Distance × ₹15/km
2. **Razorpay integration** for payments
3. **Driver assignment workflow**
4. **Linked to donation request**

---

## 🔐 Security Considerations

1. **Password Hashing:** Bcrypt with salt (User model)
2. **Sparse Indexes:** For nullable unique fields (googleId, firebaseId, phone)
3. **Soft Deletes:** `isDeleted` flags instead of hard deletes
4. **Email Validation:** Regex patterns for email format
5. **Phone Validation:** Indian number format (10 digits, starts 6-9)
6. **MRID Uppercase:** Consistent data storage
7. **Token Expiry:** Password reset and email verification tokens expire
8. **Role-based Access:** User roles (user, donor, bloodbank, admin)

---

## 📈 Scalability Considerations

1. **Indexed Fields:** All foreign keys and frequently queried fields
2. **Denormalization:** Common fields stored redundantly for faster reads
3. **Timestamps:** Auto-managed `createdAt` and `updatedAt` on all collections
4. **Compound Indexes:** For complex queries (e.g., reviews, taxi bookings)
5. **Sparse Indexes:** For optional unique fields to save space
6. **ObjectId References:** For data relationships and joins

---

## 🚀 Future Enhancements

1. **Add indexes on frequently filtered fields** (e.g., `status`, `bloodGroup`)
2. **Implement data archival** for old records
3. **Add geospatial indexes** for location-based queries
4. **Create materialized views** for analytics
5. **Implement sharding strategy** for horizontal scaling
6. **Add time-series collection** for activity logs

---

## 📚 Collection Statistics (Estimated)

| Collection | Estimated Docs | Avg Doc Size | Growth Rate |
|---|---|---|---|
| User | 10,000+ | 1.5 KB | Medium |
| Donor | 5,000+ | 1 KB | Medium |
| Patient | 20,000+ | 0.8 KB | High |
| BloodBank | 100+ | 0.5 KB | Low |
| DonationRequest | 50,000+ | 1.2 KB | High |
| Booking | 30,000+ | 0.9 KB | High |
| Review | 10,000+ | 0.4 KB | Medium |
| TaxiBooking | 5,000+ | 1.1 KB | Medium |
| Activity | 100,000+ | 0.3 KB | Very High |
| DonorSearchPatient | 1,000+ | 0.7 KB | Low |

---

**Document Version:** 1.0  
**Last Updated:** October 24, 2025  
**Database:** MongoDB (Mongoose ODM)  
**Application:** Blood Donation Management System

