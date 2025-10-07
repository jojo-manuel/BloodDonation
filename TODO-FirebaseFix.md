# TODO: Fix Google Sign-in with Firebase and Redirection

## Backend Changes
- [x] Update /api/auth/firebase endpoint in backend/Route/authRoutes.js
  - [x] Include isSuspended, isBlocked, warningMessage in user data response
  - [x] Add blood bank rejection status check for bloodbank users

## Frontend Changes
- [x] Clean up duplicate route definitions in frontend/src/App.jsx
- [x] Verify Login.jsx handles user status fields correctly for redirection

## Testing
- [ ] Test Firebase Google sign-in flow
- [ ] Verify proper redirection to dashboard based on user role and status
