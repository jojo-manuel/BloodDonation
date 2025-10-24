# 🚀 Test Google Sign-In NOW!

## ✅ Servers Running:
- **Backend:** http://localhost:5000 ✅
- **Frontend:** http://localhost:5173 ✅
- **Firebase:** Initialized ✅

---

## 📝 Quick Test Steps:

### **1. Clear Your Browser Storage**
Press `F12` and paste this in Console:
```javascript
localStorage.clear();
alert('Storage cleared! Redirecting to login...');
window.location.href = '/login';
```

### **2. Try Google Sign-In**
1. You'll be redirected to login page
2. Look for the **"Sign in with Google"** button
3. Click it
4. Select your Google account
5. Allow permissions

### **3. Success!**
After successful sign-in:
- ✅ You'll be redirected to dashboard
- ✅ Your profile will be created automatically
- ✅ Navigate to: `http://localhost:5173/user-profile`

---

## 🎯 What You Should See:

### On Login Page:
```
┌─────────────────────────────┐
│  📧 Email/Password Form     │
│                             │
│  OR                         │
│                             │
│  [  Sign in with Google  ]  │ ← Click this!
└─────────────────────────────┘
```

### After Google Sign-In:
```
✅ Google authentication successful
✅ Account created/logged in
✅ Redirected to dashboard
✅ Access to user profile
```

---

## 🔍 Backend Log Verification:

Check your backend terminal. You should see:
```
🔥 Loading Firebase credentials from file
✅ Firebase Admin SDK initialized successfully
🚀 Server running on port 5000
📡 CORS enabled for: http://localhost:5173
```

**NOT:**
```
❌ Failed to initialize Firebase Admin SDK
⚠️  Firebase features will be disabled
```

---

## 🐛 If You See Firebase Errors:

### The Cross-Origin-Opener-Policy Warning:
```
Cross-Origin-Opener-Policy policy would block the window.closed call.
```
**This is just a warning, not an error!** It doesn't prevent sign-in from working.

### If 401 Unauthorized Error:
```
POST http://localhost:5000/api/auth/firebase 401 (Unauthorized)
```

**This means Firebase backend isn't initialized.** Check:
1. Backend terminal for Firebase success message
2. File exists: `backend/config/firebase-service-account.json`
3. Backend was restarted after the fix

**Restart backend if needed:**
```bash
# Find and kill backend
taskkill /F /IM node.exe

# Restart
cd backend
npm start
```

---

## 📱 Test with Your User Profile:

After successful Google Sign-In, visit:
```
http://localhost:5173/user-profile
```

You should see:
- ✅ Your Google profile name
- ✅ Your Google email
- ✅ User/Donor badge
- ✅ Profile information
- ✅ Edit profile button

---

## 🎉 Alternative: Use Email/Password

If you prefer not to use Google, you can still login with:

```
Email: jeevan@gmail.com
Password: Jeevan123!@#
```

Then visit `/user-profile` to see your complete profile!

---

## 🔗 Quick Links:

- **Login Page:** http://localhost:5173/login
- **Dashboard:** http://localhost:5173/user-dashboard
- **User Profile:** http://localhost:5173/user-profile

---

## ✅ What's Fixed:

1. ✅ Firebase Admin SDK initialization
2. ✅ Google Sign-In functionality
3. ✅ User profile page with all features
4. ✅ Donation history tracking
5. ✅ Next donation date calculation
6. ✅ Availability toggle
7. ✅ Profile editing

---

**Ready to test?** Go to http://localhost:5173/login and click "Sign in with Google"! 🚀

