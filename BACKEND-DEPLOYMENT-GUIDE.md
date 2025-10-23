# 🚀 Backend Deployment Guide - Complete Production Setup

## Overview

Deploy your Blood Donation backend to the cloud with MongoDB Atlas, environment variables, and CORS configured for your Firebase frontend.

---

## 🎯 Choose Your Platform

| Platform | Best For | Free Tier | Ease | Build Time |
|----------|----------|-----------|------|------------|
| **Render** | Beginners | ✅ Yes | ⭐⭐⭐⭐⭐ | ~2 min |
| **Railway** | Developers | ✅ Yes | ⭐⭐⭐⭐ | ~2 min |
| **Heroku** | Enterprise | ⚠️ Limited | ⭐⭐⭐ | ~3 min |

**Recommendation:** Start with **Render** - it's the easiest and has the best free tier.

---

# 1️⃣ Render Deployment (Recommended)

## Step-by-Step Guide

### **A. Prepare Your Backend**

1. **Create `.gitignore` in backend folder** (if not exists):
```gitignore
node_modules/
.env
uploads/*
!uploads/.gitkeep
*.log
.DS_Store
```

2. **Create `uploads/.gitkeep`** (to preserve folder structure):
```bash
cd backend
mkdir uploads
touch uploads/.gitkeep
```

3. **Update CORS for Production** (we'll do this later after getting your Firebase URL)

### **B. Push to GitHub**

```bash
# From BloodDonation root directory
git add .
git commit -m "Prepare backend for deployment"
git push origin main
```

### **C. Deploy to Render**

1. **Go to Render:** https://render.com

2. **Sign Up/Login** with GitHub

3. **Click "New +" → "Web Service"**

4. **Connect Your Repository:**
   - Select your BloodDonation repository
   - Click "Connect"

5. **Configure Service:**
   ```
   Name: blood-donation-backend
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: node server.js
   ```

6. **Select Plan:**
   - Choose "Free" tier

7. **Add Environment Variables:**
   
   Click "Advanced" → "Add Environment Variable"
   
   Add these variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   CORS_ORIGIN=https://your-project-id.web.app,https://your-project-id.firebaseapp.com
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
   RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
   ```

8. **Click "Create Web Service"**

9. **Wait for Deployment** (~2-3 minutes)
   - You'll get a URL like: `https://blood-donation-backend.onrender.com`

### **D. Test Your Deployment**

```bash
# Test health endpoint
curl https://your-app.onrender.com/api/health

# Should return:
{"status":"ok","time":"2025-10-23T..."}
```

---

# 2️⃣ Railway Deployment

## Step-by-Step Guide

### **A. Prepare Backend** (same as Render)

### **B. Deploy to Railway**

1. **Go to Railway:** https://railway.app

2. **Sign Up/Login** with GitHub

3. **Click "New Project" → "Deploy from GitHub repo"**

4. **Select Your Repository**

5. **Configure Service:**
   - Railway auto-detects Node.js
   - It will find `backend/package.json`

6. **Add Environment Variables:**
   
   Go to your service → "Variables" tab
   
   Add:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   CORS_ORIGIN=https://your-project-id.web.app,https://your-project-id.firebaseapp.com
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
   RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
   ```

7. **Set Root Directory:**
   - Settings → "Root Directory" → `backend`
   - Start Command → `node server.js`

8. **Generate Domain:**
   - Settings → "Generate Domain"
   - You'll get: `https://your-app.up.railway.app`

9. **Deploy:**
   - Railway auto-deploys on push

---

# 3️⃣ Heroku Deployment

## Step-by-Step Guide

### **A. Install Heroku CLI**

```bash
npm install -g heroku
```

### **B. Login to Heroku**

```bash
heroku login
```

### **C. Create Heroku App**

```bash
cd backend
heroku create blood-donation-backend
```

### **D. Set Environment Variables**

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI="mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"
heroku config:set JWT_SECRET="your-super-secret-jwt-key"
heroku config:set JWT_REFRESH_SECRET="your-super-secret-refresh-key"
heroku config:set CORS_ORIGIN="https://your-project-id.web.app,https://your-project-id.firebaseapp.com"
heroku config:set RAZORPAY_KEY_ID="rzp_live_YOUR_KEY"
heroku config:set RAZORPAY_KEY_SECRET="YOUR_SECRET"
```

### **E. Create Procfile**

Create `backend/Procfile`:
```
web: node server.js
```

### **F. Deploy**

```bash
git add .
git commit -m "Add Procfile for Heroku"
git push heroku main
```

### **G. Open Your App**

```bash
heroku open
```

---

# 🔧 Configure CORS for Firebase

After deploying your frontend to Firebase, you'll get URLs like:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Update Backend CORS

### **Option 1: Update on Hosting Platform**

**Render/Railway:**
1. Go to your service dashboard
2. Environment Variables
3. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-actual-firebase-url.web.app,https://your-actual-firebase-url.firebaseapp.com,http://localhost:5173
   ```
4. Save and redeploy

### **Option 2: Update in Code**

Edit `backend/app.js`:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://your-project-id.web.app',
      'https://your-project-id.firebaseapp.com'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

# 🔐 Production Environment Variables

## Required Variables

```env
# Node Environment
NODE_ENV=production

# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secrets (Generate strong secrets!)
JWT_SECRET=use-openssl-rand-base64-32-to-generate
JWT_REFRESH_SECRET=use-openssl-rand-base64-32-to-generate

# CORS
CORS_ORIGIN=https://your-firebase-app.web.app,https://your-firebase-app.firebaseapp.com

# Razorpay (Production Keys)
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET

# Email (Optional - if using email service)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Firebase (Optional - if using Firebase Admin)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Generate Secure Secrets

**For JWT_SECRET and JWT_REFRESH_SECRET:**

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

# 🔗 Update Frontend API URL

After deploying backend, update your frontend to use the production API.

## Create `frontend/.env.production`

```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
```

## Update `frontend/src/lib/api.js`

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Rebuild and Redeploy Frontend

```bash
cd frontend
npm run build
firebase deploy
```

---

# ✅ Deployment Checklist

## Before Deployment

- [ ] Backend code committed to GitHub
- [ ] `.gitignore` includes `node_modules/`, `.env`, `uploads/*`
- [ ] `uploads/.gitkeep` exists
- [ ] All dependencies in `package.json`
- [ ] MongoDB Atlas database accessible from anywhere (0.0.0.0/0)

## During Deployment

- [ ] Choose hosting platform (Render/Railway/Heroku)
- [ ] Set all environment variables
- [ ] Configure root directory (backend)
- [ ] Set start command (`node server.js`)
- [ ] Wait for successful build

## After Deployment

- [ ] Test health endpoint: `/api/health`
- [ ] Update CORS with Firebase URLs
- [ ] Create `.env.production` in frontend
- [ ] Update frontend API URL
- [ ] Rebuild and redeploy frontend
- [ ] Test login from deployed frontend
- [ ] Test all API endpoints
- [ ] Monitor logs for errors

---

# 🔍 Troubleshooting

## Issue: MongoDB Connection Failed

**Error:** `MongooseServerSelectionError: bad auth`

**Solution:**
1. Check MONGO_URI is correct
2. Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Verify username and password are URL-encoded
4. Check database name is included in URI

## Issue: CORS Error

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS`

**Solution:**
1. Add your Firebase URL to CORS_ORIGIN
2. Ensure `credentials: true` in CORS config
3. Frontend must use `withCredentials: true`
4. Check protocol (http vs https)

## Issue: Environment Variables Not Working

**Error:** `undefined` when accessing `process.env.VARIABLE`

**Solution:**
1. Check variable names match exactly
2. On Render: Dashboard → Environment → Check variables
3. On Railway: Service → Variables → Verify values
4. Redeploy after adding variables
5. Check for typos in variable names

## Issue: App Crashes After Deployment

**Error:** `Application error` or `503 Service Unavailable`

**Solution:**
1. Check logs: `heroku logs --tail` or platform dashboard
2. Verify start command: `node server.js`
3. Check PORT environment variable
4. Ensure all dependencies are installed
5. Look for missing environment variables

## Issue: File Upload Not Working

**Error:** `ENOENT: no such file or directory, open 'uploads/...'`

**Solution:**
1. Ensure `uploads/` folder exists
2. Add `uploads/.gitkeep` to preserve folder
3. On Render: Use cloud storage (AWS S3, Cloudinary)
4. Consider using ephemeral storage warning

---

# 📊 Monitoring & Logs

## Render

**View Logs:**
- Dashboard → Your Service → Logs tab
- Real-time streaming logs

**Metrics:**
- Dashboard → Metrics
- CPU, Memory, Request count

## Railway

**View Logs:**
- Project → Service → Deployments → View Logs
- Filter by error/warning

**Metrics:**
- Service → Metrics
- Usage, Response times

## Heroku

**View Logs:**
```bash
heroku logs --tail
heroku logs --tail --source app
```

**Metrics:**
- Dashboard → Metrics
- Response times, throughput

---

# 🚀 Quick Deploy Commands

## Render
```bash
# Just push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main
# Render auto-deploys
```

## Railway
```bash
# Just push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main
# Railway auto-deploys
```

## Heroku
```bash
git add .
git commit -m "Deploy to production"
git push heroku main
# Or: git push heroku main:main
```

---

# 🎉 Success Indicators

After successful deployment, you should:

1. **✅ See your app running:**
   - Visit: `https://your-backend.onrender.com/api/health`
   - Returns: `{"status":"ok","time":"..."}`

2. **✅ Frontend connects:**
   - Login works from Firebase URL
   - API calls succeed
   - No CORS errors

3. **✅ Database connected:**
   - MongoDB Atlas shows active connections
   - Data persists correctly

4. **✅ Logs are clean:**
   - No error messages
   - Successful MongoDB connection
   - Server running on port

---

# 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

**Your backend is ready for production deployment!** 🚀

Choose your platform and follow the guide above. I recommend starting with **Render** for the easiest setup.

