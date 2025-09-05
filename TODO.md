# TODO: Implement User Registration, Dashboard, and Donor Registration

## Backend Implementation
- [x] Create/update backend/controllers/userController.js for user registration handling
- [x] Create/update backend/controllers/donorController.js for donor registration and search
- [x] Update backend/Route/authRoutes.js to integrate user registration with userController
- [x] Create/update backend/Route/donorRoutes.js for donor registration and search endpoints
- [x] Ensure donor search route returns data in expected format for frontend

## Frontend Implementation
- [x] Update frontend/src/Pages/UserRegister.jsx to integrate with backend registration API and Google OAuth flow
- [ ] Update frontend/src/Pages/UserDashboard.jsx to handle donor search results from backend API
- [ ] Ensure frontend/src/Pages/DonorRegister.jsx submits donor data to backend with authentication
- [ ] Update frontend/src/lib/api.js if needed for new endpoints

## Testing and Validation
- [ ] Test full user registration flow (local username/password)
- [ ] Test Google OAuth registration and login flow
- [ ] Test user dashboard donor search functionality
- [ ] Test donor registration from dashboard
- [ ] Validate error handling and user feedback across all flows

## Additional Tasks
- [x] Ensure user model supports "user" role if needed (currently donor/bloodbank)
- [ ] Handle authentication tokens in frontend for protected routes
- [ ] Implement logout functionality properly
