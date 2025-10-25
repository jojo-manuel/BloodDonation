# 🥒 BDD Testing Guide - Cucumber Framework

## Overview

This project uses **Cucumber.js** with **Gherkin** syntax for Behavior-Driven Development (BDD) testing. Tests are written in plain English, making them readable for both technical and non-technical stakeholders.

## 📁 Project Structure

```
frontend/
├── features/
│   ├── login.feature              # Feature file with scenarios (Gherkin)
│   ├── step_definitions/
│   │   └── login_steps.js        # Step implementations
│   └── support/                  # Support files (hooks, world, etc.)
├── reports/
│   ├── cucumber-report.html      # Generated HTML report
│   └── cucumber-report.json      # JSON report data
├── cucumber.js                   # Cucumber configuration
└── generate-report.js            # HTML report generator
```

## 🚀 Running BDD Tests

### Run All BDD Tests
```bash
npm run test:bdd
```

### Run Tests with HTML Report
```bash
npm run test:bdd:report
```

### Run Specific Scenarios by Tags
First, add tags to your feature file:
```gherkin
@smoke @login
Scenario: Login with valid credentials
  ...
```

Then run:
```bash
npm run test:bdd:tags "@smoke"
npm run test:bdd:tags "@login and not @wip"
```

### Run Specific Feature File
```bash
npx cucumber-js features/login.feature
```

### Run Specific Scenario by Line Number
```bash
npx cucumber-js features/login.feature:15
```

## 📝 Gherkin Syntax

### Feature File Structure

```gherkin
Feature: Description of feature
  As a [role]
  I want [feature]
  So that [benefit]

  Background:
    Given [common preconditions]

  Scenario: Description
    Given [context]
    When [action]
    Then [outcome]
```

### Example from login.feature

```gherkin
Feature: User Login
  As a user of the Blood Donation System
  I want to be able to login to my account
  So that I can access my dashboard

  Background:
    Given I am on the login page

  Scenario: Login with valid credentials
    When I enter email "jeevan@gmail.com"
    And I enter password "Jeevan123!@#"
    And I click the login button
    Then I should be redirected to the dashboard
```

## 🎯 Available Step Definitions

### Given Steps (Preconditions)
- `Given I am on the login page`

### When Steps (Actions)
- `When I enter email "user@example.com"`
- `When I enter password "password123"`
- `When I click the login button`
- `When I click the login button without entering credentials`
- `When I click on "Forgot your password?" link`

### Then Steps (Assertions)
- `Then I should see the login form`
- `Then I should see the email input field`
- `Then I should see the password input field`
- `Then I should see the submit button`
- `Then I should be redirected to the dashboard`
- `Then I should not be on the login page`
- `Then I should see an error alert`
- `Then the alert should contain "text"`
- `Then I should remain on the login page`
- `Then the form should show validation errors`
- `Then I should see the password reset form`
- `Then I should see the Firebase login button`
- `Then the email field should be required`
- `Then the password field should be required`

## 📊 Test Output

### Console Output
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

Scenario: Login with valid credentials ✔
```

### HTML Report
Open `reports/cucumber-report.html` in your browser to see:
- ✅ Passed scenarios (green)
- ❌ Failed scenarios (red)
- ⏭️ Skipped scenarios (yellow)
- 📊 Overall statistics
- ⏱️ Execution time
- 📸 Screenshots (if implemented)

## 🏷️ Using Tags

Tags help organize and filter tests:

```gherkin
@smoke @critical
Scenario: Login with valid credentials
  ...

@regression
Scenario: Login with invalid credentials
  ...

@wip @skip
Scenario: Work in progress feature
  ...
```

Run tagged tests:
```bash
# Run smoke tests
npm run test:bdd:tags "@smoke"

# Run critical tests
npm run test:bdd:tags "@critical"

# Run all except WIP
npm run test:bdd:tags "not @wip"

# Run smoke AND critical
npm run test:bdd:tags "@smoke and @critical"

# Run smoke OR regression
npm run test:bdd:tags "@smoke or @regression"
```

## 📋 Scenario Outlines (Data-Driven Testing)

Test multiple data sets with one scenario:

```gherkin
Scenario Outline: Login with multiple valid users
  When I enter email "<email>"
  And I enter password "<password>"
  And I click the login button
  Then I should be redirected to the dashboard

  Examples:
    | email                | password        |
    | jeevan@gmail.com     | Jeevan123!@#    |
    | test@example.com     | Test123!@#      |
    | abhi@gmail.com       | AbhiPassword123!|
```

## 🔧 Adding New Steps

### 1. Write the Scenario
```gherkin
Scenario: Check profile picture
  When I login with valid credentials
  Then I should see my profile picture
```

### 2. Implement Step Definitions
```javascript
// features/step_definitions/login_steps.js

Then('I should see my profile picture', async function() {
  console.log('→ Checking for profile picture...');
  const profilePic = await this.driver.findElement(By.css('.profile-picture'));
  assert.ok(profilePic, 'Profile picture should be present');
  console.log('✓ Profile picture found');
});
```

## 📈 Best Practices

### 1. Write Clear Scenarios
```gherkin
# Good
Scenario: User logs in with valid email and password
  Given I am on the login page
  When I enter valid credentials
  Then I should see my dashboard

# Better - More specific
Scenario: Registered user successfully logs in
  Given I am on the login page
  When I enter email "jeevan@gmail.com"
  And I enter password "Jeevan123!@#"
  And I click the login button
  Then I should be redirected to the user dashboard
  And I should see "Welcome back, Jeevan"
```

### 2. Use Background for Common Steps
```gherkin
Background:
  Given I am on the login page
  And the login form is visible
```

### 3. Keep Scenarios Independent
Each scenario should:
- Run independently
- Not depend on other scenarios
- Clean up after itself

### 4. Use Descriptive Names
```gherkin
# Good
Scenario: Admin user sees additional menu items after login

# Bad
Scenario: Test login
```

## 🐛 Debugging

### Enable Verbose Logging
```bash
npx cucumber-js --format progress
```

### Run in Non-Headless Mode
Edit `features/step_definitions/login_steps.js`:
```javascript
// Comment out headless mode
// chromeOptions.addArguments('--headless');
```

### Add Screenshots on Failure
```javascript
After(async function(scenario) {
  if (scenario.result.status === 'failed') {
    const screenshot = await this.driver.takeScreenshot();
    this.attach(screenshot, 'image/png');
  }
  await this.driver.quit();
});
```

## 📚 Resources

- [Cucumber.js Documentation](https://github.com/cucumber/cucumber-js)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [Writing Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run test:bdd` | Run all BDD tests |
| `npm run test:bdd:report` | Run tests + generate HTML report |
| `npm run test:bdd:tags "@smoke"` | Run tests with specific tag |
| `npx cucumber-js features/login.feature` | Run specific feature |
| `npx cucumber-js features/login.feature:20` | Run scenario at line 20 |

## ✅ Example Test Run

```bash
D:\BloodDonation\frontend> npm run test:bdd

Feature: User Login

  Background:
    ✓ Given I am on the login page

  Scenario: Login with valid credentials
    ✓ When I enter email "jeevan@gmail.com"
    ✓ And I enter password "Jeevan123!@#"
    ✓ And I click the login button
    ✓ Then I should be redirected to the dashboard
    ✓ And I should not be on the login page

  Scenario: Login with invalid credentials
    ✓ When I enter email "invalid@example.com"
    ✓ And I enter password "wrongpassword"
    ✓ And I click the login button
    ✓ Then I should see an error alert
    ✓ And the alert should contain "Login Failed"

12 scenarios (12 passed)
50 steps (50 passed)
0m45.231s (executing steps: 0m43.102s)
```

---

**Happy BDD Testing! 🥒✨**

