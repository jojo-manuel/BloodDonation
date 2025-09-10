# Task: Fix Firebase Private Key Parsing Error

## Completed
- [x] Analyzed the error in backend/utils/firebaseAdmin.js
- [x] Created backend/.env with Firebase configuration placeholders
- [x] Updated backend/utils/firebaseAdmin.js to remove incorrect replace(/\\n/g, '\n') and add validation for private_key
- [x] Switched to loading Firebase service account from JSON file to avoid env var formatting issues
- [x] Fixed frontend/src/firebase.js to use Vite environment variables (import.meta.env)
- [x] Created frontend/.env with Vite Firebase configuration placeholders
- [x] Updated FIREBASE_SETUP.md to reflect Vite env vars
- [x] Tested backend server startup - no Firebase private key parsing error
- [x] Tested POST /api/auth/firebase endpoint with invalid and missing tokens - proper error handling
- [x] Verified Firebase Admin SDK initializes correctly with JSON credentials
- [x] Created backend/fixPatientIndexes.js script to fix corrupted Patient indexes
- [x] Ran fixPatientIndexes.js successfully - dropped old encryptedMrid_1 index and created new unique index
- [x] Resolved duplicate MR number error by fixing corrupted unique index on encryptedMrid
- [x] Created backend/allowDuplicateMR.js script to allow duplicate MR numbers
- [x] Ran allowDuplicateMR.js successfully - dropped unique index on mrid field
- [x] MR number duplication is now allowed (non-unique index created for performance)

## Notes
- The fix successfully resolved the "Failed to parse private key: Error: Invalid PEM formatted message" by loading the service account JSON directly instead of using environment variables
- Frontend now uses VITE_ prefixed environment variables for Vite compatibility
- Backend server starts without Firebase errors and handles authentication requests properly
- To complete setup, fill frontend/.env and backend/.env with actual Firebase credentials from Firebase Console
