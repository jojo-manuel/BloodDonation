# 🔧 Donor Search Test Troubleshooting

## ❌ Test Failed: "TimeoutError: Waiting for element"

### 🔍 What Happened?
The tests failed because Selenium couldn't find the login page input field. This typically means:
1. ✅ Frontend server is running (check passed)
2. ❌ **But the login page structure is different than expected**

### 📊 Error Details
```
TimeoutError: Waiting for element to be located By(css selector, input[name="username"])
Wait timed out after 10181ms
```

This means Selenium opened Chrome and went to `http://localhost:5173/login`, but couldn't find an input field with `name="username"`.

---

## 🔧 Solution Steps

### Step 1: Check Your Login Page URL

**Open your browser manually and go to:**
```
http://localhost:5173/login
```

**Questions:**
1. Does the page load?
2. What does the URL redirect to?
3. Is there a login form visible?

### Step 2: Inspect Login Form Fields

**On the login page, right-click the username/email input field → Inspect Element**

Check what the field looks like:

**Option A: Field uses `name="username"`**
```html
<input name="username" type="text" />
```
✅ This is what the test expects

**Option B: Field uses `name="email"`**
```html
<input name="email" type="email" />
```
❌ Test needs updating

**Option C: Field has no name attribute**
```html
<input placeholder="Email" type="email" />
```
❌ Test needs updating

---

## 🛠️ Fix Options

### Option 1: Update Test Code (If login form is different)

If your login form uses different field names, update the test:

**File:** `frontend/features/step_definitions/donor_search_standalone_steps.cjs`

**Find line ~40:**
```javascript
await this.driver.findElement(By.css('input[name="username"]')).sendKeys('jeevan@gmail.com');
await this.driver.findElement(By.css('input[name="password"]')).sendKeys('password123');
```

**Change to match your form:**
```javascript
// If your form uses name="email"
await this.driver.findElement(By.css('input[name="email"]')).sendKeys('jeevan@gmail.com');
await this.driver.findElement(By.css('input[name="password"]')).sendKeys('password123');

// OR if using placeholder
await this.driver.findElement(By.css('input[placeholder="Email"]')).sendKeys('jeevan@gmail.com');
await this.driver.findElement(By.css('input[type="password"]')).sendKeys('password123');

// OR if using ID
await this.driver.findElement(By.id('email')).sendKeys('jeevan@gmail.com');
await this.driver.findElement(By.id('password')).sendKeys('password123');
```

---

### Option 2: Quick Manual Test

Let's create a simple test to see what's actually on your login page:

**Create file:** `test-login-page.js`

```javascript
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function testLoginPage() {
  console.log('🚀 Opening browser...');
  
  const options = new chrome.Options();
  options.addArguments('--window-size=1920,1080');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  try {
    console.log('🌐 Navigating to login page...');
    await driver.get('http://localhost:5173/login');
    
    console.log('⏳ Waiting 5 seconds for page to load...');
    await driver.sleep(5000);
    
    const currentUrl = await driver.getCurrentUrl();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    const pageTitle = await driver.getTitle();
    console.log(`📄 Page Title: ${pageTitle}`);
    
    const pageSource = await driver.getPageSource();
    console.log('📝 Checking for login form elements...');
    
    // Check various possible input names
    const checks = [
      { selector: 'input[name="username"]', desc: 'Username field (name="username")' },
      { selector: 'input[name="email"]', desc: 'Email field (name="email")' },
      { selector: 'input[type="email"]', desc: 'Email field (type="email")' },
      { selector: 'input[placeholder*="mail"]', desc: 'Email field (by placeholder)' },
      { selector: 'input[type="password"]', desc: 'Password field' },
      { selector: 'button[type="submit"]', desc: 'Submit button' },
    ];
    
    for (const check of checks) {
      try {
        const element = await driver.findElement(By.css(check.selector));
        console.log(`✅ FOUND: ${check.desc}`);
      } catch (e) {
        console.log(`❌ NOT FOUND: ${check.desc}`);
      }
    }
    
    console.log('\\n📸 Check the browser window to see what the page looks like!');
    console.log('Browser will close in 30 seconds...');
    await driver.sleep(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await driver.quit();
    console.log('🔚 Browser closed');
  }
})();
```

**Run it:**
```bash
cd frontend
node ../test-login-page.js
```

This will show you exactly what elements exist on your login page!

---

## 📋 Common Issues & Solutions

### Issue 1: Login page redirects immediately
**Problem:** You're already logged in from a previous session
**Solution:** Clear browser data or use incognito mode
```javascript
// Add to test before opening browser
const options = new chrome.Options();
options.addArguments('--incognito');
```

### Issue 2: Different login URL
**Problem:** Login page is at a different URL (e.g., `/signin`, `/auth/login`)
**Solution:** Update the URL in test:
```javascript
await this.driver.get('http://localhost:5173/signin'); // Change this
```

### Issue 3: React app not fully loaded
**Problem:** Page loads but React components haven't mounted yet
**Solution:** Increase wait time
```javascript
await this.driver.sleep(5000); // Increase from 3000 to 5000
```

### Issue 4: Different port number
**Problem:** Frontend running on different port (e.g., 5174, 3000)
**Solution:** Check your terminal and update URL:
```javascript
await this.driver.get('http://localhost:3000/login'); // Use correct port
```

---

## 🎯 Next Steps

1. **Run the manual test script above** to see what's actually on your login page
2. **Take note of the field selectors** that work
3. **Update the test file** with the correct selectors
4. **Run tests again**

---

## 📞 Still Stuck?

Share this information:
1. Current URL when you manually visit: http://localhost:5173/login
2. HTML structure of your login form (right-click → View Page Source)
3. Whether the login form uses `email` or `username` field
4. Any console errors in browser (F12 → Console tab)

---

**Created:** October 28, 2025  
**Issue:** Login element not found  
**Status:** Needs investigation

