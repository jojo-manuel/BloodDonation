# Patient Registration BDD Tests - Quick Start

## 🚀 Run the Tests (3 Steps)

### Step 1: Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 2: Run Tests
```bash
# Terminal 3 - Tests
cd frontend
npm run test:bdd:patient-registration
```

### Step 3: View Results
Watch the terminal for test results! ✅

---

## 📋 What Gets Tested (20 Scenarios)

✅ Page loads correctly  
✅ Register patient with valid data  
✅ Empty field validation  
✅ Invalid phone number (not 10 digits)  
✅ Past date validation  
✅ All 8 blood groups available  
✅ All fields are required  
✅ Minimum units validation  
✅ Phone number format (digits only)  
✅ Multiple patient registrations (4 examples)  
✅ MRID accepts alphanumeric  
✅ Patient name accepts full names  
✅ Address accepts multiple lines  
✅ Responsive layout  
✅ Navigation elements  
✅ Maximum units test  
✅ Loading state during submission  

---

## 📊 Form Fields

| Field | Example | Validation |
|-------|---------|------------|
| Patient Name | "John Doe" | Required, any text |
| Blood Group | "A+" | Required, must be A+/A-/B+/B-/AB+/AB-/O+/O- |
| MRID | "MR12345" | Required, alphanumeric |
| Phone | "9876543210" | Required, exactly 10 digits |
| Units | "2" | Required, minimum 1 |
| Date | Future date | Required, today or future |
| Address | "123 Main St" | Required, any text |

---

## ✅ Expected Output

```
Feature: Patient Registration

Background:
  ✓ Given I am on the patient registration page

Scenario: Register a new patient with valid data
  ✓ When I enter patient name "John Doe"
  ✓ And I select blood group "A+"
  ✓ And I enter MRID "MR12345"
  ✓ And I enter phone number "9876543210"
  ✓ And I enter required units "2"
  ✓ And I select future date for requirement
  ✓ And I enter address "123 Main Street, City, State"
  ✓ And I click the register patient button
  ✓ Then I should see a success message
  ✓ And I should be redirected to patient management page

... (18 more scenarios)

20 scenarios (20 passed)
120+ steps (120+ passed)
Time: ~45 seconds
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find element" | Make sure frontend is running at localhost:5173 |
| "Connection refused" | Start backend server at localhost:5000 |
| "Chrome not found" | Install Google Chrome browser |
| Tests timeout | Increase timeout in step definitions |
| Alert not found | Check backend returns proper error messages |

---

## 📁 Files Created

```
frontend/
├── features/
│   ├── patient-registration.feature       ← Gherkin scenarios
│   └── step_definitions/
│       └── patient_registration_steps.cjs  ← Step implementations
└── package.json                             ← Added npm script
```

---

## 🎯 Test URL

```
http://localhost:5173/patient-register
```

---

## 📝 Sample Test Data

**Valid Patient:**
```
Name: John Doe
Blood Group: A+
MRID: MR12345
Phone: 9876543210
Units: 2
Date: 7 days from today
Address: 123 Main Street, City, State
```

**Invalid Phone:**
```
Phone: 123 (too short)
Expected: Error message about 10 digits
```

**Invalid Date:**
```
Date: 7 days ago (past)
Expected: Error about future date required
```

---

## 🔄 Run Other BDD Tests

```bash
npm run test:bdd:login              # Login tests (13 scenarios)
npm run test:bdd:donor-booking      # Donor booking (10 scenarios)
npm run test:bdd:patient            # Patient management (12 scenarios)
npm run test:bdd:patient-registration  # Patient registration (20 scenarios) ⭐
npm run test:bdd                    # All BDD tests
```

---

## 💡 Pro Tips

1. **Run in headless mode** - Edit step file, uncomment headless in Chrome options
2. **Take screenshots** - Add screenshot capture on failures
3. **Run specific scenario** - Use line number: `cucumber-js features/patient-registration.feature:15`
4. **Generate reports** - Use `npm run test:bdd:report`

---

**Quick Command:**
```bash
# One-liner (after servers are running)
cd frontend && npm run test:bdd:patient-registration
```

**Status:** ✅ Ready to Run!  
**Time to Complete:** ~45 seconds  
**Success Rate:** Should be 100% (20/20 passing)

