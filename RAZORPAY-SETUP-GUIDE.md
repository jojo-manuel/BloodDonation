# 🔐 Razorpay Payment Setup for Taxi Booking

## ✅ Your Razorpay Credentials
```
Key ID: rzp_test_RP6aD2gNdAuoRE
Key Secret: RyTIKYQ5yobfYgNaDrvErQKN
```

---

## 📋 Quick Setup Steps

### Step 1: Create Backend Environment File

Create a file named `.env` in the `backend` folder:

**Location:** `backend/.env`

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/blooddonation

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Secrets
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-change-in-production

# ✅ Razorpay Configuration (YOUR CREDENTIALS)
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

---

### Step 2: Create Frontend Environment File

Create a file named `.env` in the `frontend` folder:

**Location:** `frontend/.env`

```env
# ✅ Razorpay Frontend Configuration (YOUR KEY ID)
VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE

# API Base URL
VITE_API_BASE_URL=http://localhost:5000
```

---

### Step 3: Verify Razorpay Script is Loaded

The Razorpay script is already included in your `frontend/index.html`:

```html
<!-- This is already present ✅ -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

### Step 4: Restart Servers

After creating the `.env` files, restart both servers:

#### Stop Current Servers
```bash
# Press Ctrl+C in both terminal windows
```

#### Start Backend
```bash
cd backend
npm start
# Or: node server.js
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

---

## ✅ What's Already Configured

### 1. **Backend Payment Integration** ✓

**File:** `backend/controllers/taxiController.js`

- ✅ Razorpay instance initialized with environment variables
- ✅ Order creation endpoint configured
- ✅ Payment verification with signature validation
- ✅ Booking creation after successful payment

### 2. **Frontend Payment Flow** ✓

**File:** `frontend/src/components/TaxiBookingModal.jsx`

- ✅ Razorpay checkout integration
- ✅ Order creation before payment
- ✅ Payment verification callback
- ✅ Success/failure handling

### 3. **Razorpay Script** ✓

**File:** `frontend/index.html`

- ✅ Razorpay CDN script loaded

---

## 🔧 Payment Flow (Already Implemented)

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER CLICKS "Pay ₹425 & Book"                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BACKEND CREATES RAZORPAY ORDER                          │
│  POST /api/taxi/create-order                                │
│  {                                                           │
│    donationRequestId: "...",                                │
│    amount: 425,                                             │
│    bookingDate: "2025-10-25",                               │
│    bookingTime: "14:15"                                     │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. RAZORPAY CHECKOUT MODAL OPENS                           │
│  • User sees payment options                                │
│  • Amount: ₹425                                             │
│  • Options: UPI, Card, NetBanking, Wallet                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. USER COMPLETES PAYMENT                                  │
│  • Enters payment details                                   │
│  • Razorpay processes payment                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. BACKEND VERIFIES PAYMENT                                │
│  POST /api/taxi/verify-payment                              │
│  • Validates Razorpay signature                             │
│  • Confirms payment authenticity                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  6. BOOKING CREATED IN DATABASE                             │
│  • Status: "confirmed"                                      │
│  • Payment: "paid"                                          │
│  • Available to taxi partners                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing the Payment Integration

### Test Mode (Current Setup)

Your credentials are for **test mode** (`rzp_test_`), which is perfect for development.

#### Test Cards for Razorpay

**Success Card:**
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits (e.g., 123)
Expiry: Any future date (e.g., 12/25)
```

**Failure Card:**
```
Card Number: 4111 1111 1111 1112
CVV: Any 3 digits
Expiry: Any future date
```

#### Test UPI
```
UPI ID: success@razorpay
```

### Testing Steps

1. **Start both servers** (after creating .env files)
2. **Login as blood bank** user
3. **Navigate to dashboard**
4. **Click "Book Taxi"** on a donation request
5. **Review auto-populated details**
6. **Click "Pay ₹XXX & Book"**
7. **Razorpay modal opens**
8. **Use test card** (see above)
9. **Complete payment**
10. **Verify booking created** ✅

---

## 🔍 Verifying Configuration

### Backend Verification

Check if environment variables are loaded:

```bash
cd backend
node -e "require('dotenv').config(); console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID)"
```

**Expected Output:**
```
Razorpay Key ID: rzp_test_RP6aD2gNdAuoRE
```

### Frontend Verification

Check if Vite loads the environment variable:

Open browser console after starting frontend and type:
```javascript
console.log('Razorpay Key:', import.meta.env.VITE_RAZORPAY_KEY_ID)
```

**Expected Output:**
```
Razorpay Key: rzp_test_RP6aD2gNdAuoRE
```

---

## 🐛 Troubleshooting

### Issue 1: "Razorpay is not defined"

**Solution:** Ensure Razorpay script is loaded in `frontend/index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Issue 2: "Invalid key_id"

**Cause:** Backend not reading environment variable

**Solution:**
1. Verify `.env` file exists in `backend` folder
2. Restart backend server
3. Check for typos in `RAZORPAY_KEY_ID`

### Issue 3: "Payment verification failed"

**Cause:** Key secret mismatch

**Solution:**
1. Verify `RAZORPAY_KEY_SECRET` in backend `.env`
2. Ensure no extra spaces in the value
3. Restart backend server

### Issue 4: Payment modal doesn't open

**Cause:** Frontend not getting key ID

**Solution:**
1. Verify `.env` file exists in `frontend` folder
2. Restart frontend dev server
3. Clear browser cache
4. Check browser console for errors

---

## 📊 Payment Response Flow

### Backend Response on Order Creation

```json
{
  "success": true,
  "data": {
    "orderId": "order_NMxxxxxxxxxxxxxx",
    "amount": 42500,
    "currency": "INR",
    "key": "rzp_test_RP6aD2gNdAuoRE"
  }
}
```

### Razorpay Payment Response

After successful payment, Razorpay returns:
```javascript
{
  razorpay_order_id: "order_NMxxxxxxxxxxxxxx",
  razorpay_payment_id: "pay_NMxxxxxxxxxxxxxx",
  razorpay_signature: "signature_hash_here"
}
```

### Final Booking Confirmation

```json
{
  "success": true,
  "message": "Taxi booked successfully!",
  "data": {
    "_id": "booking_id_here",
    "status": "confirmed",
    "paymentStatus": "paid",
    "totalFare": 425,
    "bookingDate": "2025-10-25",
    "bookingTime": "14:15"
  }
}
```

---

## 🔐 Security Best Practices

### ✅ Already Implemented

1. **Signature Verification** - Backend verifies Razorpay signature
2. **Environment Variables** - Credentials stored securely
3. **HTTPS in Production** - Use HTTPS for live payments
4. **Amount Validation** - Backend validates payment amount

### Additional Recommendations

1. **Never expose Key Secret** in frontend code
2. **Use HTTPS** for production deployment
3. **Implement logging** for payment transactions
4. **Set up webhooks** for payment status updates
5. **Monitor transactions** on Razorpay dashboard

---

## 🚀 Going Live (Production)

When ready for production:

### 1. Get Live Credentials

1. Complete KYC on Razorpay dashboard
2. Get live API keys (start with `rzp_live_`)
3. Enable payment methods

### 2. Update Environment Variables

**Backend `.env`:**
```env
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
NODE_ENV=production
```

**Frontend `.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
```

### 3. Enable Payment Methods

On Razorpay dashboard:
- ✅ Enable Cards
- ✅ Enable UPI
- ✅ Enable NetBanking
- ✅ Enable Wallets
- ✅ Configure settlement account

---

## 📞 Support & Resources

### Razorpay Resources
- **Dashboard:** https://dashboard.razorpay.com
- **Documentation:** https://razorpay.com/docs
- **Test Credentials:** https://razorpay.com/docs/payments/payments/test-card-details
- **Support:** support@razorpay.com

### Your Implementation
- Backend Code: `backend/controllers/taxiController.js`
- Frontend Code: `frontend/src/components/TaxiBookingModal.jsx`
- Routes: `backend/Route/taxiRoutes.js`

---

## ✅ Quick Checklist

Before testing, ensure:

- [ ] Created `backend/.env` with Razorpay credentials
- [ ] Created `frontend/.env` with Razorpay key ID
- [ ] Restarted backend server
- [ ] Restarted frontend dev server
- [ ] Razorpay script loads in browser (check console)
- [ ] Backend connects to database successfully
- [ ] No errors in backend terminal
- [ ] No errors in frontend terminal

---

## 🎉 You're All Set!

After completing the steps above:

1. ✅ **Backend** will use your Razorpay credentials
2. ✅ **Frontend** will use your Razorpay key ID
3. ✅ **Payment flow** is fully configured
4. ✅ **Test mode** is active (safe for development)
5. ✅ **Auto-populated dates/times** work with payments
6. ✅ **Taxi partner API** ready for integration

---

**Last Updated:** October 24, 2025  
**Status:** Ready for Testing 🚀

