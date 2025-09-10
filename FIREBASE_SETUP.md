# Firebase Setup Guide for Blood Donation App

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `blood-donation-app` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" as a sign-in provider
5. Configure OAuth consent screen if prompted
6. Add authorized domains:
   - `localhost` (for development)
   - Your production domain (e.g., `yourdomain.com`)

## Step 3: Get Firebase Configuration

1. Go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web app (</>)
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 4: Update Frontend Configuration

Update `frontend/.env` with your Firebase config (using Vite environment variables):

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 5: Set Up Firebase Admin SDK

1. In Firebase Console, go to "Project settings" > "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file (keep it secure!)
4. Extract values from the JSON file

## Step 6: Update Backend Configuration

Update `backend/.env` with your service account credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

## Step 7: Test the Integration

1. Restart your backend server: `cd backend && npm start`
2. Restart your frontend: `cd frontend && npm run dev`
3. Try the "Continue with Firebase" button in the login page
4. Check browser console and backend logs for any errors

## Troubleshooting

### Common Issues:

1. **CONFIGURATION_NOT_FOUND**: Check that your Firebase project exists and Authentication is enabled
2. **Invalid API Key**: Verify the API key in your frontend config
3. **Unauthorized Domain**: Add your domain to authorized domains in Firebase Console
4. **Service Account Issues**: Ensure the service account JSON is correctly formatted in backend .env

### Environment Variables:

Make sure all required environment variables are set:
- Frontend: All `REACT_APP_FIREBASE_*` variables
- Backend: All `FIREBASE_*` variables

### Security Notes:

- Never commit `.env` files to version control
- Keep service account keys secure
- Use different Firebase projects for development and production
