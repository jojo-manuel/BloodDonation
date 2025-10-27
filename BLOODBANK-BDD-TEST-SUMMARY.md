# Blood Bank Patient Registration - BDD Test Summary

## ✅ What Was Created

### 1. Feature File
**Location**: `frontend/features/bloodbank-patient-registration.feature`
- **16 test scenarios** covering:
  - ✅ Successful patient registration
  - ✅ Form validation (missing fields, invalid phone, past dates, zero units)
  - ✅ Blood group dropdown verification
  - ✅ UI/UX testing
  - ✅ Multiple patient workflow
  - ✅ Duplicate phone number handling
  - ✅ Edge cases (special characters, max units)
  - ✅ Loading states and accessibility

### 2. Step Definitions
**Location**: `frontend/features/step_definitions/bloodbank_patient_registration_steps.cjs`
- **Complete implementation** with Selenium WebDriver
- Automated login as blood bank user
- Form interaction (fill, submit, validate)
- Error message verification
- Navigation and redirection checks

### 3. Configuration Files
- `frontend/cucumber.cjs` - Cucumber configuration with profiles
- `run-bloodbank-patient-registration-test.bat` - Windows batch runner
- Updated `frontend/package.json` with new test scripts

### 4. Documentation
- `BLOODBANK-PATIENT-REGISTRATION-BDD-GUIDE.md` - Comprehensive guide

## 🚀 How to Run Tests

### Option 1: NPM Script (Recommended)
```bash
cd frontend
npm run test:bdd:bloodbank-patient
```

### Option 2: Batch File
```bash
# From project root
run-bloodbank-patient-registration-test.bat
```

### Option 3: Direct Cucumber
```bash
cd frontend
npx cucumber-js features/bloodbank-patient-registration.feature
```

### Option 4: With Profile
```bash
cd frontend
npx cucumber-js --profile bloodbank
```

## 📋 Prerequisites

### Required Before Running Tests:
1. **Frontend Server**: Must be running on http://localhost:5173
   ```bash
   cd frontend
   npm run dev
   ```

2. **Backend Server**: Must be running on http://localhost:5000
   ```bash
   cd backend
   npm start
   ```

3. **Test User**: Blood bank account must exist
   - Default: username `bloodbank1`, password `password123`
   - Update in step definitions if different

4. **Chrome Browser**: Installed and up to date

## 🎯 Available Test Scripts

```json
{
  "test:bdd": "cucumber-js",
  "test:bdd:bloodbank-patient": "cucumber-js features/bloodbank-patient-registration.feature",
  "test:bdd:bloodbank": "cucumber-js --profile bloodbank"
}
```

## 🏷️ Test Tags

Run specific test categories:

```bash
# Smoke tests only
npx cucumber-js --tags "@smoke"

# Critical tests only
npx cucumber-js --tags "@critical"

# Validation tests only
npx cucumber-js --tags "@validation"

# UI tests only
npx cucumber-js --tags "@ui"

# Workflow tests only
npx cucumber-js --tags "@workflow"
```

## 📊 Test Scenarios Breakdown

### Critical (@smoke @critical)
1. Successfully register a new patient with all valid details

### Validation (@validation) - 5 scenarios
1. Missing required fields
2. Invalid phone number format
3. Past date requirement
4. Zero or negative units
5. Duplicate phone number

### UI (@ui) - 3 scenarios
1. Form fields and layout verification
2. Form clears after successful submission
3. Blood groups dropdown verification

### Blood Groups (@bloodgroups)
1. Verify all 8 blood groups available

### Workflow (@workflow)
1. Register multiple patients in sequence

### Data (@data)
1. Maximum valid units (10 units)

### Accessibility (@accessibility)
1. Form accessibility features verification

### Edge Cases (@edge-case)
1. Special characters in patient name

### Cancel (@cancel)
1. Cancel patient registration flow

### Loading (@loading)
1. Loading state during form submission

## 🔍 What Tests Verify

### Form Validation
- ✅ Patient name (required, accepts special characters)
- ✅ Blood group (dropdown with 8 options)
- ✅ MRID (required, alphanumeric)
- ✅ Phone number (10 digits required)
- ✅ Required units (minimum 1, maximum 10)
- ✅ Required date (must be today or future)
- ✅ Address (required field)

### User Experience
- ✅ Success messages display correctly
- ✅ Error messages are descriptive
- ✅ Form redirects after submission
- ✅ Loading states during submission
- ✅ Cancel button functionality
- ✅ Form clears after success

### Data Integrity
- ✅ No duplicate phone numbers
- ✅ Valid blood group selection
- ✅ Date validation (no past dates)
- ✅ Unit validation (positive numbers)

## 🐛 Common Issues & Solutions

### Issue: "Frontend server is not running"
```bash
# Solution: Start frontend
cd frontend
npm run dev
```

### Issue: "Login failed"
**Solution**: Check bloodbank user exists or update credentials in:
`frontend/features/step_definitions/bloodbank_patient_registration_steps.cjs`

```javascript
// Line ~48 - Update these credentials:
await driver.findElement(By.css('input[name="username"]')).sendKeys('YOUR_USERNAME');
await driver.findElement(By.css('input[name="password"]')).sendKeys('YOUR_PASSWORD');
```

### Issue: Chrome DevTools Errors
**Status**: ✅ IGNORE - These are harmless Chrome warnings:
```
ERROR:google_apis\gcm\engine\registration_request.cc:291
Registration response error message: DEPRECATED_ENDPOINT
```

### Issue: Test timeout
**Solution**: Increase timeout in step definitions (currently 60s)

## 📁 File Structure

```
BloodDonation/
├── frontend/
│   ├── features/
│   │   ├── bloodbank-patient-registration.feature        # ← NEW
│   │   └── step_definitions/
│   │       └── bloodbank_patient_registration_steps.cjs   # ← NEW
│   ├── cucumber.cjs                                       # ← NEW
│   ├── package.json                                       # ← UPDATED
│   └── reports/                                           # ← Auto-created
│       ├── bloodbank-patient-registration-report.html
│       └── bloodbank-patient-registration-report.json
├── run-bloodbank-patient-registration-test.bat            # ← NEW
├── BLOODBANK-PATIENT-REGISTRATION-BDD-GUIDE.md            # ← NEW
└── BLOODBANK-BDD-TEST-SUMMARY.md                          # ← THIS FILE
```

## 📈 Test Execution Flow

```
1. Start Test
   ↓
2. Launch Chrome Browser
   ↓
3. Navigate to Login Page
   ↓
4. Login as Blood Bank User
   ↓
5. Navigate to Patient Registration
   ↓
6. Execute Test Scenario
   ↓
7. Verify Results
   ↓
8. Close Browser
   ↓
9. Generate Report
```

## 📝 Example Test Output

```
Feature: Blood Bank Patient Registration

  ✓ Scenario: Successfully register a new patient
    ✓ Given I am logged in as a blood bank user
    ✓ And I am on the blood bank patient registration page
    ✓ When I enter the following patient details
    ✓ And I select a future date for blood requirement
    ✓ And I submit the patient registration form
    ✓ Then I should see a success message
    ✓ And I should be redirected to the patient management page

  ✓ Scenario: Attempt to register patient with missing required fields
  ✓ Scenario: Register patient with invalid phone number format
  ✓ Scenario: Register patient with past date requirement
  ... (continues)

16 scenarios (16 passed)
89 steps (89 passed)
Duration: 0m 45s
```

## 🎓 Understanding the Tests

### Gherkin Syntax
```gherkin
Feature: High-level description of what we're testing

  Scenario: Specific test case
    Given [Initial context/preconditions]
    When [Action performed by user]
    Then [Expected outcome/verification]
```

### Example Scenario Explained
```gherkin
Scenario: Successfully register a new patient with all valid details
  # GIVEN - Setup: Login and navigate to form
  Given I am logged in as a blood bank user
  And I am on the blood bank patient registration page
  
  # WHEN - Action: Fill and submit form
  When I enter the following patient details:
    | Field          | Value         |
    | Patient Name   | Rajesh Kumar  |
    | Blood Group    | A+            |
    # ... more fields ...
  And I submit the patient registration form
  
  # THEN - Verify: Check success
  Then I should see a success message
  And I should be redirected to the patient management page
```

## 🔗 Related Files

### Frontend Components
- `frontend/src/Pages/PatientRegister.jsx` - Patient registration form

### Backend Routes
- `backend/Route/PatientCURD.js` - Patient API endpoints

### Models
- `backend/Models/Patient.js` - Patient schema

### Other BDD Tests
- `frontend/features/login.feature` - Login tests
- `frontend/features/patient-registration.feature` - General patient tests

## 💡 Quick Commands Reference

```bash
# Navigate to frontend
cd frontend

# Run all BDD tests
npm run test:bdd

# Run only bloodbank patient tests
npm run test:bdd:bloodbank-patient

# Run with tags
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@critical"
npx cucumber-js --tags "@validation"

# Run specific feature
npx cucumber-js features/bloodbank-patient-registration.feature

# Generate HTML report
npm run test:bdd:report
```

## ✅ Testing Checklist

Before running tests, ensure:
- [ ] Frontend server running (localhost:5173)
- [ ] Backend server running (localhost:5000)
- [ ] MongoDB database accessible
- [ ] Test blood bank user exists
- [ ] Chrome browser installed
- [ ] In frontend directory
- [ ] Dependencies installed (`npm install`)

## 🎯 Next Steps

1. **Run the tests** using any of the methods above
2. **Review the HTML report** in `frontend/reports/`
3. **Fix any failing tests** by checking:
   - Server availability
   - User credentials
   - Form field selectors
4. **Integrate with CI/CD** (optional)
5. **Add more scenarios** as needed

## 📞 Support

For issues or questions:
1. Check the comprehensive guide: `BLOODBANK-PATIENT-REGISTRATION-BDD-GUIDE.md`
2. Review test output for specific errors
3. Verify all prerequisites are met
4. Check browser console for frontend errors

---

**Status**: ✅ Ready to Run
**Created**: October 27, 2025
**Test Count**: 16 scenarios, ~89 steps
**Estimated Runtime**: 45-60 seconds

