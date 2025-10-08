# TODO: Implement Update Status for Sent Requests in UserDashboard

## Completed Tasks
- [x] Add updateStatus function in donationRequestController.js
- [x] Add PUT route /requests/:id/status in donorRoutes.js
- [x] Add state variables (updatingId, newStatuses) in UserDashboard.jsx
- [x] Add handleStatusChange and handleUpdateStatus functions in UserDashboard.jsx
- [x] Add "Update Status" column header in sent requests table
- [x] Add select dropdown and update button in sent requests table rows

## Summary
Users can now access the "My Requests" tab in the UserDashboard, view sent requests to donors, and update the status using a dropdown and update button. The backend validates that only the sender or receiver can update the status, and supports status transitions like pending, pending_booking, accepted, rejected, booked.
