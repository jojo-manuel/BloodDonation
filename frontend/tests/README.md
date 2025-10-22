# Selenium E2E Tests for Blood Donation App

This directory contains end-to-end (E2E) tests using Selenium WebDriver to test the login functionality of the Blood Donation application.

## Prerequisites

1. **Node.js** and **npm** installed
2. **Chrome browser** installed on the system
3. **Backend server** running on `http://localhost:5000`
4. **Frontend server** running on `http://localhost:5173`

## Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Make sure ChromeDriver is available (Selenium Manager will handle this automatically)

## Running Tests

### Run all E2E tests:
```bash
npm run test:e2e
```

### Run specific test file:
```bash
npx jest --config tests/jest-selenium.config.js tests/login.test.js
```

### Run tests in verbose mode:
```bash
npx jest --config tests/jest-selenium.config.js --verbose
```

## Test Structure

### `login.test.js`
Tests the login page functionality including:

- **Page Load Test**: Verifies that the login page loads correctly with all required elements
- **Invalid Credentials Test**: Tests error handling for wrong login credentials
- **Form Validation Test**: Checks HTML5 validation for required fields
- **Forgot Password Test**: Tests the forgot password functionality
- **Firebase Login Test**: Verifies Firebase login button presence
- **Form Attributes Test**: Checks required field attributes
- **UI Elements Test**: Verifies progress bar and navigation elements

## Configuration

### Jest Configuration (`jest-selenium.config.js`)
- Uses Node.js environment for Selenium tests
- Configured to run tests from the `tests/` directory
- Includes Babel transformation for ES6+ syntax

### Selenium Setup
- Runs in headless Chrome mode by default
- Window size set to 1920x1080
- Includes necessary Chrome arguments for CI/CD environments

## Test Data

The tests use mock data for testing purposes:
- Invalid email: `invalid@example.com`
- Invalid password: `invalidpassword`

## Troubleshooting

### Common Issues:

1. **ChromeDriver not found**: Selenium Manager should handle this automatically. If issues persist, install ChromeDriver manually.

2. **Port conflicts**: Ensure backend runs on port 5000 and frontend on 5173.

3. **Timeout errors**: Increase timeout values in tests if needed:
   ```javascript
   await driver.wait(until.elementLocated(By.css('selector')), 15000);
   ```

4. **Element not found**: Check if selectors match the current DOM structure.

### Running in Non-Headless Mode

To debug tests visually, modify the Chrome options in `login.test.js`:
```javascript
chromeOptions.removeArguments('--headless');
```

## Writing New Tests

When adding new test files:

1. Follow the naming convention: `*.test.js`
2. Use the same Jest configuration
3. Include proper setup and teardown
4. Use descriptive test names
5. Add appropriate wait conditions

## CI/CD Integration

For CI/CD pipelines, ensure:
- Chrome browser is installed
- Xvfb is available for headless environments
- Sufficient timeout configurations

## Dependencies

- `selenium-webdriver`: ^4.15.0
- `jest`: For test framework
- `@babel/preset-env` & `@babel/preset-react`: For ES6+ support
