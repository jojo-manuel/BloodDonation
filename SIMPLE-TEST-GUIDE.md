# 🧪 Simple Login Test Guide

## Overview

This is a simple, clean Selenium test similar to the Java example you provided. It tests the login functionality with clear, readable output.

---

## 📁 Files Created

1. **`frontend/tests/simple-login-test.cjs`** - The test file
2. **`run-simple-test.bat`** - Windows batch file to run the test
3. **`npm run test:simple`** - NPM script command

---

## 🚀 How to Run

### Method 1: NPM Script (Recommended)
```bash
cd D:\BloodDonation\frontend
npm run test:simple
```

### Method 2: Batch File
```bash
cd D:\BloodDonation
run-simple-test.bat
```

### Method 3: Direct Node Command
```bash
cd D:\BloodDonation\frontend
node tests/simple-login-test.cjs
```

---

## 📋 Prerequisites

1. **Backend server running:**
   ```bash
   cd D:\BloodDonation
   start start_backend.bat
   ```

2. **Frontend server running:**
   ```bash
   cd D:\BloodDonation
   start start_frontend.bat
   ```

3. **Valid test credentials**

---

## 🔑 Test Credentials

The test uses:
```
Email: jojo2001p@gmail.com
Password: MyPassword123!
```

**Note:** If you get "Invalid credentials" error:
1. Go to http://localhost:5173/clear-storage.html
2. Click "Clear All Storage Data"
3. Login manually first to verify credentials work
4. Then run the test again

---

## 📊 Expected Output

### ✅ Successful Test Output:
```
Starting ChromeDriver...
ChromeDriver started successfully.

Navigating to login page...
Finding email input field...
Email entered: jojo2001p@gmail.com
Finding password input field...
Password entered: ************
Finding login button...
Login button clicked
Waiting for authentication...

Current URL: http://localhost:5173/dashboard
Expected different from: http://localhost:5173/login

✅ Test passed
Login successful - Redirected to: http://localhost:5173/dashboard

Closing browser...
Browser closed.
```

### ❌ Failed Test Output:
```
Starting ChromeDriver...
ChromeDriver started successfully.

Navigating to login page...
Finding email input field...
Email entered: jojo2001p@gmail.com
Finding password input field...
Password entered: ************
Finding login button...
Login button clicked
Waiting for authentication...
Alert detected: Login Failed: Invalid credentials
Alert dismissed

Current URL: http://localhost:5173/login
Expected different from: http://localhost:5173/login

❌ Test failed
Still on login page - Authentication failed

Closing browser...
Browser closed.
```

---

## 📝 Test Code Structure

The test follows a simple structure similar to Selenium Java tests:

```javascript
// 1. Setup ChromeDriver
const driver = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(chromeOptions)
  .build();

// 2. Navigate to page
await driver.get("http://localhost:5173/login");

// 3. Find elements and interact
const emailInput = await driver.findElement(By.css('input[type="email"]'));
await emailInput.sendKeys("jojo2001p@gmail.com");

const passwordInput = await driver.findElement(By.css('input[type="password"]'));
await passwordInput.sendKeys("MyPassword123!");

const loginButton = await driver.findElement(By.css('button[type="submit"]'));
await loginButton.click();

// 4. Verify result
const currentUrl = await driver.getCurrentUrl();
if (!currentUrl.includes('/login')) {
  console.log('✅ Test passed');
} else {
  console.log('❌ Test failed');
}

// 5. Cleanup
await driver.quit();
```

---

## 🎯 What the Test Does

1. ✅ Starts ChromeDriver
2. ✅ Navigates to login page
3. ✅ Enters email address
4. ✅ Enters password
5. ✅ Clicks login button
6. ✅ Waits for authentication
7. ✅ Handles any alerts
8. ✅ Checks if URL changed (redirect happened)
9. ✅ Reports success or failure
10. ✅ Closes browser

---

## 🔧 Customization

### Change Test Credentials

Edit `frontend/tests/simple-login-test.cjs`:

```javascript
// Line 30-31
await emailInput.sendKeys("your-email@example.com");
await passwordInput.sendKeys("your-password");
```

### Change Wait Time

Edit `frontend/tests/simple-login-test.cjs`:

```javascript
// Line 49 - Change 3000 to desired milliseconds
await driver.sleep(3000); // 3 seconds
```

### Run in Visible Mode (Not Headless)

Edit `frontend/tests/simple-login-test.cjs`:

```javascript
// Comment out around line 10:
// chromeOptions.addArguments('--headless');
```

---

## 📸 Taking Screenshots

To screenshot the output for your report:

### Windows (Built-in Snipping Tool):
1. Run the test: `npm run test:simple`
2. Press `Windows + Shift + S`
3. Select the terminal area
4. Screenshot is copied to clipboard
5. Paste in your document

### PowerShell with Output Capture:
```powershell
npm run test:simple > test-output.txt 2>&1
notepad test-output.txt
# Now screenshot the notepad window
```

---

## 🐛 Troubleshooting

### Issue: "ChromeDriver not found"
**Solution:**
```bash
cd D:\BloodDonation\frontend
npm install selenium-webdriver
```

### Issue: "Connection refused"
**Solution:** Start the frontend server
```bash
cd D:\BloodDonation\frontend
npm run dev
```

### Issue: "Invalid credentials"
**Solution:** 
1. Clear browser storage: http://localhost:5173/clear-storage.html
2. Verify credentials by logging in manually first
3. Update test file with correct credentials

### Issue: "Alert keeps appearing"
**Solution:** Our fix in `api.js` should prevent this. If it persists:
1. Clear localStorage
2. Restart frontend server
3. Run test again

---

## 📊 Comparison with Your Java Example

### Your Java Example:
```java
WebDriver driver = new ChromeDriver();
System.setProperty("...", "chrome.driver");
driver.get("webdriver.io/...");
driver.findElement(By.id("exampleInputEmail1")).sendKeys("...");
driver.findElement(By.id("exampleInputPassword1")).sendKeys("...");
driver.findElement(By.id("login")).click();
String actualUrl = driver.getCurrentUrl();
if (actualUrl.equalsIgnoreCase(expectedUrl)) {
    System.out.println("Test passed");
} else {
    System.out.println("Test failed");
}
```

### Our JavaScript Version:
```javascript
const driver = await new Builder().forBrowser('chrome').build();
await driver.get("http://localhost:5173/login");
await driver.findElement(By.css('input[type="email"]')).sendKeys("...");
await driver.findElement(By.css('input[type="password"]')).sendKeys("...");
await driver.findElement(By.css('button[type="submit"]')).click();
const currentUrl = await driver.getCurrentUrl();
if (!currentUrl.includes('/login')) {
    console.log('✅ Test passed');
} else {
    console.log('❌ Test failed');
}
```

**Key Differences:**
- JavaScript uses `async/await` instead of synchronous calls
- Uses `By.css()` instead of `By.id()` (more flexible)
- Cleaner output with emojis and formatting
- Built-in alert handling

**Similarities:**
- Same test flow and logic
- Clear pass/fail output
- Simple and easy to understand
- Tests login functionality

---

## 📄 Output for Report

For your report, you can use:

1. **Code Screenshot:**
   - Open `frontend/tests/simple-login-test.cjs`
   - Screenshot the main function
   
2. **Output Screenshot:**
   - Run `npm run test:simple`
   - Screenshot the terminal output
   
3. **Both Together:**
   - Use VS Code split view
   - Left: Code file
   - Right: Terminal with output
   - Screenshot both panels

---

## ✅ Success Checklist

- [ ] Backend server is running
- [ ] Frontend server is running
- [ ] Test credentials are valid
- [ ] Browser storage is cleared
- [ ] Test runs without errors
- [ ] Output is clean and readable
- [ ] Test passes (✅) or shows clear error (❌)

---

## 🎉 Benefits of This Test

1. ✅ **Simple** - Easy to understand and modify
2. ✅ **Clean Output** - Professional looking results
3. ✅ **Fast** - Runs in ~5-10 seconds
4. ✅ **Reliable** - Handles alerts and errors gracefully
5. ✅ **Report Ready** - Perfect for documentation
6. ✅ **Maintainable** - Clear code structure

---

## 📚 Further Reading

**Selenium WebDriver Docs:**
- https://www.selenium.dev/documentation/webdriver/

**Node.js Selenium:**
- https://www.npmjs.com/package/selenium-webdriver

**Your Test Files:**
- Full test suite: `frontend/tests/login.test.js`
- With screenshots: `frontend/tests/login-with-screenshots.test.js`
- Simple test: `frontend/tests/simple-login-test.cjs`

---

**Created:** October 24, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready to Use

