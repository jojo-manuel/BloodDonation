# 🔐 Render Environment Variables - Quick Setup

## ✅ Build Successful! Now Add Environment Variables

Your build succeeded! Now you just need to add environment variables in Render.

---

## 📋 Required Variables (Copy & Paste)

Go to: **Render Dashboard → Your Service → Environment Tab**

Click **"Add Environment Variable"** and add these one by one:

---

### 1. NODE_ENV
```
Key:   NODE_ENV
Value: production
```

### 2. PORT
```
Key:   PORT
Value: 5000
```

### 3. MONGO_URI ⭐ (REQUIRED)
```
Key:   MONGO_URI
Value: mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
```

### 4. JWT_SECRET
```
Key:   JWT_SECRET
Value: your-super-secret-jwt-key-change-this-in-production-32chars
```

### 5. JWT_REFRESH_SECRET
```
Key:   JWT_REFRESH_SECRET
Value: your-super-secret-refresh-key-change-this-production-32
```

### 6. JWT_ACCESS_SECRET ⭐ (REQUIRED)
```
Key:   JWT_ACCESS_SECRET
Value: access-secret-key-32-characters-long-production-safe
```

### 7. ENCRYPTION_SECRET ⭐ (REQUIRED)
```
Key:   ENCRYPTION_SECRET
Value: encryption-secret-key-32-chars-production-secure
```

### 8. CORS_ORIGIN
```
Key:   CORS_ORIGIN
Value: http://localhost:5173
```
**Note:** Update this with your Firebase URL after deploying frontend:
```
Value: https://your-project-id.web.app,https://your-project-id.firebaseapp.com
```

---

## 🎯 Optional Variables (Can Add Later)

### 9. RAZORPAY_KEY_ID (for payments)
```
Key:   RAZORPAY_KEY_ID
Value: rzp_test_YOUR_TEST_KEY
```

### 10. RAZORPAY_KEY_SECRET (for payments)
```
Key:   RAZORPAY_KEY_SECRET
Value: YOUR_TEST_SECRET
```

---

## ⚡ Quick Copy-Paste Format

For faster setup, copy this entire block and add variables one by one:

```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-production-32
JWT_ACCESS_SECRET=access-secret-key-32-characters-long-production-safe
ENCRYPTION_SECRET=encryption-secret-key-32-chars-production-secure
CORS_ORIGIN=http://localhost:5173
```

---

## 🔒 Generate Strong Secrets (Recommended for Production)

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Run this command 4 times to generate unique secrets for:
- JWT_SECRET
- JWT_REFRESH_SECRET
- JWT_ACCESS_SECRET
- ENCRYPTION_SECRET

---

## ✅ After Adding Variables

1. Click **"Save Changes"** in Render
2. Render will automatically redeploy
3. Wait 1-2 minutes
4. Check logs for success messages

---

## 🎉 Expected Success Output

```
✅ Connected to MongoDB Atlas
📊 Database: test
🚀 Server running on port 5000
🌍 Environment: production
```

---

## 🧪 Test Your Deployment

Visit your API health endpoint:
```
https://your-app-name.onrender.com/api/health
```

Should return:
```json
{"status":"ok","time":"2025-10-23T..."}
```

---

## 🔄 Update CORS After Frontend Deployment

After deploying your frontend to Firebase:

1. Get your Firebase URLs:
   - `https://your-project-id.web.app`
   - `https://your-project-id.firebaseapp.com`

2. Update CORS_ORIGIN in Render:
   ```
   https://your-project-id.web.app,https://your-project-id.firebaseapp.com
   ```

3. Save changes and redeploy

---

## ⚠️ Security Best Practices

- ✅ Use strong, unique secrets (32+ characters)
- ✅ Never commit `.env` files to Git
- ✅ Use different secrets for dev and production
- ✅ Update CORS_ORIGIN with your actual Firebase URL
- ✅ Use Razorpay LIVE keys in production (after KYC)

---

## 📝 Summary

**Required Variables (4):**
- MONGO_URI
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET (can be same as JWT_SECRET initially)
- ENCRYPTION_SECRET

**Recommended Variables (4):**
- NODE_ENV
- PORT
- JWT_SECRET
- CORS_ORIGIN

**Optional Variables (2):**
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

---

**Total Setup Time:** ~5 minutes

**After this:** Your backend will be live! 🚀

---

*Last Updated: October 23, 2025*

