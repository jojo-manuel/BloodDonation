# 🚀 Production Deployment Checklist

Complete guide to deploy your Blood Donation App to production.

---

## 📋 Pre-Deployment Checklist

### Backend Preparation

- [ ] All code committed to GitHub
- [ ] `.gitignore` includes `node_modules/`, `.env`, `uploads/*`
- [ ] `uploads/.gitkeep` exists (to preserve folder structure)
- [ ] MongoDB Atlas configured with proper user and database
- [ ] MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- [ ] All environment variables documented in `ENV_TEMPLATE.md`
- [ ] CORS updated to support production URLs
- [ ] Strong JWT secrets generated for production
- [ ] Razorpay account created and KYC completed (for live keys)

### Frontend Preparation

- [ ] Firebase project created
- [ ] `firebase.json` configured with `"public": "dist"`
- [ ] `.env.production` created with production values
- [ ] All API calls use environment variables
- [ ] Build tested locally (`npm run build && npm run preview`)
- [ ] All linter errors fixed
- [ ] Dark mode tested and working

---

## 🎯 Step-by-Step Deployment

### Phase 1: Deploy Backend (Choose One)

#### Option A: Render (Recommended)

1. **Sign up:** https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Configure:**
   - Name: `blood-donation-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free
4. **Add Environment Variables** (see ENV_TEMPLATE.md)
5. **Deploy** → Wait 2-3 minutes
6. **Copy URL:** `https://your-app.onrender.com`

#### Option B: Railway

1. **Sign up:** https://railway.app
2. **New Project** → Deploy from GitHub
3. **Settings:**
   - Root Directory: `backend`
   - Start Command: `node server.js`
4. **Add Environment Variables**
5. **Generate Domain** → Copy URL

#### Option C: Heroku

1. **Install CLI:** `npm install -g heroku`
2. **Login:** `heroku login`
3. **Create app:** `cd backend && heroku create blood-donation-backend`
4. **Set env vars:** `heroku config:set VAR=value`
5. **Create Procfile:** `echo "web: node server.js" > Procfile`
6. **Deploy:** `git push heroku main`

---

### Phase 2: Update CORS for Firebase

After backend deployment:

1. **Get your backend URL** (e.g., `https://your-app.onrender.com`)

2. **Deploy frontend to get Firebase URL:**
   ```bash
   cd frontend
   npm run build
   firebase deploy
   ```

3. **Copy your Firebase URLs:**
   - `https://your-project-id.web.app`
   - `https://your-project-id.firebaseapp.com`

4. **Update backend CORS:**
   - Go to backend hosting platform (Render/Railway/Heroku)
   - Environment Variables → Update `CORS_ORIGIN`:
     ```
     CORS_ORIGIN=https://your-project-id.web.app,https://your-project-id.firebaseapp.com,http://localhost:5173
     ```
   - Save and redeploy

---

### Phase 3: Configure Frontend for Production

1. **Create `.env.production` in frontend folder:**
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
   ```

2. **Test build locally:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

3. **Open preview URL** and test:
   - Login functionality
   - API calls
   - Payment flow
   - All features

---

### Phase 4: Deploy Frontend to Firebase

1. **Ensure Firebase Tools installed:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Build and deploy:**
   ```bash
   cd frontend
   npm run build
   firebase deploy
   ```

4. **Copy deployment URLs:**
   - `https://your-project-id.web.app`
   - `https://your-project-id.firebaseapp.com`

---

### Phase 5: Final Configuration

1. **Update backend CORS** (if not done in Phase 2)

2. **Test production deployment:**
   - Visit: `https://your-project-id.web.app`
   - Test login
   - Test all features
   - Check browser console for errors
   - Test on mobile devices

3. **Update Razorpay webhook** (if using):
   - Razorpay Dashboard → Webhooks
   - Add: `https://your-backend.onrender.com/api/razorpay/webhook`

4. **Configure MongoDB Atlas IP whitelist:**
   - Add `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs from Render/Railway/Heroku

---

## ✅ Post-Deployment Verification

### Backend Health Check

```bash
# Test health endpoint
curl https://your-backend.onrender.com/api/health

# Expected response:
{"status":"ok","time":"2025-10-23T..."}
```

### Frontend Verification

- [ ] Website loads successfully
- [ ] Login works
- [ ] Dashboard loads
- [ ] Donor search works
- [ ] Blood bank search works
- [ ] Request sending works
- [ ] Booking works
- [ ] Taxi booking works (if enabled)
- [ ] Settings save correctly
- [ ] Profile updates work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode works

### API Verification

- [ ] CORS headers correct
- [ ] Authentication works
- [ ] Database queries succeed
- [ ] File uploads work (if applicable)
- [ ] Email sending works (if configured)
- [ ] Razorpay test payment works

---

## 🔐 Security Checklist

- [ ] JWT secrets are strong and unique (32+ characters)
- [ ] `.env` files not committed to Git
- [ ] MongoDB uses strong password
- [ ] MongoDB Atlas IP whitelist configured
- [ ] HTTPS enabled (automatic on Firebase/Render/Railway)
- [ ] CORS only allows your domains
- [ ] Razorpay live keys used in production
- [ ] Sensitive data encrypted in database
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers active

---

## 📊 Environment Variables Summary

### Backend (Render/Railway/Heroku)

```
✅ NODE_ENV=production
✅ PORT=5000
✅ MONGO_URI=mongodb+srv://...
✅ JWT_SECRET=<strong-secret>
✅ JWT_REFRESH_SECRET=<strong-secret>
✅ CORS_ORIGIN=https://your-app.web.app,https://your-app.firebaseapp.com
✅ RAZORPAY_KEY_ID=rzp_live_...
✅ RAZORPAY_KEY_SECRET=<secret>
```

### Frontend (.env.production)

```
✅ VITE_API_URL=https://your-backend.onrender.com
✅ VITE_RAZORPAY_KEY_ID=rzp_live_...
```

---

## 🐛 Troubleshooting

### Issue: CORS Error

**Symptom:** Browser console shows CORS blocked

**Fix:**
1. Update `CORS_ORIGIN` in backend environment variables
2. Include both Firebase URLs (web.app and firebaseapp.com)
3. Redeploy backend

### Issue: API calls fail

**Symptom:** Network errors, 404s

**Fix:**
1. Check `VITE_API_URL` in `.env.production`
2. Verify backend is running (visit `/api/health`)
3. Check browser network tab for actual URL being called
4. Rebuild frontend: `npm run build && firebase deploy`

### Issue: MongoDB connection failed

**Symptom:** Backend logs show MongoDB errors

**Fix:**
1. Check `MONGO_URI` is correct
2. Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
3. Test connection from hosting platform's IP
4. Check username/password

### Issue: Login not working

**Symptom:** Login fails, returns 401

**Fix:**
1. Check JWT secrets are set
2. Verify MongoDB is connected
3. Check user exists in database
4. Test with Postman first
5. Check browser console for errors

### Issue: Razorpay payment fails

**Symptom:** Payment popup doesn't open or fails

**Fix:**
1. Use Razorpay LIVE keys in production
2. Complete KYC on Razorpay dashboard
3. Check `VITE_RAZORPAY_KEY_ID` in frontend
4. Verify webhook URL in Razorpay dashboard

---

## 📝 Deployment Commands Quick Reference

### Build Frontend
```bash
cd frontend
npm run build
```

### Deploy Frontend
```bash
cd frontend
firebase deploy
```

### View Backend Logs (Render)
- Dashboard → Service → Logs

### View Backend Logs (Railway)
- Project → Service → Deployments → View Logs

### View Backend Logs (Heroku)
```bash
heroku logs --tail
```

### Redeploy Backend (Render/Railway)
- Push to GitHub → Auto-deploy

### Redeploy Backend (Heroku)
```bash
git push heroku main
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Frontend loads at Firebase URL  
✅ Backend API responds to health check  
✅ CORS allows Firebase domain  
✅ Users can login successfully  
✅ Dashboard loads with data  
✅ All features work as expected  
✅ No console errors  
✅ Mobile responsive  
✅ HTTPS enabled everywhere  
✅ Production environment variables set  

---

## 📚 Documentation Links

- [BACKEND-DEPLOYMENT-GUIDE.md](./BACKEND-DEPLOYMENT-GUIDE.md) - Detailed backend deployment
- [FIREBASE-DEPLOYMENT-GUIDE.md](./FIREBASE-DEPLOYMENT-GUIDE.md) - Detailed frontend deployment
- [ENV_TEMPLATE.md](./backend/ENV_TEMPLATE.md) - Environment variables template
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [MongoDB Atlas](https://docs.atlas.mongodb.com)

---

**Ready to deploy? Start with Phase 1! 🚀**

*Last Updated: October 23, 2025*

