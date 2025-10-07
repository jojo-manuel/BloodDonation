# Firebase Integration Tasks

## Overview
Update Firebase Admin SDK service account credentials in the backend and synchronize frontend Firebase client configuration with the new Firebase project.

## Tasks
- [ ] Replace backend/config/firebase-service-account.json with new service account JSON
- [ ] Update backend/utils/firebaseAdmin.js to load credentials from environment variables for better security
- [ ] Update backend/config/env.js to include Firebase-related environment variables
- [ ] Update frontend/src/firebase.js with new Firebase project configuration
- [ ] Verify backend/controllers/authController.js for Firebase Admin SDK usage
- [ ] Test Firebase authentication integration

## Files to Edit
- backend/config/firebase-service-account.json
- backend/utils/firebaseAdmin.js
- backend/config/env.js
- frontend/src/firebase.js
- backend/controllers/authController.js (if needed)

## Follow-up Steps
- Restart backend server after changes
- Restart frontend development server
- Test Firebase authentication flow
- Verify backend Firebase Admin SDK functionality
