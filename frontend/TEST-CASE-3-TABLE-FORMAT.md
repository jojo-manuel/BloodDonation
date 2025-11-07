# Test Case 3 - Slot Booking Test

**Hope Web - Blood Donor Finding and Donation Automation**

## Test Case Information

| Field | Details |
|-------|---------|
| **Test Case ID** | Test_3 |
| **Test Designed By** | Navyamol K T |
| **Test Priority** | High |
| **Test Designed Date** | 21/10/2025 |
| **Module Name** | UserModule |
| **Test Executed By** | Jojo Manuel P |
| **Test Title** | Slot booking test |
| **Test Execution Date** | 21/10/2025 |
| **Description** | This is conducted to ensure valid booking only happens |
| **Pre-Condition** | User has valid username and password |
| **Post-Condition** | Only valid time are allowed to to book slot |

---

## Test Execution Table

| Step | Test Step | Test Data | Expected Result | Actual Result | Status (Pass/Fail) |
|------|-----------|-----------|-----------------|---------------|---------------------|
| 1 | Logging in to User dashboard | Username: jeevan@gmail.com<br>Password: Jeevan@123! | Login successful | Login successful | **Pass** |
| 2 | Click On myrequest | - | List of received request shown and request is accepted | List of received request shown | **Pass** |
| 3 | Click on Received request | - | Received requests displayed | Received requests displayed | **Pass** |
| 4 | Click on accept | - | Request accepted successfully | Request accepted successfully | **Pass** |
| 5 | Click on book slot | - | Booking form displayed | Booking form displayed | **Pass** |
| 6 | Enter date and time | Date: 17/09/2000<br>Time: 12.00 AM | Booking successful | Booking Failed | **Fail** |
| 7 | Click on book slot | - | Booking form displayed | Booking form displayed | **Pass** |
| 8 | Enter date and time | Date: 20/10/2025<br>Time: 12.00 PM | Booking successful | Booking successful | **Pass** |

---

## Summary

- **Total Steps:** 8
- **Passed:** 7
- **Failed:** 1
- **Pass Rate:** 87.5%

**Note:** Step 6 failure is expected behavior - system correctly validates and rejects past dates.

