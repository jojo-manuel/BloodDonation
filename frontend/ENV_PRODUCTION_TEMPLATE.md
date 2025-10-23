# Frontend Production Environment Variables

## Create `.env.production` in frontend folder

```env
# Backend API URL (from Render/Railway/Heroku)
VITE_API_URL=https://your-backend-app.onrender.com

# Razorpay Live Key (for production payments)
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
```

## Steps to Configure

1. **Get your backend URL** after deploying to Render/Railway/Heroku
   - Example: `https://blood-donation-backend.onrender.com`

2. **Get Razorpay live keys**
   - Login to: https://dashboard.razorpay.com
   - Navigate to: Settings → API Keys
   - Generate Live Keys (after completing KYC)

3. **Create the file**
   ```bash
   cd frontend
   # Create .env.production file
   echo "VITE_API_URL=https://your-backend.onrender.com" > .env.production
   echo "VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY" >> .env.production
   ```

4. **Rebuild and deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## Verify Configuration

After deployment, check browser console:

```javascript
// Should show production URL
console.log(import.meta.env.VITE_API_URL);
// Output: https://your-backend.onrender.com

// Should show live key
console.log(import.meta.env.VITE_RAZORPAY_KEY_ID);
// Output: rzp_live_xxxxx
```

## Important Notes

- ⚠️ Never commit `.env.production` to Git!
- ✅ Already in .gitignore
- ✅ Only use live keys in production
- ✅ Rebuild frontend after changing environment variables

