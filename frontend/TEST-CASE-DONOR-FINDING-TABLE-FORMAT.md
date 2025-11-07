# Test Case - Donor Finding Test

**Hope Web - Blood Donor Finding and Donation Automation**

## Test Case Information

| Field | Details |
|-------|---------|
| **Test Case ID** | Test_Donor_Finding |
| **Test Designed By** | Test Team |
| **Test Priority** | High |
| **Test Designed Date** | 21/10/2025 |
| **Module Name** | UserModule |
| **Test Executed By** | Jojo Manuel P |
| **Test Title** | Donor finding test |
| **Test Execution Date** | 21/10/2025 |
| **Description** | This is conducted to ensure donor search and finding functionality works correctly |
| **Pre-Condition** | User has valid username and password, User is logged into dashboard |
| **Post-Condition** | Donors are displayed based on search criteria, Search results are accurate |

---

## Test Execution Table

| Step | Test Step | Test Data | Expected Result | Actual Result | Status (Pass/Fail) |
|------|-----------|-----------|-----------------|---------------|---------------------|
| 1 | Navigate to User Dashboard | User logged in with valid credentials | User dashboard displayed | User dashboard displayed | **Pass** |
| 2 | Access donor search/find page | - | Donor search interface displayed | Donor search interface displayed | **Pass** |
| 3 | List donors on the find page | Mock data: Alice Donor (O+), Bob Donor (A+) | List of donors displayed (Alice Donor, Bob Donor) | List of donors displayed | **Pass** |
| 4 | Search donors by blood group | Blood Group: O+<br>Location: Kochi | Donors with O+ blood group in Kochi displayed (Alice Donor, Oscar Donor) | Donors with O+ blood group displayed | **Pass** |
| 5 | Search donors by location | Location: Kochi | Donors in Kochi location displayed | Donors in Kochi location displayed | **Pass** |
| 6 | Test empty state when no donors match | Search with filters that match no donors | Empty state message displayed ("No donors", "No results", or "not found") | Empty state message displayed | **Pass** |
| 7 | Find donors using MRID quick search | MRID: MR123<br>Patient: John Patient (O+) | Donor found: Mira Donor (O+) | Donor found successfully | **Pass** |
| 8 | Verify search results accuracy | Multiple search criteria tested | Search results match the search criteria | Search results match criteria | **Pass** |

---

## Summary

- **Total Steps:** 8
- **Passed:** 8
- **Failed:** 0
- **Pass Rate:** 100%

**Note:** All donor finding functionality tests passed successfully. The system correctly displays donors, handles search filters, shows empty states, and supports MRID-based quick search.

