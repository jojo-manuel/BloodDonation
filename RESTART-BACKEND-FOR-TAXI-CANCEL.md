# Restart Backend for Taxi Cancel Feature

## Issue
The new taxi check endpoint is returning 404 errors:
```
GET /api/taxi/check/68e4f50357dc39e0fe40531f 404 34.650 ms - 45
```

## Root Cause
The backend server is running with old code and hasn't loaded the new `checkTaxiBooking` route yet.

## Solution: Restart Backend Server

### Option 1: Using the Batch File (Recommended)
```batch
# Stop any running backend
Ctrl + C (in the backend terminal)

# Start backend
cd D:\BloodDonation
.\start_backend.bat
```

### Option 2: Manual Restart
```batch
# 1. Stop the current backend server
Ctrl + C (in the backend terminal window)

# 2. Navigate to backend directory
cd D:\BloodDonation\backend

# 3. Start the server
npm start
```

### Option 3: Using Task Manager (if server is stuck)
```
1. Open Task Manager (Ctrl + Shift + Esc)
2. Find "node.exe" processes
3. End tasks for Node.js backend
4. Restart using start_backend.bat
```

## Verify the Fix

### 1. Check Backend Logs
After restart, you should see:
```
🚀 Server running on port 5000
📁 MongoDB Connected
✅ Taxi routes loaded
```

### 2. Test the Endpoint
The taxi check requests should now return 200 instead of 404:
```
GET /api/taxi/check/68e4f50357dc39e0fe40531f 200 45.123 ms
```

### 3. Test in Frontend
1. Go to **My Requests** tab
2. Look at a request with **Booked** status
3. If you have a taxi booked, you should see **"🚫 Cancel Taxi"**
4. If no taxi booked, you should see **"🚖 Book Taxi"**

## Common Issues

### Issue: Port 5000 is already in use
**Solution:**
```batch
# Kill process on port 5000
.\kill-port-5000.bat

# Or manually:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### Issue: MongoDB connection error
**Solution:**
1. Make sure MongoDB is running
2. Check connection string in `.env` file
3. Verify network connection

### Issue: Route still returns 404
**Solution:**
1. Check backend/Route/taxiRoutes.js exists
2. Verify the route is added: `router.get('/check/:donationRequestId', ...)`
3. Check backend/app.js has: `app.use('/api/taxi', require('./Route/taxiRoutes'))`
4. Restart backend again

## Complete Restart Process

```batch
# 1. Stop all servers
# Press Ctrl + C in both terminal windows (frontend & backend)

# 2. Restart backend
cd D:\BloodDonation
.\start_backend.bat

# 3. Wait for "Server running on port 5000" message

# 4. Restart frontend (in new terminal)
.\start_frontend.bat

# 5. Wait for "Local: http://localhost:5173"

# 6. Open browser and test
# Navigate to http://localhost:5173/login
```

## Files That Were Modified

All these files need the backend restart to take effect:

1. ✅ `backend/controllers/taxiController.js` 
   - Added `checkTaxiBooking` function

2. ✅ `backend/Route/taxiRoutes.js`
   - Added route: `router.get('/check/:donationRequestId', ...)`

3. ✅ `frontend/src/Pages/UserDashboard.jsx`
   - Frontend changes work after backend is restarted

## Expected Results After Restart

### Backend Console
```
🚀 Server running on port 5000
📁 MongoDB Connected
✅ All routes loaded

POST /api/auth/login 200 123.456 ms
GET /api/donors/requests/sent?username=... 200 45.678 ms
GET /api/taxi/check/68e4f50357dc39e0fe40531f 200 23.456 ms ✓
GET /api/taxi/check/68f872c1c04d25766e9bdcd4 200 24.567 ms ✓
```

### Frontend Behavior
- No more 404 errors in browser console
- Taxi booking status loads correctly
- "Book Taxi" / "Cancel Taxi" buttons show appropriately
- Cancel functionality works smoothly

## Quick Verification Checklist

After restarting backend:
- [ ] Backend shows "Server running on port 5000"
- [ ] No errors in backend console
- [ ] Frontend connects successfully
- [ ] Can login without errors
- [ ] Can view "My Requests"
- [ ] Taxi check endpoint returns 200 (not 404)
- [ ] "Cancel Taxi" button appears for booked taxis
- [ ] Can click "Cancel Taxi" successfully

## Need Help?

If the issue persists after restart:
1. Check all code changes were saved
2. Verify no syntax errors in modified files
3. Check MongoDB is running
4. Check port 5000 is not used by another app
5. Try a complete system restart

---

**Issue:** 404 errors for `/api/taxi/check/:donationRequestId`  
**Solution:** Restart backend server  
**Status:** Pending restart  
**Expected Time:** 30 seconds

## TL;DR

```batch
# Stop backend (Ctrl + C)
# Restart backend
cd D:\BloodDonation
.\start_backend.bat

# Done! Test in browser.
```

