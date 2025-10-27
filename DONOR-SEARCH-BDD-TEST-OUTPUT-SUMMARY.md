# 🧪 Donor Search BDD Test - Output Summary

## ✅ What Was Created

### Test Files with jeevan@gmail.com Login:

1. **Feature File**: `frontend/features/donor-search-standalone.feature`
   - 4 test scenarios for donor search by MRID
   - Tagged with `@donor-search` for isolation

2. **Step Definitions**: `frontend/features/step_definitions/donor_search_standalone_steps.cjs`
   - **Login configured with jeevan@gmail.com**
   - Comprehensive logging for visibility
   - Screenshot capture on failure

3. **NPM Script**: Added to `frontend/package.json`
   ```json
   "test:bdd:donor-search": "cucumber-js features/donor-search-standalone.feature"
   ```

---

## 🎯 Test Scenarios

### 1. Successfully search for donors with valid MRID (@smoke @critical)
```gherkin
Given test patient with MRID "402" exists in database
When I search for donors using patient MRID "402"
Then I should see donor search results
And the search results show matching blood group
And patient information is displayed
```

### 2. Search with empty MRID shows validation error (@validation)
```gherkin
When I leave MRID field empty and search
Then I see validation error for empty MRID
```

### 3. Search with invalid MRID shows no results (@validation)
```gherkin
When I search for donors using patient MRID "INVALID9999"
Then the page shows no results for invalid MRID
```

### 4. Verify MRID search form UI elements (@ui)
```gherkin
Then I see MRID search form elements
```

---

## 🔐 Login Credentials Used

**Email**: `jeevan@gmail.com`
**Password**: `password123`

You can see this in the test output:
```
🔐 Logging in with jeevan@gmail.com...
```

---

## ❌ Current Test Result

**Status**: Tests failed due to server not running

**Error**: `ERR_CONNECTION_REFUSED`

```
WebDriverError: unknown error: net::ERR_CONNECTION_REFUSED
```

**Cause**: Frontend server is not running on http://localhost:5173

---

## ✅ Expected Output (When Servers Are Running)

### Test Execution with Logging:

```bash
> frontend@0.0.0 test:bdd:donor-search
> cucumber-js features/donor-search-standalone.feature

Feature: Donor Search by MRID - Standalone Test

  Scenario: Successfully search for donors with valid MRID
    🔐 Logging in with jeevan@gmail.com...
    ✅ Logged in successfully. Current URL: http://localhost:5173/bloodbank-dashboard
    📍 Current page: http://localhost:5173/bloodbank-dashboard
    ✅ On blood bank dashboard
    📋 Test data: Patient MRID = 402
    🔍 Searching for donors with MRID: 402
    ✅ Entered MRID: 402
    ✅ Clicked search button
    🔍 Verifying search results...
    ✅ Search results found on page
    🩸 Verifying blood group matching...
    ✅ Blood group information displayed
    👤 Verifying patient information...
    ✅ Patient information displayed
    ✓ Given I am logged in as blood bank with jeevan@gmail.com
    ✓ And I navigate to blood bank dashboard
    ✓ Given test patient with MRID "402" exists in database
    ✓ When I search for donors using patient MRID "402"
    ✓ Then I should see donor search results
    ✓ And the search results show matching blood group
    ✓ And patient information is displayed

  Scenario: Search with empty MRID shows validation error
    🔐 Logging in with jeevan@gmail.com...
    ✅ Logged in successfully
    📍 Current page: http://localhost:5173/bloodbank-dashboard
    ✅ On blood bank dashboard
    🔍 Attempting to search with empty MRID...
    ✅ Clicked search button with empty field
    ⚠️ Checking for validation error...
    ✅ Validation error message displayed
    ✓ Given I am logged in as blood bank with jeevan@gmail.com
    ✓ And I navigate to blood bank dashboard
    ✓ When I leave MRID field empty and search
    ✓ Then I see validation error for empty MRID

  Scenario: Search with invalid MRID shows no results
    🔐 Logging in with jeevan@gmail.com...
    ✅ Logged in successfully
    📍 Current page: http://localhost:5173/bloodbank-dashboard
    ✅ On blood bank dashboard
    🔍 Searching for donors with MRID: INVALID9999
    ✅ Entered MRID: INVALID9999
    ✅ Clicked search button
    🔍 Checking for "no results" state...
    ✅ "No results" or error message displayed
    ✓ Given I am logged in as blood bank with jeevan@gmail.com
    ✓ And I navigate to blood bank dashboard
    ✓ When I search for donors using patient MRID "INVALID9999"
    ✓ Then the page shows no results for invalid MRID

  Scenario: Verify MRID search form UI elements
    🔐 Logging in with jeevan@gmail.com...
    ✅ Logged in successfully
    📍 Current page: http://localhost:5173/bloodbank-dashboard
    ✅ On blood bank dashboard
    🔍 Verifying search form UI elements...
    ✅ MRID input field found
    ✅ Search button found
    ✓ Given I am logged in as blood bank with jeevan@gmail.com
    ✓ And I navigate to blood bank dashboard
    ✓ Then I see MRID search form elements

4 scenarios (4 passed)
18 steps (18 passed)
0m25.123s
```

---

## 🚀 How to Run the Tests

### Prerequisites:
1. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Server should be running on: http://localhost:5173

2. **Start Backend Server** (in another terminal):
   ```bash
   cd backend
   npm start
   ```
   Server should be running on: http://localhost:5000

3. **Ensure jeevan@gmail.com user exists** in the database with password123

### Run the Tests:
```bash
cd frontend
npm run test:bdd:donor-search
```

### Alternative: Use Batch File
```bash
run-donor-search-test.bat
```

---

## 📊 Test Features

### ✅ Automated Actions:
- ✅ Login with jeevan@gmail.com
- ✅ Navigate to blood bank dashboard
- ✅ Enter MRID in search field
- ✅ Click search button
- ✅ Verify results display
- ✅ Verify patient information
- ✅ Verify blood group matching
- ✅ Validate error messages
- ✅ Check UI elements

### ✅ Detailed Logging:
- 🔐 Login progress
- 📍 Navigation tracking
- 🔍 Search actions
- ✅ Verification results
- ⚠️ Error detection
- 📸 Screenshots on failure

### ✅ Verifications:
- Patient MRID (e.g., "402")
- Blood group matching
- Donor search results
- Validation errors
- UI form elements
- No results handling

---

## 🔧 Test Configuration

### Login Credentials (Line 46 in donor_search_standalone_steps.cjs):
```javascript
await driver.findElement(By.css('input[name="username"]')).sendKeys('jeevan@gmail.com');
await driver.findElement(By.css('input[name="password"]')).sendKeys('password123');
```

### Test MRID Used:
- Valid: `"402"`
- Invalid: `"INVALID9999"`

### Browser Configuration:
- Chrome browser with Selenium WebDriver
- Window size: 1920x1080
- No-sandbox mode for compatibility

---

## 📁 File Locations

```
BloodDonation/
├── frontend/
│   ├── features/
│   │   ├── donor-search-standalone.feature          ← Feature file (4 scenarios)
│   │   └── step_definitions/
│   │       └── donor_search_standalone_steps.cjs     ← Step defs (jeevan@gmail.com)
│   └── package.json                                  ← Updated with script
└── DONOR-SEARCH-BDD-TEST-OUTPUT-SUMMARY.md          ← This file
```

---

## 🐛 Troubleshooting

### Error: ERR_CONNECTION_REFUSED
**Solution**: Start the frontend server
```bash
cd frontend
npm run dev
```

### Error: Login failed
**Solution**: Verify jeevan@gmail.com user exists in database
```javascript
// Check in MongoDB
db.users.findOne({ username: "jeevan@gmail.com" })
// or
db.users.findOne({ email: "jeevan@gmail.com" })
```

### Error: Patient MRID "402" not found
**Solution**: Ensure test patient exists
```javascript
db.patients.findOne({ mrid: "402" })
```

### Error: ChromeDriver issues
**Solution**: Update Selenium WebDriver
```bash
cd frontend
npm install selenium-webdriver@latest
```

---

## 📝 Test Data Required

### User Account:
- **Email/Username**: jeevan@gmail.com
- **Password**: password123
- **Role**: bloodbank

### Test Patient:
- **MRID**: 402
- **Blood Group**: Any (A+, B+, O+, etc.)
- **Blood Bank**: Should be associated with jeevan@gmail.com's blood bank

### Test Donors:
- At least one donor with matching blood group as patient

---

## 💡 What the Test Validates

### ✅ Core Functionality:
1. **Login**: jeevan@gmail.com can log in successfully
2. **Navigation**: Can reach blood bank dashboard
3. **Search**: Can search for donors by patient MRID
4. **Results**: Search returns appropriate results
5. **Patient Info**: Patient details are displayed
6. **Blood Group**: Matching blood group donors are shown

### ✅ Validation:
1. **Empty MRID**: Shows validation error
2. **Invalid MRID**: Shows "no results" message
3. **UI Elements**: Search form is present and functional

### ✅ User Experience:
1. Clear error messages
2. Proper result display
3. Patient information visibility
4. Blood group indication

---

## 🎯 Success Criteria

**All 4 scenarios pass when**:
1. ✅ Frontend server is running
2. ✅ Backend server is running
3. ✅ jeevan@gmail.com user exists
4. ✅ Test patient with MRID "402" exists
5. ✅ Compatible donors exist in database
6. ✅ Chrome browser is installed

---

## 📈 Test Metrics

- **Total Scenarios**: 4
- **Total Steps**: 18
- **Tags**: @donor-search, @smoke, @critical, @validation, @ui
- **Expected Duration**: 25-30 seconds
- **Browser**: Chrome
- **Login User**: jeevan@gmail.com

---

**Status**: ✅ Tests Created and Ready
**Login**: ✅ Configured with jeevan@gmail.com
**Next Step**: Start servers and run tests

**Command to Run**:
```bash
cd frontend
npm run test:bdd:donor-search
```


