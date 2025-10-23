# 🎭 Running Playwright E2E Tests

## ✅ **Playwright UI Mode is Starting!**

The interactive Playwright UI should open in your browser automatically.

---

## 🎬 **Test Modes Available:**

### **1. UI Mode (Interactive) - RECOMMENDED**
```bash
cd frontend
npm run test:playwright:ui
```
**Features:**
- ✅ Visual test explorer
- ✅ Watch tests run in browser
- ✅ Debug and inspect
- ✅ Time-travel through test execution
- ✅ Pick and choose which tests to run

**Currently running!** Check your browser!

---

### **2. Headless Mode (Fast)**
```bash
cd frontend
npm run test:playwright
```
**Features:**
- ✅ Runs all tests in background
- ✅ Fast execution
- ✅ Shows pass/fail in terminal
- ✅ Generates HTML report

---

### **3. Headed Mode (Watch Browser)**
```bash
cd frontend
npm run test:playwright:headed
```
**Features:**
- ✅ Opens real browser windows
- ✅ Watch tests execute live
- ✅ See what's happening
- ✅ Good for debugging

---

### **4. Debug Mode**
```bash
cd frontend
npm run test:playwright:debug
```
**Features:**
- ✅ Pauses at each step
- ✅ Inspect elements
- ✅ Modify tests on the fly
- ✅ Step through execution

---

### **5. Using Batch Script**
```bash
cd frontend
run-e2e-tests.bat
```
**Features:**
- ✅ Interactive menu
- ✅ Choose test mode
- ✅ Auto-opens report
- ✅ Windows-friendly

---

## 📊 **Available Test Suites:**

### **1. Blood Donation Flow** (`blood-donation-flow.spec.js`)
**40+ tests covering:**
- User registration & profile setup
- Authentication flows
- Donor dashboard functionality
- Blood bank search & discovery
- Booking system
- Donor search (by blood type)
- Review & feedback system
- Admin dashboard access
- Responsive design
- Error handling
- Navigation & user flow

### **2. Dashboard Tests** (`dashboard.spec.js`)
**20+ tests covering:**
- Donor dashboard display
- Profile information
- Donation history
- Profile updates
- Availability toggle
- Blood bank dashboard
- Inventory management
- Profile completion flow
- Notifications & alerts
- User settings
- Password change
- Logout functionality

### **3. Authentication Tests** (`auth.spec.js`)
**25 tests covering:**
- Login page functionality
- Form validation
- Empty field handling
- Invalid credentials
- Forgot password
- Navigation links
- Form attributes

### **4. Firebase Authentication** (`firebase-auth.spec.js`)
**12 tests covering:**
- Firebase login button
- Google authentication
- Password reset
- User role handling
- Suspended/blocked users

### **5. Auth Integration** (`auth-integration.spec.js`)
**11 tests covering:**
- Complete auth flows
- Cross-browser testing
- Error scenarios
- Accessibility

---

## 🎯 **Total Test Coverage:**

| Test Suite | Test Count | Status |
|------------|------------|--------|
| Blood Donation Flow | 40+ | ✅ Ready |
| Dashboard | 20+ | ✅ Ready |
| Authentication | 25 | ✅ Ready |
| Firebase Auth | 12 | ✅ Ready |
| Auth Integration | 11 | ✅ Ready |
| **TOTAL** | **100+** | ✅ Ready |

---

## 🚀 **Quick Commands:**

### **Run All Tests:**
```bash
cd frontend
npm run test:playwright
```

### **Run Specific Test File:**
```bash
cd frontend
npx playwright test blood-donation-flow.spec.js
```

### **Run Specific Browser:**
```bash
cd frontend
npx playwright test --project=chromium
```

### **Run Tests Matching Pattern:**
```bash
cd frontend
npx playwright test -g "login"
```

---

## 📋 **Prerequisites:**

### **Backend Must Be Running:**
```bash
✅ Backend: http://localhost:5000 (RUNNING)
```

### **Frontend:**
Playwright will automatically start it on port 5173

---

## 📊 **Test Results:**

After tests complete, you'll see:
- ✅ Pass/Fail summary
- ⏱️ Execution time
- 📸 Screenshots (on failure)
- 🎥 Videos (on failure)
- 📝 Detailed logs

**View Report:**
```bash
npx playwright show-report
```

---

## 🎭 **Using Playwright UI:**

When the UI opens:

1. **Left Panel:** See all test files and tests
2. **Click any test:** Run it individually
3. **Watch execution:** See browser actions in real-time
4. **Inspect failures:** View screenshots and logs
5. **Debug:** Time-travel through test steps
6. **Filter:** Show only failed/passed tests

---

## 🔧 **Test Configuration:**

**File:** `frontend/playwright.config.js`

**Settings:**
- Base URL: http://localhost:5173
- Timeout: 30 seconds per test
- Retries: 0 (dev), 2 (CI)
- Screenshots: On failure
- Videos: On failure
- Trace: On first retry

**Browsers Tested:**
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

---

## 💡 **Test Examples:**

### **Login Test:**
Tests if users can login with valid credentials

### **Registration Test:**
Tests complete user registration flow

### **Blood Bank Search:**
Tests searching and filtering blood banks

### **Booking Test:**
Tests booking a donation slot

### **Dashboard Test:**
Tests dashboard displays correct user info

---

## 🐛 **Debugging Failed Tests:**

### **Option 1: UI Mode (Current)**
- Click failed test
- See visual timeline
- Inspect at failure point

### **Option 2: Debug Mode**
```bash
npm run test:playwright:debug
```

### **Option 3: View Trace**
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

## 📁 **Test Results Location:**

```
frontend/
├── playwright-report/        # HTML report
│   └── index.html
├── test-results/            # Test artifacts
│   ├── screenshots/
│   ├── videos/
│   └── traces/
```

---

## ✅ **Current Status:**

```
✅ Backend running on port 5000
✅ Backend connected to "test" database
✅ Admin account ready (admin@example.com / admin123)
✅ 15 test accounts available
✅ Playwright UI starting
✅ 100+ E2E tests ready to run
```

---

## 🎊 **What's Being Tested:**

Your complete Blood Donation application:
- ✅ User registration and login
- ✅ Profile management
- ✅ Blood bank search
- ✅ Donation booking
- ✅ Dashboard functionality
- ✅ Admin features
- ✅ Mobile responsiveness
- ✅ Error handling
- ✅ Accessibility
- ✅ Cross-browser compatibility

---

## 🚀 **Next Steps:**

1. **Wait for Playwright UI to open** (should appear in browser)
2. **Explore tests** in the left panel
3. **Click a test** to run it
4. **Watch it execute** in real-time
5. **Check results** - all should pass with your updated credentials!

---

**Playwright UI is loading! Check your browser for the interactive test runner!** 🎭✨

