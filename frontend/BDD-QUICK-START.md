# 🥒 BDD Testing - Quick Start Guide

## ⚡ Run Tests NOW!

```bash
# Navigate to frontend folder
cd frontend

# Run all BDD tests
npm run test:bdd

# Run with HTML report
npm run test:bdd:report
```

---

## 📝 Write a New Test in 3 Steps

### Step 1: Add Scenario to `features/login.feature`

```gherkin
Scenario: User logs out successfully
  Given I am logged in as "jeevan@gmail.com"
  When I click the logout button
  Then I should be redirected to the login page
  And I should not see the dashboard
```

### Step 2: Run the Test (It will show missing steps)

```bash
npm run test:bdd
```

### Step 3: Implement Missing Steps in `features/step_definitions/login_steps.cjs`

```javascript
Given('I am logged in as {string}', async function(email) {
  await this.driver.get('http://localhost:5173/login');
  // ... login code ...
});

When('I click the logout button', async function() {
  const logoutBtn = await this.driver.findElement(By.id('logout'));
  await logoutBtn.click();
});
```

---

## 🎯 Test Output Example

```
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

✅ Scenario: Login with valid credentials - PASSED

13 scenarios (10 passed, 3 failed)
55 steps (51 passed, 3 failed, 1 skipped)
1m 35s
```

---

## 🏷️ Common Commands

| What You Want | Command |
|---------------|---------|
| Run all BDD tests | `npm run test:bdd` |
| Generate HTML report | `npm run test:bdd:report` |
| Run smoke tests | `npm run test:bdd:tags "@smoke"` |
| Run specific feature | `npx cucumber-js features/login.feature` |
| Run specific scenario (line 20) | `npx cucumber-js features/login.feature:20` |

---

## 📊 View HTML Report

After running tests with report:
```bash
npm run test:bdd:report
```

Open file:
```
D:\BloodDonation\frontend\reports\cucumber-report.html
```

---

## 🔥 Most Used Gherkin Keywords

```gherkin
Feature: Title of feature
  
  Background:
    Given [run before each scenario]

  Scenario: Title of scenario
    Given [initial state]
    When [action taken]
    Then [expected result]
    And [additional condition]
    But [exception]

  Scenario Outline: Data-driven test
    When I login with "<email>" and "<password>"
    
    Examples:
      | email           | password    |
      | user1@test.com  | pass123     |
      | user2@test.com  | pass456     |
```

---

## 📚 Full Documentation

- **Complete Guide:** `BDD-TESTING-GUIDE.md`
- **Test Results:** `BDD-TEST-RESULTS-SUMMARY.md`
- **Feature File:** `features/login.feature`
- **Step Definitions:** `features/step_definitions/login_steps.cjs`

---

## ✅ You're Ready!

Your BDD framework is **fully set up** with:
- ✅ Cucumber.js installed
- ✅ 13 test scenarios written
- ✅ Gherkin syntax ready
- ✅ Step definitions implemented
- ✅ HTML reporting configured
- ✅ 77% tests passing

**Start testing!** 🚀

