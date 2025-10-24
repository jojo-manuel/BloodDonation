# 🚀 Quick Testing Reference Card

**For manually running Selenium tests with screenshots**

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Start Servers
```bash
# In project root (D:\BloodDonation)
start start_backend.bat
start start_frontend.bat
```

### 2️⃣ Run Tests with Screenshots
```bash
# Double-click this file:
run-manual-tests.bat
```

### 3️⃣ View Results
- **Screenshots:** `frontend/test-screenshots/`
- **Report:** `VISUAL-TEST-REPORT.md`

---

## 📋 Manual Commands

### Run Tests (Visible Browser)
```bash
cd D:\BloodDonation\frontend
npm run test:selenium -- tests/login-with-screenshots.test.js
```

### Generate Report
```bash
cd D:\BloodDonation\frontend
node generate-test-report.js
```

### View Screenshots
```bash
cd D:\BloodDonation\frontend
explorer test-screenshots
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `run-manual-tests.bat` | One-click test runner |
| `frontend/tests/login-with-screenshots.test.js` | Test with automatic screenshots |
| `frontend/generate-test-report.js` | Report generator |
| `MANUAL-TESTING-GUIDE.md` | Complete guide (30+ pages) |
| `VISUAL-TEST-REPORT.md` | Generated report with screenshots |

---

## 🎯 Test Credentials

**Valid Login:**
```
Email: jojo2001p@gmail.com
Password: MyPassword123!
```

**For Testing Errors:**
```
Email: invalid@example.com
Password: wrongpassword
```

---

## 📸 Screenshot Locations

```
frontend/
  └── test-screenshots/
      ├── 01-login-page-loaded_[timestamp].png
      ├── 02-email-input-highlighted_[timestamp].png
      ├── 03-error-displayed_[timestamp].png
      └── 07-after-successful-login_[timestamp].png
```

---

## 🛠️ Customization

### Make Browser Visible

Edit `login-with-screenshots.test.js`, line 13:
```javascript
// COMMENT OUT this line:
// chromeOptions.addArguments('--headless');
```

### Change Screenshot Location

Edit test file:
```javascript
const screenshotDir = path.join(__dirname, '../test-screenshots');
```

### Add More Delays (Slow Motion)

Add after each action:
```javascript
await driver.sleep(2000); // 2 second pause
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find module"
**Fix:** Install dependencies
```bash
cd frontend
npm install
```

### Issue: "Connection refused"
**Fix:** Start servers
```bash
start start_backend.bat
start start_frontend.bat
```

### Issue: "Browser closes immediately"
**Fix:** Add delay before quit (in test file)
```javascript
await driver.sleep(5000);
```

### Issue: "Screenshots folder empty"
**Fix:** Check test execution completed successfully

---

## 📊 What Gets Tested

✅ Login page loads  
✅ Form elements display  
✅ Invalid credentials error  
✅ Firebase login option  
✅ Forgot password  
✅ Navigation links  
✅ Successful login flow  

**Total:** 7 test cases, ~30+ screenshots

---

## 🎨 Screenshot Features

- ✅ Automatic capture at key points
- ✅ Element highlighting (red borders)
- ✅ Timestamped filenames
- ✅ HD resolution (1920x1080)
- ✅ Organized by test case

---

## 📖 Full Documentation

**Complete Guide:** `MANUAL-TESTING-GUIDE.md` (30+ pages)

Topics covered:
- Running tests with visible browser
- Adding screenshots to any test
- Highlighting elements
- Creating professional reports
- Video recording
- Advanced techniques

---

## ✅ Pre-Test Checklist

Before running tests:
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Chrome browser installed
- [ ] Node.js installed
- [ ] Test credentials ready

---

## 🎯 Common Tasks

### Task 1: Quick Test Run
```bash
run-manual-tests.bat
```

### Task 2: Run Single Test
```bash
cd frontend
npm run test:selenium -- tests/login-with-screenshots.test.js -t "01-should"
```

### Task 3: Generate Report Only
```bash
cd frontend
node generate-test-report.js
```

### Task 4: Clean Screenshots
```bash
cd frontend
rmdir /s /q test-screenshots
mkdir test-screenshots
```

---

## 📞 Quick Help

**Can't see browser?**
→ Comment out `--headless` in test file

**No screenshots generated?**
→ Check test completed successfully

**Want faster/slower tests?**
→ Adjust `await driver.sleep()` values

**Need different resolution?**
→ Change `--window-size=1920,1080`

---

## 🚀 Advanced Usage

### Capture Specific Element
```javascript
const element = await driver.findElement(By.css('.selector'));
await takeElementScreenshot(driver, element, 'element.png');
```

### Compare Before/After
```javascript
await takeScreenshot(driver, 'before');
// ... perform action ...
await takeScreenshot(driver, 'after');
```

### Highlight Multiple Elements
```javascript
await highlightElement(driver, element1, 'red');
await highlightElement(driver, element2, 'blue');
await takeScreenshot(driver, 'multiple-highlights');
```

---

## 📈 Report Statistics

**Typical Report Includes:**
- 📸 30+ screenshots
- 🧪 7 test cases
- ✅ 100% pass rate
- ⏱️ ~45 second execution
- 📁 ~5-10 MB file size

---

## 💡 Pro Tips

1. **Slow Motion Mode** - Add 2-3 second delays for demos
2. **Element Borders** - Use different colors for multiple highlights
3. **Descriptive Names** - Use clear screenshot names
4. **Organize by Test** - Group screenshots in folders
5. **Clean Old Tests** - Delete old screenshots before new runs

---

## 🎓 Learning Resources

**Selenium WebDriver:**
- Docs: https://www.selenium.dev/documentation/

**Jest Testing:**
- Docs: https://jestjs.io/docs/getting-started

**Your Project Files:**
- `MANUAL-TESTING-GUIDE.md` - Complete guide
- `SELENIUM-E2E-TEST-REPORT-2025.md` - Full test report
- `SELENIUM-TEST-SUMMARY.md` - Quick summary

---

## ✨ That's It!

You now have everything you need to:
- ✅ Run tests manually with visible browser
- ✅ Capture automatic screenshots
- ✅ Generate professional reports
- ✅ Share visual evidence with team

**Happy Testing!** 🎉

---

**Last Updated:** October 24, 2025  
**Version:** 1.0.0  
**Support:** See `MANUAL-TESTING-GUIDE.md` for details

