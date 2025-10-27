# Blood Bank Patient Registration BDD Testing Guide

## Overview
This guide covers BDD (Behavior-Driven Development) testing for the Blood Bank Patient Registration feature using Cucumber and Selenium WebDriver.

## 📋 Prerequisites

### 1. Required Software
- **Node.js** (v14 or higher)
- **Chrome Browser** (for Selenium WebDriver)
- **MongoDB** (running locally or remote)

### 2. Servers Must Be Running
- **Frontend Server**: http://localhost:5173
- **Backend Server**: http://localhost:5000

### 3. Test Data Requirements
- A valid blood bank user account:
  - Username: `bloodbank1`
  - Password: `password123`
  - (Or update credentials in step definitions)

## 🚀 Quick Start

### Method 1: Using Batch File (Recommended)
```bash
# From project root directory
run-bloodbank-patient-registration-test.bat
```

### Method 2: Using NPM Scripts
```bash
# Navigate to frontend directory
cd frontend

# Run bloodbank patient registration tests
npm run test:bdd:bloodbank-patient

# Or using profile
npm run test:bdd:bloodbank
```

### Method 3: Direct Cucumber Command
```bash
cd frontend
npx cucumber-js features/bloodbank-patient-registration.feature
```

## 📁 File Structure

```
BloodDonation/
├── frontend/
│   ├── features/
│   │   ├── bloodbank-patient-registration.feature    # Feature file
│   │   └── step_definitions/
│   │       └── bloodbank_patient_registration_steps.cjs  # Step definitions
│   ├── cucumber.js                                    # Cucumber configuration
│   └── package.json                                   # NPM scripts
└── run-bloodbank-patient-registration-test.bat       # Test runner script
```

## 🧪 Test Scenarios

### Critical Tests (@critical)
1. ✅ Successfully register a new patient with all valid details
2. ✅ Verify form submission and redirection

### Validation Tests (@validation)
1. ❌ Missing required fields
2. ❌ Invalid phone number format (less than 10 digits)
3. ❌ Past date selection
4. ❌ Zero or negative units
5. ❌ Duplicate phone number

### UI Tests (@ui)
1. 🎨 Form fields and layout verification
2. 🎨 Blood group dropdown options
3. 🎨 Form clears after submission

### Workflow Tests (@workflow)
1. 🔄 Register multiple patients in sequence
2. 🔄 Cancel registration flow

### Edge Cases (@edge-case)
1. 🔍 Special characters in patient name
2. 🔍 Maximum valid units
3. 🔍 Loading state during submission

## 📝 Feature File Details

### Location
`frontend/features/bloodbank-patient-registration.feature`

### Key Scenarios

#### Scenario 1: Successful Registration
```gherkin
Scenario: Successfully register a new patient with all valid details
  When I enter the following patient details:
    | Field           | Value              |
    | Patient Name    | Rajesh Kumar       |
    | Blood Group     | A+                 |
    | MRID            | MR2024001          |
    | Phone Number    | 9876543210         |
    | Required Units  | 2                  |
    | Address         | 123 MG Road, Kochi |
  And I select a future date for blood requirement
  And I submit the patient registration form
  Then I should see a success message "Patient registered successfully"
```

#### Scenario 2: Validation Testing
```gherkin
Scenario: Register patient with invalid phone number format
  When I enter patient details with phone "12345"
  Then I should see an error message about invalid phone number format
```

## 🎯 Running Specific Test Tags

### Run Smoke Tests Only
```bash
cd frontend
npx cucumber-js --tags "@smoke"
```

### Run Critical Tests Only
```bash
npx cucumber-js --tags "@critical"
```

### Run Validation Tests Only
```bash
npx cucumber-js --tags "@validation"
```

### Run UI Tests Only
```bash
npx cucumber-js --tags "@ui"
```

### Exclude Specific Tags
```bash
npx cucumber-js --tags "not @skip"
```

## 🔧 Configuration

### Cucumber Configuration (`frontend/cucumber.js`)
```javascript
module.exports = {
  bloodbank: {
    require: ['features/step_definitions/bloodbank_patient_registration_steps.cjs'],
    format: [
      'progress-bar',
      'html:reports/bloodbank-patient-registration-report.html',
      'json:reports/bloodbank-patient-registration-report.json'
    ],
    paths: ['features/bloodbank-patient-registration.feature'],
    publishQuiet: true,
  }
};
```

### Timeout Settings
- Default timeout: **60 seconds** (configured in step definitions)
- Can be adjusted in `bloodbank_patient_registration_steps.cjs`

## 📊 Test Reports

### HTML Report
After running tests, an HTML report is generated:
- **Location**: `frontend/reports/bloodbank-patient-registration-report.html`
- **Opens automatically**: If using the batch file

### JSON Report
Raw test data in JSON format:
- **Location**: `frontend/reports/bloodbank-patient-registration-report.json`

### Console Output
- **Progress bar**: Shows real-time test execution
- **Summary**: Total scenarios, passed, failed, skipped
- **Execution time**: Per scenario and total

## 🔑 Test Data

### Valid Test Data
```javascript
Patient Name:    Rajesh Kumar
Blood Group:     A+, A-, B+, B-, O+, O-, AB+, AB-
MRID:           MR2024001 (alphanumeric)
Phone Number:   9876543210 (10 digits)
Required Units: 1-10
Required Date:  Future date (today or later)
Address:        Any valid address
```

### Invalid Test Data
```javascript
Phone Number:   12345 (less than 10 digits)
Required Units: 0 or negative
Required Date:  Past date
```

## 🐛 Troubleshooting

### Issue 1: "Frontend server is not running"
**Solution:**
```bash
# Start frontend server
cd frontend
npm run dev
```

### Issue 2: "Backend server is not running"
**Solution:**
```bash
# Start backend server
cd backend
npm start
```

### Issue 3: "Login failed - bloodbank1 not found"
**Solution:**
1. Check database for user:
   ```javascript
   db.users.findOne({ username: "bloodbank1" })
   ```
2. Create user if not exists:
   ```bash
   # Use registration endpoint or admin panel
   ```
3. Update credentials in step definitions:
   ```javascript
   // In bloodbank_patient_registration_steps.cjs
   await driver.findElement(By.css('input[name="username"]')).sendKeys('YOUR_USERNAME');
   await driver.findElement(By.css('input[name="password"]')).sendKeys('YOUR_PASSWORD');
   ```

### Issue 4: "Element not found" errors
**Solution:**
- Ensure the frontend is fully loaded before tests run
- Increase wait times in step definitions if needed
- Check that selectors match the actual form elements

### Issue 5: ChromeDriver version mismatch
**Solution:**
```bash
cd frontend
npm install selenium-webdriver@latest
```

### Issue 6: Tests running but browser not visible
**Solution:**
- Comment out headless mode in step definitions:
```javascript
// chromeOptions.addArguments('--headless');
```

## 📈 Best Practices

### 1. Test Isolation
- Each test scenario should be independent
- Clean up test data after tests (if needed)
- Use unique identifiers for test data

### 2. Explicit Waits
- Use `driver.wait()` for dynamic content
- Avoid `driver.sleep()` except for brief pauses
- Wait for elements to be clickable before clicking

### 3. Descriptive Scenarios
- Use clear, business-readable language
- Follow Given-When-Then structure
- Tag scenarios appropriately

### 4. Error Handling
- Wrap critical operations in try-catch blocks
- Provide meaningful error messages
- Take screenshots on failure (can be added)

## 🎓 Understanding BDD

### What is BDD?
Behavior-Driven Development uses natural language to describe application behavior in a way that's understandable by both technical and non-technical stakeholders.

### Gherkin Syntax
```gherkin
Feature: High-level description
  
  Scenario: What we're testing
    Given [Initial context]
    When [Action performed]
    Then [Expected outcome]
```

### Step Definitions
JavaScript/Node.js code that implements the steps described in the feature file.

## 📞 Support

### Common Commands Reference
```bash
# Install dependencies
cd frontend
npm install

# Run all BDD tests
npm run test:bdd

# Run specific feature
npm run test:bdd:bloodbank-patient

# Run with tags
npx cucumber-js --tags "@smoke or @critical"

# Generate report
npm run test:bdd:report
```

## 🎯 Test Coverage

### Current Coverage
- ✅ Form validation (all fields)
- ✅ Successful patient registration
- ✅ Error handling (phone, date, units)
- ✅ Blood group options verification
- ✅ UI/UX verification
- ✅ Multiple patient workflow
- ✅ Edge cases (special characters, max units)

### Future Enhancements
- 🔮 Screenshot capture on failure
- 🔮 Data-driven tests from CSV/Excel
- 🔮 Integration with CI/CD pipeline
- 🔮 Performance testing
- 🔮 Accessibility testing

## 📋 Checklist Before Running Tests

- [ ] Frontend server running on http://localhost:5173
- [ ] Backend server running on http://localhost:5000
- [ ] MongoDB database accessible
- [ ] Test blood bank user exists
- [ ] Chrome browser installed
- [ ] Node modules installed (`npm install`)
- [ ] In correct directory (`frontend/`)

## 🚦 Exit Codes

- **0**: All tests passed ✅
- **1**: One or more tests failed ❌
- **2**: Configuration error ⚠️

## 📝 Example Test Run Output

```
=====================================
 Blood Bank Patient Registration Test
 BDD Testing with Cucumber
=====================================

[1/5] Checking if servers are running...
[OK] Frontend server is running

[2/5] Navigating to frontend directory...
[OK] In frontend directory

[3/5] Checking dependencies...
[OK] Dependencies ready

[4/5] Preparing test environment...
[OK] Environment ready

[5/5] Running BDD tests...

========================================
          EXECUTING TESTS
========================================

Feature: Blood Bank Patient Registration

  Scenario: Successfully register a new patient
    ✓ Given I am logged in as a blood bank user
    ✓ And I am on the blood bank patient registration page
    ✓ When I enter the following patient details
    ✓ And I submit the patient registration form
    ✓ Then I should see a success message
    ✓ And I should be redirected to the patient management page

16 scenarios (16 passed)
89 steps (89 passed)
0m45.234s

[SUCCESS] Test report generated
```

## 🔗 Related Files

- `frontend/src/Pages/PatientRegister.jsx` - Patient registration form component
- `backend/Route/PatientCURD.js` - Patient API endpoints
- `backend/Models/Patient.js` - Patient data model
- `frontend/features/patient-registration.feature` - General patient registration tests

## 📚 Additional Resources

- [Cucumber Documentation](https://cucumber.io/docs/cucumber/)
- [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)

---

**Last Updated**: October 27, 2025
**Version**: 1.0
**Maintained By**: Blood Donation System Team

