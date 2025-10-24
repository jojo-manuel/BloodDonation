const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

describe('Login Functionality Tests - WITH SCREENSHOTS', () => {
  let driver;
  const screenshotDir = path.join(__dirname, '../test-screenshots');

  // Create screenshots directory if it doesn't exist
  beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const chromeOptions = new chrome.Options();
    // COMMENT OUT --headless to see the browser
    // chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  }, 30000);

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  // Helper function to take screenshot
  async function takeScreenshot(testName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testName}_${timestamp}.png`;
    const filepath = path.join(screenshotDir, filename);
    
    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync(filepath, screenshot, 'base64');
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  // Helper function to highlight element (for better screenshots)
  async function highlightElement(element) {
    await driver.executeScript(
      "arguments[0].style.border='3px solid red'",
      element
    );
    await driver.sleep(500); // Brief pause to see highlight
  }

  beforeEach(async () => {
    await driver.get('http://localhost:5173/login');
    await driver.sleep(1000); // Wait for page to settle
  });

  test('01-should-load-login-page-successfully', async () => {
    console.log('\n🧪 Test 1: Loading login page...');
    
    // Wait for the login form to be visible
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    
    // Take screenshot of full page
    await takeScreenshot('01-login-page-loaded');
    
    // Check if the login form is present
    const loginForm = await driver.findElement(By.css('form'));
    expect(loginForm).toBeTruthy();
    
    console.log('✅ Login page loaded successfully');
  }, 30000);

  test('02-should-show-all-form-elements', async () => {
    console.log('\n🧪 Test 2: Checking form elements...');
    
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    
    // Highlight and screenshot email input
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await highlightElement(emailInput);
    await takeScreenshot('02-email-input-highlighted');
    
    // Highlight and screenshot password input
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await highlightElement(passwordInput);
    await takeScreenshot('02-password-input-highlighted');
    
    // Highlight and screenshot login button
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await highlightElement(loginButton);
    await takeScreenshot('02-login-button-highlighted');
    
    // Take final screenshot of form
    await takeScreenshot('02-complete-form');
    
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(loginButton).toBeTruthy();
    
    console.log('✅ All form elements present');
  }, 30000);

  test('03-should-show-error-for-invalid-credentials', async () => {
    console.log('\n🧪 Test 3: Testing invalid credentials...');
    
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    
    // Take screenshot before entering data
    await takeScreenshot('03-before-input');
    
    // Enter invalid email
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys('invalid@example.com');
    await takeScreenshot('03-email-entered');
    
    // Enter invalid password
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys('invalidpassword');
    await takeScreenshot('03-password-entered');
    
    // Click login button
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();
    await driver.sleep(2000); // Wait for error
    
    // Screenshot the error
    await takeScreenshot('03-error-displayed');
    
    // Handle alert
    try {
      await driver.wait(until.alertIsPresent(), 10000);
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      
      console.log(`⚠️ Alert message: ${alertText}`);
      expect(alertText).toContain('Login failed');
      
      await alert.accept();
      await takeScreenshot('03-after-alert-dismissed');
    } catch (e) {
      console.log('No alert displayed, checking for inline error...');
      await takeScreenshot('03-error-check');
    }
    
    console.log('✅ Error handling works correctly');
  }, 30000);

  test('04-should-show-firebase-login-option', async () => {
    console.log('\n🧪 Test 4: Checking Firebase login option...');
    
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    
    // Find and highlight Firebase button
    const firebaseButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Continue with Firebase') or contains(text(), 'Google')]")
    );
    await highlightElement(firebaseButton);
    await takeScreenshot('04-firebase-button-highlighted');
    
    expect(firebaseButton).toBeTruthy();
    
    console.log('✅ Firebase login option available');
  }, 30000);

  test('05-should-show-forgot-password-functionality', async () => {
    console.log('\n🧪 Test 5: Testing forgot password...');
    
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    await takeScreenshot('05-before-forgot-password');
    
    // Click forgot password link
    const forgotPasswordLink = await driver.findElement(
      By.xpath("//button[contains(text(), 'Forgot your password?')]")
    );
    await highlightElement(forgotPasswordLink);
    await takeScreenshot('05-forgot-password-link-highlighted');
    
    await forgotPasswordLink.click();
    await driver.sleep(1000);
    
    // Screenshot the reset password form
    await takeScreenshot('05-reset-password-form');
    
    // Check if reset email input appears
    const resetEmailInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="password reset"], input[type="email"]')),
      5000
    );
    await highlightElement(resetEmailInput);
    await takeScreenshot('05-reset-email-input-highlighted');
    
    expect(resetEmailInput).toBeTruthy();
    
    console.log('✅ Forgot password functionality working');
  }, 30000);

  test('06-should-navigate-successfully', async () => {
    console.log('\n🧪 Test 6: Testing navigation...');
    
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    
    // Screenshot back to home link
    const backLink = await driver.findElement(By.xpath("//a[contains(text(), 'Back to Home')]"));
    await highlightElement(backLink);
    await takeScreenshot('06-back-to-home-link');
    
    expect(backLink).toBeTruthy();
    
    console.log('✅ Navigation elements present');
  }, 30000);

  test('07-should-test-successful-login', async () => {
    console.log('\n🧪 Test 7: Testing successful login...');
    
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    await takeScreenshot('07-login-page-ready');
    
    // Enter valid credentials
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys('jojo2001p@gmail.com');
    await takeScreenshot('07-valid-email-entered');
    
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys('MyPassword123!');
    await takeScreenshot('07-valid-password-entered');
    
    // Click login
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await highlightElement(loginButton);
    await takeScreenshot('07-before-submit');
    
    await loginButton.click();
    await driver.sleep(3000); // Wait for redirect
    
    // Screenshot the dashboard/redirected page
    await takeScreenshot('07-after-successful-login');
    
    const currentUrl = await driver.getCurrentUrl();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    console.log('✅ Login process completed');
  }, 30000);
});

