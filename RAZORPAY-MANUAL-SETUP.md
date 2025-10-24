# 🔧 Razorpay Manual Setup Instructions

## Quick Command-Line Setup

### Option 1: Automated Setup (Windows)

Simply run the setup script:

```bash
RAZORPAY-QUICK-SETUP.bat
```

This will automatically create/update your `.env` files with the Razorpay credentials.

---

### Option 2: Manual Setup (All Platforms)

#### Backend Setup

**Step 1:** Navigate to backend folder
```bash
cd backend
```

**Step 2:** Create or edit `.env` file

If `.env` doesn't exist:
```bash
# Windows
copy NUL .env

# Mac/Linux
touch .env
```

**Step 3:** Add these lines to `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

If you already have a `.env` file with other variables, just add the above two lines to it.

---

#### Frontend Setup

**Step 1:** Navigate to frontend folder
```bash
cd frontend
```

**Step 2:** Create or edit `.env` file

If `.env` doesn't exist:
```bash
# Windows
copy NUL .env

# Mac/Linux
touch .env
```

**Step 3:** Add this line to `frontend/.env`:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
```

---

### Option 3: Copy-Paste Method

#### For Backend (backend/.env):

```env
# MongoDB Connection (keep your existing value or use this default)
MONGODB_URI=mongodb://localhost:27017/blooddonation

# Server Configuration (keep your existing values or use these defaults)
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Secrets (keep your existing values or change these)
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-change-in-production

# ✅ ADD THESE RAZORPAY LINES
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

#### For Frontend (frontend/.env):

```env
# ✅ ADD THIS RAZORPAY LINE
VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE

# API Base URL (optional, keeps default if not set)
VITE_API_BASE_URL=http://localhost:5000
```

---

## Restart Servers

After creating/updating `.env` files, you MUST restart both servers:

### Stop Servers
Press `Ctrl+C` in both terminal windows running your servers.

### Start Backend
```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on port 5000
🌍 Environment: development
📡 CORS enabled for: http://localhost:5173
```

### Start Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

## Verify Setup

### Test Backend Configuration

Run this command in backend folder:
```bash
node -e "require('dotenv').config(); console.log('Key ID:', process.env.RAZORPAY_KEY_ID); console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET ? '✓ Set' : '✗ Not Set')"
```

**Expected Output:**
```
Key ID: rzp_test_RP6aD2gNdAuoRE
Key Secret: ✓ Set
```

### Test Frontend Configuration

1. Start frontend server
2. Open browser console (F12)
3. Type and run:
```javascript
console.log('Razorpay Key:', import.meta.env.VITE_RAZORPAY_KEY_ID)
```

**Expected Output:**
```
Razorpay Key: rzp_test_RP6aD2gNdAuoRE
```

---

## Test Payment Flow

### 1. Login as Blood Bank
- Navigate to `http://localhost:5173/bloodbank-login`
- Login with blood bank credentials

### 2. Book a Taxi
- Go to blood bank dashboard
- Find a donation request
- Click "Book Taxi" button

### 3. Review Details
You should see:
- ✅ Date auto-populated from donation date
- ✅ Time calculated based on distance (50 km/h)
- ✅ Travel time displayed
- ✅ Fare breakdown shown

### 4. Make Payment
- Click "Pay ₹XXX & Book" button
- Razorpay payment modal should open
- Use test card: **4111 1111 1111 1111**
- CVV: **123**
- Expiry: Any future date (e.g., **12/25**)

### 5. Success!
- Payment should be processed
- Booking should be created
- Status: "confirmed"
- Available to taxi partners via API

---

## Troubleshooting

### ❌ "Razorpay is not defined"

**Cause:** Razorpay script not loaded

**Fix:** Check `frontend/index.html` contains:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```
This is already present in your file ✅

---

### ❌ Payment modal doesn't open

**Possible Causes:**
1. `.env` file not created
2. Server not restarted
3. Wrong environment variable name

**Fix:**
1. Verify `frontend/.env` exists with `VITE_RAZORPAY_KEY_ID`
2. Restart frontend server
3. Clear browser cache
4. Check browser console for errors

---

### ❌ "Payment verification failed"

**Cause:** Backend key secret mismatch

**Fix:**
1. Verify `backend/.env` has correct `RAZORPAY_KEY_SECRET`
2. Ensure no extra spaces or quotes
3. Restart backend server

---

### ❌ "Invalid key_id" error

**Cause:** Backend not reading environment variable

**Fix:**
1. Check `backend/.env` exists
2. Check it has `RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE`
3. Restart backend server
4. No quotes needed around the value

---

## Environment Variable Format

### ⚠️ Important Rules:

1. **No quotes** needed (unless value has spaces)
   ```env
   ✅ RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
   ❌ RAZORPAY_KEY_ID="rzp_test_RP6aD2gNdAuoRE"
   ```

2. **No spaces** around `=`
   ```env
   ✅ RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
   ❌ RAZORPAY_KEY_ID = rzp_test_RP6aD2gNdAuoRE
   ```

3. **One variable per line**
   ```env
   ✅ RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
      RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
   
   ❌ RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
   ```

4. **Comments start with `#`**
   ```env
   # This is a comment
   RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
   ```

---

## Quick Reference Card

### Your Razorpay Credentials

```
┌─────────────────────────────────────────────────┐
│  Test Mode Credentials                          │
├─────────────────────────────────────────────────┤
│  Key ID:     rzp_test_RP6aD2gNdAuoRE           │
│  Key Secret: RyTIKYQ5yobfYgNaDrvErQKN          │
└─────────────────────────────────────────────────┘
```

### Test Card for Payments

```
┌─────────────────────────────────────────────────┐
│  Test Card (Success)                            │
├─────────────────────────────────────────────────┤
│  Number:  4111 1111 1111 1111                  │
│  CVV:     Any 3 digits (e.g., 123)            │
│  Expiry:  Any future date (e.g., 12/25)       │
│  Name:    Any name                              │
└─────────────────────────────────────────────────┘
```

### Files to Create

```
✅ backend/.env  - Add Razorpay credentials
✅ frontend/.env - Add Razorpay key ID
```

### Commands to Run

```bash
# After creating .env files:

# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Need Help?

1. **Check setup guide:** `RAZORPAY-SETUP-GUIDE.md`
2. **Check flow diagrams:** `TAXI-BOOKING-FLOW-DIAGRAM.md`
3. **Check implementation:** `TAXI-SMART-BOOKING-IMPLEMENTATION.md`
4. **Razorpay docs:** https://razorpay.com/docs

---

**Status:** Ready to Configure 🚀  
**Estimated Setup Time:** 2 minutes  
**Difficulty:** Easy ⭐

