# 🚖 Complete Taxi Booking System Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Setup Instructions](#setup-instructions)
5. [Testing](#testing)
6. [Documentation](#documentation)
7. [Support](#support)

---

## Overview

A complete taxi booking system for blood donation management with:

✅ **Smart Auto-Population**
- Date auto-filled from donation appointment
- Pickup time calculated at 50 km/h average speed
- 15-minute buffer time included

✅ **Razorpay Payment Integration**
- Secure payment processing
- Test mode for development
- Production-ready implementation

✅ **Taxi Partner API**
- RESTful API for third-party taxi apps
- Complete booking management
- Real-time status updates

---

## Quick Start

### 1. Setup Razorpay Credentials (2 minutes)

#### Option A: Automated (Windows)
```bash
RAZORPAY-QUICK-SETUP.bat
```

#### Option B: Manual

**Create `backend/.env`:**
```env
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

**Create `frontend/.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
```

### 2. Restart Servers

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Test Payment (1 minute)

1. Login as blood bank
2. Click "Book Taxi" on a donation request
3. Click "Pay ₹XXX & Book"
4. Use test card: `4111 1111 1111 1111`
5. Complete payment ✅

---

## Features

### 🕐 Smart Time Calculation

**How it works:**
```
Example: Donation at 3:00 PM, Distance: 25 km

Step 1: Calculate travel time
Travel Time = 25 km ÷ 50 km/h = 30 minutes

Step 2: Add buffer
Buffer = 15 minutes

Step 3: Calculate pickup
Pickup = 3:00 PM - 30 min - 15 min = 2:15 PM

Result: Donor picked up at 2:15 PM, arrives at 2:45 PM,
        ready for 3:00 PM appointment! ✅
```

### 💳 Payment Integration

- Razorpay checkout modal
- Multiple payment methods (UPI, Cards, NetBanking)
- Secure payment verification
- Test mode for development
- Production-ready

### 🚗 Taxi Partner API

5 endpoints for taxi service integration:
1. Get available bookings
2. Get booking details
3. Assign driver
4. Update status
5. Get driver bookings

---

## Setup Instructions

### Detailed Guides

Choose the guide that fits your need:

| Guide | Purpose | Time |
|-------|---------|------|
| **RAZORPAY-MANUAL-SETUP.md** | Step-by-step setup | 2 min |
| **RAZORPAY-SETUP-GUIDE.md** | Complete reference | 10 min |
| **RAZORPAY-QUICK-SETUP.bat** | Automated setup | 30 sec |

### Minimum Requirements

**Backend `.env`:**
```env
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

**Frontend `.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
```

That's it! Everything else is already configured.

---

## Testing

### 1. Frontend Testing

**Test Flow:**
1. ✅ Date auto-populates
2. ✅ Time calculates correctly
3. ✅ Travel time displays
4. ✅ Payment modal opens
5. ✅ Payment processes
6. ✅ Booking confirms

### 2. Backend Testing

**Verify Configuration:**
```bash
cd backend
node -e "require('dotenv').config(); console.log('Key ID:', process.env.RAZORPAY_KEY_ID)"
```

**Expected:** `Key ID: rzp_test_RP6aD2gNdAuoRE`

### 3. Payment Testing

**Test Cards:**

✅ **Success:**
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

❌ **Failure:**
```
Card: 4111 1111 1111 1112
CVV: 123
Expiry: 12/25
```

### 4. API Testing

Test taxi partner endpoints:
```bash
# Get available bookings
GET http://localhost:5000/api/taxi/partner/available-bookings

# Assign driver
PUT http://localhost:5000/api/taxi/partner/assign-driver/:bookingId

# Update status
PUT http://localhost:5000/api/taxi/partner/update-status/:bookingId
```

See `taxi-partner-integration-example.js` for working code.

---

## Documentation

### 📚 All Documentation Files

| File | Purpose |
|------|---------|
| **COMPLETE-TAXI-BOOKING-GUIDE.md** | This file - Overview |
| **RAZORPAY-SETUP-GUIDE.md** | Complete Razorpay setup |
| **RAZORPAY-MANUAL-SETUP.md** | Quick setup instructions |
| **RAZORPAY-QUICK-SETUP.bat** | Automated setup script |
| **TAXI-SMART-BOOKING-IMPLEMENTATION.md** | Technical details |
| **TAXI-PARTNER-API-DOCUMENTATION.md** | API reference |
| **TAXI-BOOKING-FLOW-DIAGRAM.md** | Visual flows |
| **TAXI-FEATURE-SUMMARY.md** | Feature checklist |
| **taxi-partner-integration-example.js** | Working code examples |

### 🎯 Quick Reference

**For Blood Bank Users:**
→ Just use the booking feature, everything is automated!

**For Developers:**
→ Start with `RAZORPAY-MANUAL-SETUP.md`

**For Taxi Partners:**
→ Read `TAXI-PARTNER-API-DOCUMENTATION.md`

**For System Admins:**
→ Check `TAXI-SMART-BOOKING-IMPLEMENTATION.md`

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                    │
│  • TaxiBookingModal.jsx                     │
│  • Auto-populated dates/times               │
│  • Razorpay integration                     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Backend (Node.js + Express)                │
│  • taxiController.js                        │
│  • Distance calculation (Haversine)         │
│  • Time calculation (50 km/h)               │
│  • Payment processing (Razorpay)            │
│  • Partner API (5 endpoints)                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Database (MongoDB)                         │
│  • TaxiBooking collection                   │
│  • DonationRequest collection               │
│  • Donor & BloodBank collections            │
└─────────────────────────────────────────────┘
```

### Payment Flow

```
User → Frontend → Backend → Razorpay → Backend → Database
       (Modal)    (Order)   (Payment)  (Verify)  (Confirm)
```

---

## Configuration Files

### Backend Environment

**Location:** `backend/.env`

**Required Variables:**
```env
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

**Optional Variables:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blooddonation
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment

**Location:** `frontend/.env`

**Required Variables:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
```

**Optional Variables:**
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## Troubleshooting

### Common Issues

#### ❌ Payment modal doesn't open

**Solutions:**
1. Check `frontend/.env` exists
2. Verify `VITE_RAZORPAY_KEY_ID` is set
3. Restart frontend server
4. Clear browser cache

#### ❌ "Payment verification failed"

**Solutions:**
1. Check `backend/.env` exists
2. Verify `RAZORPAY_KEY_SECRET` is correct
3. Restart backend server
4. Check for typos in credentials

#### ❌ "Razorpay is not defined"

**Solution:**
Check `frontend/index.html` has:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```
(Already present ✅)

#### ❌ Date/time not auto-populating

**Possible Causes:**
1. Donation request missing date/time
2. API response not including calculated values

**Solution:**
Check backend logs for fare calculation response.

---

## Feature Checklist

### ✅ Implemented

- [x] Date auto-population from donation date
- [x] Time calculation at 50 km/h speed
- [x] 15-minute buffer time
- [x] Distance calculation (Haversine formula)
- [x] Razorpay payment integration
- [x] Payment verification
- [x] Booking creation
- [x] Taxi partner API (5 endpoints)
- [x] Driver assignment
- [x] Status tracking
- [x] Complete documentation

### 🎯 Ready to Use

- [x] Test mode configured
- [x] Test credentials provided
- [x] Setup scripts created
- [x] Integration examples provided
- [x] No linter errors
- [x] Production-ready code

---

## API Quick Reference

### User Endpoints

```
POST /api/taxi/calculate-fare
POST /api/taxi/create-order
POST /api/taxi/verify-payment
GET  /api/taxi/my-bookings
PUT  /api/taxi/:bookingId/cancel
```

### Partner Endpoints

```
GET /api/taxi/partner/available-bookings
GET /api/taxi/partner/booking/:bookingId
PUT /api/taxi/partner/assign-driver/:bookingId
PUT /api/taxi/partner/update-status/:bookingId
GET /api/taxi/partner/driver-bookings
```

See `TAXI-PARTNER-API-DOCUMENTATION.md` for details.

---

## Support

### Resources

- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **Razorpay Docs:** https://razorpay.com/docs
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details

### Documentation

- Setup guides in repository root
- API documentation in `TAXI-PARTNER-API-DOCUMENTATION.md`
- Code examples in `taxi-partner-integration-example.js`

### Files Modified

- `frontend/src/components/TaxiBookingModal.jsx`
- `backend/controllers/taxiController.js`
- `backend/Route/taxiRoutes.js`

---

## Next Steps

### Immediate (Now)

1. ✅ Run `RAZORPAY-QUICK-SETUP.bat` or create `.env` files manually
2. ✅ Restart both servers
3. ✅ Test payment flow
4. ✅ Verify booking creation

### Short-term (This Week)

1. Test with various distances
2. Test with different donation times
3. Share API docs with taxi partners
4. Set up webhooks (optional)

### Long-term (Production)

1. Complete Razorpay KYC
2. Get live API credentials
3. Update environment variables
4. Enable payment methods
5. Configure settlement account

---

## Summary

### What You Have

✅ **Complete taxi booking system**
✅ **Smart date/time calculation**
✅ **Razorpay payment integration**
✅ **Taxi partner API**
✅ **Comprehensive documentation**
✅ **Working code examples**
✅ **Test credentials**

### What You Need to Do

1. **Create `.env` files** (2 minutes)
2. **Restart servers** (30 seconds)
3. **Test payment** (1 minute)

### Total Setup Time

⏱️ **3 minutes** and you're ready to go!

---

## Quick Command Reference

```bash
# Setup (automated - Windows)
RAZORPAY-QUICK-SETUP.bat

# Or manual setup
# 1. Create backend/.env with Razorpay credentials
# 2. Create frontend/.env with Razorpay key

# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Test backend config
cd backend && node -e "require('dotenv').config(); console.log('Key:', process.env.RAZORPAY_KEY_ID)"

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

---

**Version:** 1.0  
**Last Updated:** October 24, 2025  
**Status:** Production Ready ✅  
**Setup Time:** 3 minutes ⏱️

