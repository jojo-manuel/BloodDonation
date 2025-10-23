# Playwright Tests for Blood Donation App

This directory contains comprehensive end-to-end tests for the authentication system using Playwright.

## Test Files

### 1. `auth.spec.js`
Basic authentication tests covering:
- Login page functionality
- Registration page functionality
- Form validation
- Navigation between pages
- Responsive design
- Form attributes and accessibility

### 2. `firebase-auth.spec.js`
Firebase-specific authentication tests covering:
- Firebase login button functionality
- Google authentication flow
- Password reset functionality
- User role-based navigation
- Suspended/blocked user handling

### 3. `auth-integration.spec.js`
Integration tests covering:
- Complete registration and login flow
- Authentication state management
- Cross-browser compatibility
- Error handling
- Accessibility features

## Running Tests

### Prerequisites
1. Make sure the backend server is running on port 5000
2. Make sure the frontend development server is running on port 5173

### Commands

```bash
# Run all Playwright tests
npm run test:playwright

# Run tests with UI mode (interactive)
npm run test:playwright:ui

# Run tests in headed mode (see browser)
npm run test:playwright:headed

# Run tests in debug mode
npm run test:playwright:debug

# Run specific test file
npx playwright test auth.spec.js

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests in specific directory
npx playwright test tests/playwright/
```

## Test Configuration

The tests are configured in `playwright.config.js` with:
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile viewport testing
- Automatic dev server startup
- Screenshot and video recording on failure
- Trace collection for debugging

## Test Data

Tests use mock data and API responses to avoid dependencies on:
- Real user accounts
- External services
- Database state

## Coverage

The tests cover:
- ✅ Login page UI and functionality
- ✅ Registration page UI and functionality
- ✅ Form validation (client-side and server-side)
- ✅ Firebase authentication
- ✅ Password reset functionality
- ✅ User role-based navigation
- ✅ Error handling
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Cross-browser compatibility
- ✅ Authentication state management

## Debugging

### View Test Results
```bash
# Open test results in browser
npx playwright show-report
```

### Debug Failed Tests
```bash
# Run specific test in debug mode
npx playwright test auth.spec.js --debug

# Run with trace viewer
npx playwright test --trace on
```

### Screenshots and Videos
- Screenshots are automatically taken on test failure
- Videos are recorded for failed tests
- Traces are collected for debugging

## Best Practices

1. **Isolation**: Each test clears localStorage and starts fresh
2. **Mocking**: API calls are mocked to ensure consistent test results
3. **Wait Strategies**: Tests use proper waiting strategies for async operations
4. **Error Handling**: Tests verify both success and error scenarios
5. **Accessibility**: Tests verify proper form labels and keyboard navigation

## Adding New Tests

When adding new authentication tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Mock API responses appropriately
4. Test both success and failure scenarios
5. Include accessibility checks where relevant
6. Add proper cleanup in beforeEach hooks

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 5000 and 5173 are available
2. **Browser installation**: Run `npx playwright install` if browsers are missing
3. **Timeout issues**: Increase timeout in config if tests are slow
4. **Mock failures**: Check that API routes are properly mocked

### Getting Help

- Check Playwright documentation: https://playwright.dev/
- View test reports: `npx playwright show-report`
- Debug with trace viewer: `npx playwright test --trace on`
