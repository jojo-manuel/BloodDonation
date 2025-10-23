# Environment Variables Template

## For Development (.env)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=dev-secret-key-12345
JWT_REFRESH_SECRET=dev-refresh-secret-67890
CORS_ORIGIN=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY
RAZORPAY_KEY_SECRET=YOUR_TEST_SECRET
```

## For Production (Render/Railway/Heroku)

### Required Variables

```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_STRONG_SECRET_HERE
CORS_ORIGIN=https://your-project-id.web.app,https://your-project-id.firebaseapp.com
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
```

### Optional Variables

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Generate Secure Secrets

### Mac/Linux
```bash
openssl rand -base64 32
```

### Windows PowerShell
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Online Generator
https://generate-secret.vercel.app/32

## Important Notes

1. **Never commit .env to Git!** (Already in .gitignore)
2. **Use different secrets for dev and production**
3. **CORS_ORIGIN must match your Firebase URL exactly**
4. **Use Razorpay LIVE keys in production (rzp_live_...)**
5. **Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)**

