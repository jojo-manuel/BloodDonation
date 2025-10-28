# Email Credentials Setup for Reschedule Notifications

## 📧 Your Gmail Credentials

```
Username: jojo2001p@gmail.com
App Password: nfge tyye qonk vtmc
```

⚠️ **IMPORTANT:** These credentials are for Gmail App Password, which is the correct way to use Gmail with nodemailer!

---

## 🔧 Setup Instructions

### Step 1: Create `.env` File in Backend

**Location:** `D:\BloodDonation\backend\.env`

**How to Create:**

1. **Open File Explorer**
   - Navigate to: `D:\BloodDonation\backend\`

2. **Create New File**
   - Right-click in the folder
   - Select "New" → "Text Document"
   - Name it: `.env` (note the dot at the beginning)
   - Windows might warn about changing extension - click "Yes"

3. **Edit the File**
   - Open `.env` with Notepad or any text editor
   - Copy and paste the content below

---

### Step 2: Add This Content to `.env`

```env
# ============================================
# EMAIL CONFIGURATION FOR NOTIFICATIONS
# ============================================
GMAIL_USER=jojo2001p@gmail.com
GMAIL_PASS=nfgetyye qonkvtmc

# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGODB_URI=mongodb://localhost:27017/blooddonation

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5000
NODE_ENV=development

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_SECRET=blooddonation-jwt-secret-2025-secure-key

# ============================================
# RAZORPAY CONFIGURATION (FOR TAXI BOOKING)
# ============================================
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN

# ============================================
# CORS CONFIGURATION
# ============================================
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3000

# ============================================
# SESSION CONFIGURATION
# ============================================
SESSION_SECRET=blooddonation-session-secret-2025
```

**Note:** I've removed the spaces from your Gmail App Password for the .env file:
- Original: `nfge tyye qonk vtmc`
- For .env: `nfgetyye qonkvtmc` (no spaces)

---

### Step 3: Verify Gmail App Password

✅ Your Gmail App Password looks correct!

**Gmail App Password Format:**
- 16 characters (4 groups of 4)
- Letters only (lowercase)
- Your password: `nfge tyye qonk vtmc` ✓

**Important Notes:**
- ✅ This is an **App Password**, not your regular Gmail password
- ✅ App Passwords are designed for third-party apps
- ✅ More secure than using your actual password
- ✅ Can be revoked anytime from Google Account settings

---

### Step 4: Test Email Configuration

After creating the `.env` file:

1. **Restart Backend Server**
   ```bash
   cd D:\BloodDonation
   # Stop current server (Ctrl + C)
   .\start_backend.bat
   ```

2. **Check Console for Email Configuration**
   You should see:
   ```
   📧 Email service configured
   ✉️ Gmail User: jojo2001p@gmail.com
   ```

3. **Test Sending Email (Optional)**
   Create a test file: `test-email.js` in backend folder
   ```javascript
   require('dotenv').config();
   const { sendEmail } = require('./utils/email');

   sendEmail(
     'your-test-email@gmail.com',
     'Test Email from Blood Donation System',
     'This is a test email to verify email configuration is working!'
   )
   .then(() => console.log('✅ Email sent successfully!'))
   .catch((error) => console.error('❌ Email failed:', error));
   ```

   Run:
   ```bash
   cd backend
   node test-email.js
   ```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✓ Keep `.env` file in `backend/` folder only
- ✓ Never commit `.env` to Git (it's in `.gitignore`)
- ✓ Use App Password, not regular Gmail password
- ✓ Revoke and regenerate App Password if compromised

### ❌ DON'T:
- ✗ Don't share `.env` file with anyone
- ✗ Don't commit credentials to GitHub/Git
- ✗ Don't use regular Gmail password in .env
- ✗ Don't upload `.env` to cloud storage

---

## 🔍 Troubleshooting

### Issue: "Authentication failed" Error

**Solutions:**
1. ✅ Verify App Password is correct (no typos)
2. ✅ Remove all spaces from password in .env
3. ✅ Ensure 2-Step Verification is enabled on Gmail
4. ✅ Check if App Password is still active in Google Account

### Issue: Email Not Sending

**Solutions:**
1. Check `.env` file exists in `backend/` folder
2. Verify `GMAIL_USER` and `GMAIL_PASS` are set correctly
3. Restart backend server after changing .env
4. Check console for error messages
5. Verify internet connection

### Issue: "App Password Invalid"

**Regenerate App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to Google Account
3. Create new App Password for "Mail"
4. Replace old password in `.env`
5. Restart backend server

---

## 📋 Verification Checklist

After setup, verify:
- [ ] `.env` file created in `backend/` folder
- [ ] All required variables are set
- [ ] No spaces in `GMAIL_PASS` value
- [ ] File is saved (not still open in editor)
- [ ] Backend server restarted
- [ ] No errors in console
- [ ] Test email works (optional)

---

## 🎯 Next Steps

Once `.env` is configured:

1. ✅ **Backend is Ready** - Email service configured
2. ✅ **Reschedule Feature Works** - Notifications will send emails
3. ✅ **Test the Feature** - Try rescheduling a slot

**To Test Reschedule:**
```bash
# Use the test script provided earlier
node test-reschedule-notification.js
```

---

## 📞 Need Help?

If you encounter issues:
1. Check this guide again
2. Verify all steps completed
3. Check backend console for errors
4. Try regenerating Gmail App Password

---

## ⚠️ Important Security Notice

**Your credentials are safe when:**
- ✅ Stored in `.env` file (gitignored)
- ✅ Not committed to Git
- ✅ Using App Password (not main password)
- ✅ Can be revoked anytime

**Your Gmail App Password Format:**
```
nfge tyye qonk vtmc  (with spaces - for reference)
nfgetyye qonkvtmc   (without spaces - for .env file)
```

---

**Setup Date:** October 27, 2025  
**Email:** jojo2001p@gmail.com  
**Purpose:** Slot Reschedule Notifications  
**Status:** ✅ Ready to Configure

