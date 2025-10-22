# TODO: Add Received Requests Section to UserDashboard

## Steps to Complete:
- [x] Add state variable `receivedRequests` to hold received requests data
- [x] Add `fetchReceivedRequests` function to fetch received requests from backend API
- [x] Update `useEffect` to call `fetchReceivedRequests` when "myRequests" tab is active
- [x] Add a new section in the "myRequests" tab for displaying received requests
- [x] Display received requests in a table format similar to sent requests
- [x] Test the implementation to ensure received requests are displayed correctly

## Dependent Files:
- frontend/src/Pages/UserDashboard.jsx

## Followup Steps:
- Verify that the received requests are fetched and displayed properly
- Ensure the UI is consistent with the existing sent requests section
