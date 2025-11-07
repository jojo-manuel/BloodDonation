# Troubleshooting: "Route not found" Error on Vercel

## Quick Diagnosis Steps

### Step 1: Check Browser Console
1. Open your deployed site on Vercel
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for these logs:

```
🔧 API Configuration:
  API URL: [should show your backend URL, NOT localhost]
  Base URL: [should show your backend URL + /api]
  VITE_API_URL env: [should show your backend URL, NOT "NOT SET"]
```

**If you see:**
- `API URL: http://localhost:5000` → **VITE_API_URL is NOT set**
- `VITE_API_URL env: NOT SET` → **VITE_API_URL is NOT set**

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Try to perform an action (login, navigate, etc.)
3. Look for failed requests (red)
4. Click on a failed request
5. Check the **Request URL** - it should point to your backend, not your frontend

**If you see:**
- `https://your-frontend.vercel.app/api/...` → **WRONG** (API URL not set)
- `https://your-backend.vercel.app/api/...` → **CORRECT**

## Solution

### Fix 1: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Add Environment Variable**
   - Click **Add New**
   - **Key:** `VITE_API_URL`
   - **Value:** Your backend API URL (e.g., `https://your-backend-api.vercel.app`)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on latest deployment
   - Click **Redeploy**
   - OR push a new commit to trigger redeploy

### Fix 2: Verify Backend API is Running

1. **Test Backend Directly**
   - Open: `https://your-backend-api.vercel.app/api/health` (or similar endpoint)
   - Should return JSON response, not 404

2. **Check Backend Routes**
   - Ensure your backend has all required routes:
     - `/api/auth/login`
     - `/api/auth/refresh`
     - `/api/donors/*`
     - `/api/users/*`
     - etc.

3. **Check CORS**
   - Backend must allow your frontend domain
   - Add to backend CORS config:
     ```javascript
     origin: ['https://your-frontend.vercel.app']
     ```

## Common Issues

### Issue 1: Environment Variable Not Set
**Symptom:** Console shows `VITE_API_URL env: NOT SET`

**Solution:** Set `VITE_API_URL` in Vercel (see Fix 1 above)

### Issue 2: Wrong API URL
**Symptom:** API calls go to frontend domain instead of backend

**Solution:** 
- Check `VITE_API_URL` value in Vercel
- Should be your backend URL, not frontend URL
- Should NOT include `/api` at the end (code adds it automatically)

### Issue 3: Backend Not Deployed
**Symptom:** All API calls return 404 or "Route not found"

**Solution:**
- Deploy your backend API
- Verify it's accessible
- Test endpoints directly

### Issue 4: CORS Error
**Symptom:** Browser console shows CORS errors

**Solution:**
- Update backend CORS to include frontend domain
- Check backend allows credentials if using cookies

## Verification Checklist

After setting `VITE_API_URL` and redeploying:

- [ ] Environment variable is set in Vercel
- [ ] Frontend has been redeployed
- [ ] Browser console shows correct API URL (not localhost)
- [ ] Network tab shows API calls going to backend
- [ ] Backend API is deployed and accessible
- [ ] Backend CORS allows frontend domain
- [ ] No "Route not found" errors in console

## Still Having Issues?

1. **Check Enhanced Logs**
   - The updated `api.js` now logs all requests/responses
   - Check browser console for detailed error messages
   - Look for: `🚨 ROUTE NOT FOUND DETAILS:`

2. **Test Backend Directly**
   ```bash
   curl https://your-backend-api.vercel.app/api/health
   ```

3. **Check Vercel Function Logs**
   - Vercel Dashboard → Your Project → Functions
   - Check for any backend errors

4. **Verify Build Output**
   - Check that `dist/` folder contains built files
   - Verify `index.html` exists

## Example Correct Configuration

**Vercel Environment Variable:**
```
VITE_API_URL = https://blood-donation-api.vercel.app
```

**Expected Console Output:**
```
🔧 API Configuration:
  API URL: https://blood-donation-api.vercel.app
  Base URL: https://blood-donation-api.vercel.app/api
  VITE_API_URL env: https://blood-donation-api.vercel.app
```

**Expected Network Request:**
```
GET https://blood-donation-api.vercel.app/api/auth/login
```

---

**Last Updated:** After adding enhanced logging to `api.js`

