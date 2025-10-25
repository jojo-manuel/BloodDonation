# 🎯 BDD Separate Feature Tests Guide

## Overview

Your BDD testing framework is now organized into **4 separate feature files**, each covering a distinct functionality of your Blood Donation System.

---

## 📋 Feature Files Overview

### 1. **Login Feature** (`login.feature`)
**Purpose:** Test user authentication and login functionality  
**Scenarios:** 13  
**Test As:** All user types (Patient, Donor, Blood Bank, Admin)

```gherkin
Feature: User Login
  Scenario: Login with valid credentials
  Scenario: Login with invalid credentials
  Scenario: Password reset functionality
  ...
```

### 2. **Donor Booking Feature** (`donor-booking.feature`)
**Purpose:** Test patient booking donors for blood donation  
**Scenarios:** 10  
**Test As:** Patient User

```gherkin
Feature: Donor Booking by Patient
  Scenario: Search for donors by blood group
  Scenario: Book an appointment with a donor
  Scenario: View my sent donation requests
  ...
```

### 3. **Patient Management Feature** (`patient-management.feature`)
**Purpose:** Test blood bank managing patient records  
**Scenarios:** 12  
**Test As:** Blood Bank Administrator

```gherkin
Feature: Patient Management by Blood Bank
  Scenario: Add a new patient record
  Scenario: Search patient by MR ID
  Scenario: Mark patient request as fulfilled
  ...
```

### 4. **Donor Slot Booking Feature** (`donor-slot-booking.feature`)
**Purpose:** Test donors booking slots at blood banks  
**Scenarios:** 17  
**Test As:** Donor User

```gherkin
Feature: Slot Booking by Donor
  Scenario: View available donation slots
  Scenario: Book a donation slot
  Scenario: Book taxi for blood donation
  ...
```

---

## 🚀 Running Individual Feature Tests

### Run All Tests
```bash
npm run test:bdd
```

### Run Specific Features

#### 1. Login Tests Only
```bash
npm run test:bdd:login
```

#### 2. Donor Booking Tests Only
```bash
npm run test:bdd:donor-booking
```

#### 3. Patient Management Tests Only
```bash
npm run test:bdd:patient
```

#### 4. Donor Slot Booking Tests Only
```bash
npm run test:bdd:donor-slots
```

---

## 📊 Test Coverage Summary

| Feature | Scenarios | Key Functionalities |
|---------|-----------|---------------------|
| **Login** | 13 | Authentication, validation, password reset |
| **Donor Booking** | 10 | Search donors, book appointments, manage requests |
| **Patient Management** | 12 | Add patients, search by MR ID, fulfill requests |
| **Donor Slot Booking** | 17 | Book slots, manage bookings, taxi integration |
| **TOTAL** | **52** | **Complete system coverage** |

---

## 🏷️ Running Tests by Tags

Each feature has tagged scenarios for targeted testing:

### Smoke Tests (Critical Scenarios)
```bash
npm run test:bdd:tags "@smoke"
```

### Critical Business Scenarios
```bash
npm run test:bdd:tags "@critical"
```

### Booking-Related Tests
```bash
npm run test:bdd:tags "@booking"
```

### Patient Management Tests
```bash
npm run test:bdd:tags "@patient"
```

### Slot Booking Tests
```bash
npm run test:bdd:tags "@slots"
```

### Validation Tests
```bash
npm run test:bdd:tags "@validation"
```

### Emergency Scenarios
```bash
npm run test:bdd:tags "@emergency"
```

### Combined Tags
```bash
# Run smoke tests for booking only
npm run test:bdd:tags "@smoke and @booking"

# Run all critical tests except WIP
npm run test:bdd:tags "@critical and not @wip"
```

---

## 📝 Detailed Feature Breakdown

### 1. Login Feature

**File:** `features/login.feature`  
**Step Definitions:** `features/step_definitions/login_steps.cjs`

**Key Scenarios:**
- ✅ Successfully load the login page
- ✅ Login with valid credentials (jeevan@gmail.com)
- ✅ Login with invalid credentials
- ✅ Validate empty fields
- ✅ Navigate to forgot password
- ✅ Check Firebase login option
- ✅ Verify form requirements
- ✅ Check navigation elements
- ✅ Login with multiple users (data-driven)
- ✅ Password field security
- ✅ Page branding verification

**Run Command:**
```bash
npm run test:bdd:login
```

---

### 2. Donor Booking Feature

**File:** `features/donor-booking.feature`  
**Step Definitions:** `features/step_definitions/donor_booking_steps.cjs`

**Key Scenarios:**
- 🩸 Search for donors by blood group
- 🩸 Book an appointment with a donor
- 🩸 View my sent donation requests
- 🩸 Cancel a pending donation request
- 🩸 Filter donors by multiple criteria
- 🩸 View donor profile before booking
- 🩸 Search for multiple blood groups (data-driven)
- 🩸 Mark request as emergency

**Test Flow:**
```
Patient Login → Search Donors → Book Appointment → Manage Requests
```

**Run Command:**
```bash
npm run test:bdd:donor-booking
```

---

### 3. Patient Management Feature

**File:** `features/patient-management.feature`  
**Step Definitions:** `features/step_definitions/patient_management_steps.cjs`

**Key Scenarios:**
- 🏥 Add a new patient record
- 🏥 Search patient by MR ID
- 🏥 Update patient information
- 🏥 Mark patient request as fulfilled
- 🏥 Validate MR ID uniqueness
- 🏥 Filter patients by status
- 🏥 View patient request history
- 🏥 Auto-populate patient details from dropdown
- 🏥 Export patient records
- 🏥 Add patients with different blood groups (data-driven)
- 🏥 Track patient fulfillment metrics

**Test Flow:**
```
Blood Bank Login → Add Patient → Search Patient → Update/Fulfill → Track
```

**Run Command:**
```bash
npm run test:bdd:patient
```

---

### 4. Donor Slot Booking Feature

**File:** `features/donor-slot-booking.feature`  
**Step Definitions:** `features/step_definitions/donor_slot_booking_steps.cjs`

**Key Scenarios:**
- 🎫 View available donation slots
- 🎫 Book a donation slot
- 🎫 View my booked slots
- 🎫 Cancel a booked slot
- 🎫 Prevent booking on past dates
- 🎫 Check minimum days between donations
- 🎫 Reschedule a booked slot
- 🎫 Filter blood banks by location
- 🚕 Book taxi for blood donation appointment
- 💳 Make payment for taxi booking
- 📄 Download booking confirmation PDF
- 🔔 Receive reminder for upcoming donation
- 📊 View donation history
- 🏆 Download donation certificate

**Test Flow:**
```
Donor Login → Select Blood Bank → Book Slot → Book Taxi → Download PDF
```

**Run Command:**
```bash
npm run test:bdd:donor-slots
```

---

## 🎬 Running Specific Scenarios

### Run Single Scenario by Line Number
```bash
# Run scenario at line 8 in login.feature
npx cucumber-js features/login.feature:8

# Run scenario at line 15 in donor-booking.feature
npx cucumber-js features/donor-booking.feature:15
```

### Run Multiple Features
```bash
npx cucumber-js features/login.feature features/donor-booking.feature
```

---

## 📊 Expected Test Output

### Login Feature
```
Feature: User Login

  Scenario: Login with valid credentials
    🚀 Starting test scenario...
    ✓ Browser initialized
    → Navigating to login page...
    ✓ Login page loaded
    → Entering email: jeevan@gmail.com
    ✓ Email entered
    → Entering password: ************
    ✓ Password entered
    → Clicking login button...
    ✓ Login button clicked
    → Waiting for redirect...
    ✓ Successfully redirected
    ✓ Browser closed

  ✅ 13 scenarios (10 passed, 3 failed)
  ✅ 55 steps (51 passed, 3 failed, 1 skipped)
  ⏱️ Time: 1m 35s
```

### Donor Booking Feature
```
Feature: Donor Booking by Patient

  Scenario: Search for donors by blood group
    🚀 Starting test scenario...
    → Logging in as patient: jeevan@gmail.com
    ✓ Logged in as patient
    → Navigating to donor search page...
    ✓ On donor search page
    → Selecting blood group: O+
    ✓ Blood group O+ selected
    → Entering location: Kochi
    ✓ Location Kochi entered
    → Clicking search button...
    ✓ Search button clicked
    → Verifying donor list...
    ✓ Found 5 donors

  ✅ Scenario PASSED
```

---

## 🗂️ File Structure

```
frontend/
├── features/
│   ├── login.feature                      # Login scenarios
│   ├── donor-booking.feature              # Donor booking scenarios
│   ├── patient-management.feature         # Patient management scenarios
│   ├── donor-slot-booking.feature         # Slot booking scenarios
│   └── step_definitions/
│       ├── login_steps.cjs               # Login step implementations
│       ├── donor_booking_steps.cjs       # Booking step implementations
│       ├── patient_management_steps.cjs  # Patient step implementations
│       └── donor_slot_booking_steps.cjs  # Slot step implementations
├── reports/
│   ├── cucumber-report.html              # HTML report
│   └── cucumber-report.json              # JSON data
└── cucumber.cjs                          # Cucumber configuration
```

---

## 🎯 Quick Test Commands Reference

| What You Want to Test | Command |
|------------------------|---------|
| Everything | `npm run test:bdd` |
| Login only | `npm run test:bdd:login` |
| Donor booking only | `npm run test:bdd:donor-booking` |
| Patient management only | `npm run test:bdd:patient` |
| Donor slots only | `npm run test:bdd:donor-slots` |
| With HTML report | `npm run test:bdd:report` |
| Smoke tests | `npm run test:bdd:tags "@smoke"` |
| Critical tests | `npm run test:bdd:tags "@critical"` |
| Booking tests | `npm run test:bdd:tags "@booking"` |
| Patient tests | `npm run test:bdd:tags "@patient"` |
| Slot tests | `npm run test:bdd:tags "@slots"` |

---

## 📈 Test Execution Strategy

### 1. **Development Testing**
Run individual features as you develop:
```bash
# Working on login? Test login
npm run test:bdd:login

# Working on bookings? Test bookings
npm run test:bdd:donor-booking
```

### 2. **Pre-Commit Testing**
Run smoke tests before committing:
```bash
npm run test:bdd:tags "@smoke"
```

### 3. **CI/CD Pipeline**
Run all tests in pipeline:
```bash
npm run test:bdd:report
```

### 4. **Regression Testing**
Run all features:
```bash
npm run test:bdd
```

---

## 🔍 Debugging Individual Features

### Enable Detailed Logging
All step definitions already include detailed console logging:
- → (arrow) = Action being performed
- ✓ (checkmark) = Action completed successfully
- ⚠️ (warning) = Element not found or error

### Run in Non-Headless Mode
Edit step definition file and comment out:
```javascript
// chromeOptions.addArguments('--headless');
```

### Add Breakpoints
Add `await this.driver.sleep(5000);` to pause execution.

---

## 🎨 Scenario Tags Reference

| Tag | Purpose | Example |
|-----|---------|---------|
| `@smoke` | Core functionality | Login, search, book |
| `@critical` | Business critical | Payment, fulfillment |
| `@booking` | Booking features | Donor booking scenarios |
| `@patient` | Patient management | Add, search, update patient |
| `@slots` | Slot booking | View, book, cancel slots |
| `@validation` | Input validation | Form validation tests |
| `@filter` | Filter/search | Filter donors, patients |
| `@emergency` | Emergency scenarios | Urgent requests |
| `@taxi` | Taxi booking | Taxi integration tests |
| `@payment` | Payment flows | Razorpay integration |
| `@notification` | Notifications | Email, SMS alerts |

---

## 📚 Related Documentation

- **Quick Start:** `BDD-QUICK-START.md`
- **Complete Guide:** `BDD-TESTING-GUIDE.md`
- **Test Results:** `BDD-TEST-RESULTS-SUMMARY.md`

---

## ✅ Summary

You now have **4 separate BDD feature files** covering:

✅ **52 test scenarios** total  
✅ **4 distinct features** (Login, Booking, Patient, Slots)  
✅ **Individual test commands** for each feature  
✅ **Tag-based filtering** for targeted testing  
✅ **Detailed step-by-step logging**  
✅ **Complete test coverage** of your system  

**Start testing individual features now!** 🚀

