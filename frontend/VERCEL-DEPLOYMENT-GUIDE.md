# 🚀 Vercel Deployment Guide - Blood Donation Frontend

## ✅ Files Created
- `vercel.json` - Configuration for SPA routing (fixes 404 errors)

## 📋 Deployment Steps

### Step 1: Push to Git
```bash
git add frontend/vercel.json
git commit -m "Add Vercel configuration for SPA routing"
git push
```

### Step 2: Configure Environment Variables in Vercel

**IMPORTANT:** You must add your backend API URL as an environment variable.

1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

   **Key:** `VITE_API_URL`
   
   **Value:** Your backend URL (examples below)
   - If backend is on Render: `https://your-backend.onrender.com`
   - If backend is on Railway: `https://your-backend.up.railway.app`
   - If backend is on Vercel: `https://your-backend.vercel.app`
   - If backend is elsewhere: `https://your-backend-domain.com`

   **Environments:** Check all (Production, Preview, Development)

5. Click **Save**

### Step 3: Redeploy

After adding environment variables, you MUST redeploy:

**Option A: Automatic Redeploy**
- Go to **Deployments** tab
- Click the three dots on the latest deployment
- Click **Redeploy**

**Option B: Push a New Commit**
- Make any small change and push to trigger a new deployment

### Step 4: Verify Deployment

Once deployed, test these scenarios:
1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Navigate to different pages (login, register, dashboard)
3. Refresh the page on any route - should NOT show 404
4. Check browser console for API connection

---

## 🔧 Troubleshooting

### Still Getting 404 Errors?

**Solution 1: Ensure vercel.json is in the correct location**
- The `vercel.json` file should be in the `frontend/` directory
- If you deployed from the root directory, move `vercel.json` to the root

**Solution 2: Check build settings in Vercel**
- Root Directory: `frontend` (if deploying from monorepo)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### CORS Errors?

Your backend needs to allow requests from your Vercel domain:

```javascript
// In your backend (server.js or similar)
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app',  // Add your Vercel URL
  ],
  credentials: true
}));
```

### API Calls Failing?

1. **Check Environment Variable:**
   ```bash
   # In Vercel deployment logs, you should see:
   # VITE_API_URL=https://your-backend.com
   ```

2. **Check Network Tab in Browser:**
   - Open Developer Tools → Network
   - Try an API call
   - Check if it's calling the correct backend URL

3. **Backend CORS Configuration:**
   - Ensure your backend allows your Vercel domain
   - Check backend logs for CORS errors

### Functions Timing Out?

If you see `FUNCTION_INVOCATION_TIMEOUT`:
- This usually means backend is slow or unreachable
- Check if your backend is running
- Verify the backend URL is correct

---

## 📝 Backend Deployment Status

**Where is your backend deployed?**

If you haven't deployed your backend yet, you'll need to:

1. **Deploy Backend First** (choose one):
   - [Render](https://render.com) - Free tier available
   - [Railway](https://railway.app) - Free tier available  
   - [Vercel](https://vercel.com) - Serverless functions
   - [Heroku](https://heroku.com) - Paid only

2. **Update VITE_API_URL** in Vercel with your backend URL

3. **Update Backend CORS** to allow your Vercel frontend URL

---

## ✨ What the vercel.json File Does

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel:
- **All routes** (`/(.*)`) should be handled by `index.html`
- This allows React Router to handle routing client-side
- Fixes 404 errors when refreshing pages or direct URL access

---

## 🎯 Quick Checklist

- [ ] `vercel.json` created in `frontend/` directory
- [ ] Code pushed to Git
- [ ] `VITE_API_URL` environment variable added in Vercel
- [ ] Project redeployed after adding environment variables
- [ ] Backend is deployed and accessible
- [ ] Backend CORS configured for Vercel URL
- [ ] Tested: Home page loads
- [ ] Tested: Can navigate to different routes
- [ ] Tested: Refreshing routes doesn't show 404
- [ ] Tested: API calls work correctly

---

## 🆘 Need More Help?

**Common Error Codes:**
- `404 NOT_FOUND` → Fixed by `vercel.json` rewrites
- `CORS Error` → Backend needs to allow your Vercel URL
- `Failed to fetch` → Check `VITE_API_URL` environment variable
- `500 FUNCTION_INVOCATION_FAILED` → Backend error or timeout

**Check Logs:**
1. Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. View **Build Logs** (for build errors)
4. View **Function Logs** (for runtime errors)

If you see other errors, share the error code and I'll help you fix it!

