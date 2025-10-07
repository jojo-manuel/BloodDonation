# Activity Logging Implementation Plan

## Current Work
Implementing an audit log system to track activities by users, admins, and blood banks.

## Key Technical Concepts
- MongoDB/Mongoose model for Activity logs.
- Logging in controllers using asyncHandler for error handling.
- Admin-only route for fetching logs using authMiddleware and roles.

## Relevant Files and Code
- New: backend/Models/Activity.js - Schema for logs.
- backend/controllers/authController.js - Add logging for register and login.
- backend/controllers/userController.js - Add logging for requestDonation, directBookSlot, getMyRequests, etc.
- backend/controllers/bloodBankController.js - Add logging for createBooking, getBookingsForBloodBank.
- backend/controllers/adminController.js - Add logging for status changes if applicable.
- backend/Route/adminRoutes.js - Add GET /activities endpoint.

## Problem Solving
- Ensure logs are created after successful operations to avoid logging failed actions.
- Use req.user.id for userId in authenticated routes.
- For register, log after user creation.

## Pending Tasks and Next Steps
1. Create backend/Models/Activity.js model. (Next: Use create_file)
   - Schema: userId (ref User), role (string), action (string), timestamp (Date, default now), details (Schema.Types.Mixed, optional).

2. Edit backend/controllers/authController.js to log 'register' and 'login' actions.
   - In register route, after user.save(), create Activity log.
   - In login route, after token generation, create Activity log.

3. Edit backend/controllers/userController.js to log relevant actions (e.g., 'donation_request_sent' in requestDonation, 'slot_booked' in directBookSlot).

4. Edit backend/controllers/bloodBankController.js to log 'booking_created' in createBooking.

5. Edit backend/Route/adminRoutes.js to add GET /activities route, protected by admin role, populate userId.

6. Test: Perform actions (register, login, request donation), then use admin endpoint to fetch and verify logs.

Quote from recent conversation: "yes" - User approved the plan to proceed.
