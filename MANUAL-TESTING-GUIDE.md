# 📸 Manual Selenium Testing Guide with Screenshots

**Complete guide to running Selenium tests manually with visible browser and screenshot capture for report creation**

---

## 🎯 Overview

This guide will help you:
1. ✅ Run Selenium tests with **visible browser** (not headless)
2. ✅ Capture **automatic screenshots** during test execution
3. ✅ Take **manual screenshots** at specific points
4. ✅ Organize screenshots for **report creation**
5. ✅ Create **professional test reports** with visual evidence

---

## 📋 Prerequisites

### 1. Ensure Servers Are Running

**Backend Server:**
```bash
cd D:\BloodDonation
start start_backend.bat
```

**Frontend Server:**
```bash
cd D:\BloodDonation
start start_frontend.bat
```

**Verify servers are running:**
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:5173

### 2. Create Screenshots Directory

```bash
cd D:\BloodDonation\frontend
mkdir test-screenshots
```

---

## 🚀 Method 1: Run Tests with Automatic Screenshots

### Step 1: Run the Screenshot-Enabled Test

```bash
cd D:\BloodDonation\frontend
npm run test:selenium -- tests/login-with-screenshots.test.js
```

### Step 2: Watch the Browser

- Chrome will open in **visible mode** (not headless)
- You'll see the test execute step by step
- Screenshots are automatically captured
- Test logs show when screenshots are saved

### Step 3: View Screenshots

After tests complete, screenshots are saved in:
```
D:\BloodDonation\frontend\test-screenshots\
```

**Screenshot naming convention:**
```
01-login-page-loaded_2025-10-24T18-30-45-123Z.png
02-email-input-highlighted_2025-10-24T18-30-47-456Z.png
03-password-entered_2025-10-24T18-30-49-789Z.png
```

---

## 🎬 Method 2: Run Tests in Headed Mode (Visible Browser)

### Option A: Modify Existing Test File

Edit `frontend/tests/login.test.js`:

```javascript
beforeAll(async () => {
  const chromeOptions = new chrome.Options();
  
  // COMMENT OUT THIS LINE to see the browser:
  // chromeOptions.addArguments('--headless');
  
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--window-size=1920,1080');

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();
}, 30000);
```

### Option B: Use Environment Variable

Add to `package.json`:
```json
{
  "scripts": {
    "test:selenium:headed": "HEADLESS=false jest --config tests/jest-selenium.config.cjs"
  }
}
```

Then run:
```bash
npm run test:selenium:headed
```

---

## 📸 Method 3: Add Screenshots to Any Test

### Basic Screenshot Function

Add this helper to your test file:

```javascript
const fs = require('fs');
const path = require('path');

async function takeScreenshot(driver, testName) {
  const screenshotDir = path.join(__dirname, '../test-screenshots');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName}_${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);
  
  const screenshot = await driver.takeScreenshot();
  fs.writeFileSync(filepath, screenshot, 'base64');
  
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}
```

### Use in Tests

```javascript
test('should load login page', async () => {
  await driver.get('http://localhost:5173/login');
  
  // Take screenshot
  await takeScreenshot(driver, 'login-page-loaded');
  
  // Continue with test assertions...
  const form = await driver.findElement(By.css('form'));
  expect(form).toBeTruthy();
});
```

---

## 🎨 Method 4: Highlight Elements Before Screenshots

### Highlight Helper Function

```javascript
async function highlightElement(driver, element, color = 'red') {
  await driver.executeScript(
    `arguments[0].style.border='3px solid ${color}'`,
    element
  );
  await driver.sleep(500); // Brief pause to see highlight
}
```

### Use in Tests

```javascript
test('should show email input', async () => {
  await driver.get('http://localhost:5173/login');
  
  const emailInput = await driver.findElement(By.css('input[type="email"]'));
  
  // Highlight element
  await highlightElement(driver, emailInput, 'blue');
  
  // Take screenshot with highlighted element
  await takeScreenshot(driver, 'email-input-highlighted');
  
  expect(emailInput).toBeTruthy();
});
```

---

## 📊 Method 5: Create Test Report with Screenshots

### Step-by-Step Report Creation

#### 1. Run Tests and Collect Screenshots

```bash
cd D:\BloodDonation\frontend
npm run test:selenium -- tests/login-with-screenshots.test.js
```

#### 2. Organize Screenshots

Move screenshots to report folder:
```bash
mkdir D:\BloodDonation\test-report
mkdir D:\BloodDonation\test-report\images
xcopy test-screenshots\*.png test-report\images\ /Y
```

#### 3. Create Report Script

Create `frontend/generate-test-report.js`:

```javascript
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'test-screenshots');
const reportFile = path.join(__dirname, '../TEST-REPORT-WITH-SCREENSHOTS.md');

// Read all screenshot files
const screenshots = fs.readdirSync(screenshotDir)
  .filter(file => file.endsWith('.png'))
  .sort();

// Generate markdown report
let report = `# 📊 Visual Test Execution Report

**Date:** ${new Date().toLocaleDateString()}  
**Total Screenshots:** ${screenshots.length}

---

## 📸 Test Screenshots

`;

screenshots.forEach((screenshot, index) => {
  const testName = screenshot.split('_')[0].replace(/-/g, ' ');
  report += `
### ${index + 1}. ${testName}

![${screenshot}](frontend/test-screenshots/${screenshot})

**File:** \`${screenshot}\`

---

`;
});

fs.writeFileSync(reportFile, report);
console.log(`✅ Report generated: ${reportFile}`);
console.log(`📸 Total screenshots: ${screenshots.length}`);
```

#### 4. Run Report Generator

```bash
cd D:\BloodDonation\frontend
node generate-test-report.js
```

---

## 🎥 Method 6: Record Video of Test Execution

### Install Video Recording Package

```bash
cd D:\BloodDonation\frontend
npm install --save-dev puppeteer-screen-recorder
```

### Add Video Recording to Test

```javascript
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

test('should login with video', async () => {
  // Start recording
  const recorder = new PuppeteerScreenRecorder(driver);
  await recorder.start('./test-videos/login-test.mp4');
  
  // Perform test
  await driver.get('http://localhost:5173/login');
  await driver.findElement(By.css('input[type="email"]')).sendKeys('test@example.com');
  await driver.findElement(By.css('input[type="password"]')).sendKeys('password');
  await driver.findElement(By.css('button[type="submit"]')).click();
  
  // Stop recording
  await recorder.stop();
});
```

---

## 🛠️ Advanced Screenshot Techniques

### 1. Full Page Screenshot

```javascript
async function takeFullPageScreenshot(driver, filename) {
  // Get page dimensions
  const pageHeight = await driver.executeScript('return document.body.scrollHeight');
  const viewportHeight = await driver.executeScript('return window.innerHeight');
  
  const screenshots = [];
  let currentPosition = 0;
  
  // Capture screenshots while scrolling
  while (currentPosition < pageHeight) {
    await driver.executeScript(`window.scrollTo(0, ${currentPosition})`);
    await driver.sleep(500);
    
    const screenshot = await driver.takeScreenshot();
    screenshots.push(screenshot);
    
    currentPosition += viewportHeight;
  }
  
  // Combine screenshots (requires image processing library)
  // For simple use, just save the last one or use a tool like Jimp
  
  return screenshots;
}
```

### 2. Element-Only Screenshot

```javascript
async function takeElementScreenshot(driver, element, filename) {
  const screenshotDir = path.join(__dirname, '../test-screenshots');
  
  // Get element location and size
  const location = await element.getRect();
  
  // Take full screenshot
  const screenshot = await driver.takeScreenshot();
  
  // Crop to element (requires image processing)
  // Use a library like 'jimp' or 'sharp'
  const Jimp = require('jimp');
  const image = await Jimp.read(Buffer.from(screenshot, 'base64'));
  
  const cropped = image.crop(
    location.x,
    location.y,
    location.width,
    location.height
  );
  
  const filepath = path.join(screenshotDir, filename);
  await cropped.writeAsync(filepath);
  
  return filepath;
}
```

### 3. Comparison Screenshots (Before/After)

```javascript
async function takeComparisonScreenshots(driver, testName) {
  // Take "before" screenshot
  const beforePath = await takeScreenshot(driver, `${testName}-before`);
  
  // Perform action
  // ... your test actions ...
  
  // Take "after" screenshot
  const afterPath = await takeScreenshot(driver, `${testName}-after`);
  
  return { before: beforePath, after: afterPath };
}
```

---

## 📝 Creating Professional Test Reports

### Report Template with Screenshots

Create `TEST-REPORT-TEMPLATE.md`:

```markdown
# 🧪 Manual Test Execution Report

## Test Information

- **Date:** October 24, 2025
- **Tester:** Your Name
- **Application:** Blood Donation System
- **Test Type:** End-to-End (Selenium)
- **Browser:** Chrome 141.0

---

## Test Cases Executed

### TC-01: Login Page Load

**Objective:** Verify login page loads correctly

**Steps:**
1. Navigate to http://localhost:5173/login
2. Verify page elements are visible

**Expected Result:** Login form displays with email, password, and submit button

**Actual Result:** ✅ **PASSED**

**Screenshot:**
![Login Page](test-screenshots/01-login-page-loaded.png)

---

### TC-02: Invalid Login Attempt

**Objective:** Verify error handling for invalid credentials

**Steps:**
1. Enter invalid email: invalid@example.com
2. Enter invalid password: wrongpassword
3. Click Submit button

**Expected Result:** Error message displayed to user

**Actual Result:** ✅ **PASSED** - Alert shown: "Login failed"

**Screenshots:**

**Before submission:**
![Before Login](test-screenshots/03-password-entered.png)

**After submission:**
![Error Message](test-screenshots/03-error-displayed.png)

---

### TC-03: Successful Login

**Objective:** Verify successful login with valid credentials

**Steps:**
1. Enter valid email: jojo2001p@gmail.com
2. Enter valid password: MyPassword123!
3. Click Submit button

**Expected Result:** User redirected to dashboard

**Actual Result:** ✅ **PASSED** - Redirected to dashboard

**Screenshots:**

**Login form filled:**
![Login Form](test-screenshots/07-valid-password-entered.png)

**After successful login:**
![Dashboard](test-screenshots/07-after-successful-login.png)

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 7 |
| Passed | 7 ✅ |
| Failed | 0 |
| Pass Rate | 100% |
| Duration | ~45 seconds |

## Conclusion

All login functionality tests passed successfully. Screenshots confirm:
- Login page loads correctly
- Form validation works
- Error handling is appropriate
- Successful authentication flow works

**Status:** ✅ **READY FOR PRODUCTION**
```

---

## 🎯 Quick Start Commands

### 1. Run Tests with Visible Browser

```bash
# Navigate to frontend
cd D:\BloodDonation\frontend

# Run screenshot-enabled tests
npm run test:selenium -- tests/login-with-screenshots.test.js
```

### 2. View Screenshots

```bash
# Open screenshots folder
explorer test-screenshots
```

### 3. Run Specific Test

```bash
# Run single test
npm run test:selenium -- tests/login-with-screenshots.test.js -t "01-should-load-login-page"
```

### 4. Run in Slow Motion (for demo)

Modify test file:
```javascript
await driver.sleep(2000); // Add 2-second pauses
```

---

## 📸 Screenshot Best Practices

### 1. Naming Convention

Use descriptive names with numbering:
```
01-page-initial-load.png
02-form-filled.png
03-validation-error.png
04-success-message.png
```

### 2. When to Take Screenshots

✅ **Do take screenshots:**
- Page initial load
- After important user actions
- Error states
- Success confirmations
- Before and after state changes
- Element highlights

❌ **Don't take screenshots:**
- Every minor step
- Duplicate states
- Loading screens (unless testing loading)

### 3. Organize Screenshots

```
test-screenshots/
├── login/
│   ├── 01-page-load.png
│   ├── 02-invalid-creds.png
│   └── 03-success.png
├── donor-registration/
│   ├── 01-form-load.png
│   └── 02-submitted.png
└── dashboard/
    ├── 01-overview.png
    └── 02-analytics.png
```

---

## 🔧 Troubleshooting

### Issue: Browser Closes Too Quickly

**Solution:** Add delays before quit
```javascript
afterAll(async () => {
  await driver.sleep(5000); // Wait 5 seconds
  if (driver) {
    await driver.quit();
  }
});
```

### Issue: Screenshots Are Blank

**Solution:** Add wait before screenshot
```javascript
await driver.sleep(1000); // Let page render
await takeScreenshot(driver, 'test-name');
```

### Issue: Can't See Element Highlights

**Solution:** Increase highlight border and wait
```javascript
await driver.executeScript(
  "arguments[0].style.border='5px solid red'; arguments[0].scrollIntoView();",
  element
);
await driver.sleep(1000);
```

---

## 📊 Example: Complete Test with Screenshots

```javascript
test('Complete login flow with screenshots', async () => {
  console.log('🧪 Starting login flow test...');
  
  // Step 1: Load page
  await driver.get('http://localhost:5173/login');
  await driver.sleep(1000);
  await takeScreenshot(driver, 'step1-page-loaded');
  
  // Step 2: Highlight and fill email
  const emailInput = await driver.findElement(By.css('input[type="email"]'));
  await highlightElement(driver, emailInput);
  await takeScreenshot(driver, 'step2-email-highlighted');
  await emailInput.sendKeys('jojo2001p@gmail.com');
  await takeScreenshot(driver, 'step3-email-filled');
  
  // Step 3: Highlight and fill password
  const passwordInput = await driver.findElement(By.css('input[type="password"]'));
  await highlightElement(driver, passwordInput);
  await takeScreenshot(driver, 'step4-password-highlighted');
  await passwordInput.sendKeys('MyPassword123!');
  await takeScreenshot(driver, 'step5-password-filled');
  
  // Step 4: Highlight and click submit
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await highlightElement(driver, submitButton);
  await takeScreenshot(driver, 'step6-ready-to-submit');
  await submitButton.click();
  
  // Step 5: Wait and capture result
  await driver.sleep(3000);
  await takeScreenshot(driver, 'step7-login-result');
  
  console.log('✅ Test complete! Check test-screenshots folder');
});
```

---

## ✅ Checklist for Manual Testing

Before testing:
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 5173)
- [ ] test-screenshots folder created
- [ ] Chrome browser available
- [ ] Test credentials ready

During testing:
- [ ] Run tests in headed mode (visible browser)
- [ ] Verify each step visually
- [ ] Ensure screenshots are captured
- [ ] Check console output for errors

After testing:
- [ ] Review all screenshots
- [ ] Organize screenshots by test
- [ ] Create test report
- [ ] Document any issues found

---

## 📚 Additional Resources

**Screenshot Libraries:**
- `selenium-webdriver` - Built-in screenshot support
- `jimp` - Image processing (crop, resize, combine)
- `sharp` - High-performance image processing
- `pixelmatch` - Screenshot comparison

**Video Recording:**
- `puppeteer-screen-recorder` - Record test execution
- `ffmpeg` - Convert/edit video

**Report Generation:**
- `mochawesome` - HTML test reports
- `allure` - Comprehensive test reporting
- Custom Markdown - Simple and effective

---

## 🎉 You're Ready!

Now you can:
✅ Run tests with visible browser  
✅ Capture automatic screenshots  
✅ Take manual screenshots at key points  
✅ Highlight elements for clarity  
✅ Create professional test reports  
✅ Share visual proof of testing  

**Happy Testing!** 🚀

---

**Last Updated:** October 24, 2025  
**Version:** 1.0.0

