const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Login Functionality Tests', () => {
  let driver;
  let testResults = [];

  beforeAll(async () => {
    console.log('\n========================================');
    console.log('       LOGIN TEST SUITE');
    console.log('========================================');
    console.log('Setting up Chrome browser...');
    
    // Set up Chrome options for headless mode
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--window-size=1920,1080');
    chromeOptions.addArguments('--disable-background-networking');
    chromeOptions.addArguments('--disable-sync');
    chromeOptions.excludeSwitches(['enable-logging']);

    // Build the WebDriver instance
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
    
    console.log('✓ Chrome browser setup complete\n');
  }, 30000);

  afterAll(async () => {
    console.log('\n========================================');
    console.log('       TEST REPORT');
    console.log('========================================');
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    
    testResults.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      const status = result.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      console.log(`${icon} Test ${index + 1}: ${result.name} - ${status}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    console.log('\n----------------------------------------');
    console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('========================================\n');
    
    if (driver) {
      console.log('Closing browser...');
      await driver.quit();
      console.log('✓ Browser closed successfully\n');
    }
  }, 30000);

  beforeEach(async () => {
    // Navigate to the login page before each test
    console.log('Navigating to http://localhost:5173/login');
    await driver.get('http://localhost:5173/login');
    console.log('✓ Page loaded successfully\n');
  });

  test('should load login page successfully', async () => {
    console.log('TEST 1: Load Login Page Successfully');
    console.log('----------------------------------------');
    
    try {
      console.log('Step 1: Waiting for form element to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✓ Form element located');

      console.log('Step 2: Verifying form is displayed...');
      const loginForm = await driver.findElement(By.css('form'));
      expect(loginForm).toBeTruthy();
      console.log('✓ Form is visible');

      console.log('Step 3: Checking email input field...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      expect(emailInput).toBeTruthy();
      console.log('✓ Email input field found');

      console.log('Step 4: Checking password input field...');
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      expect(passwordInput).toBeTruthy();
      console.log('✓ Password input field found');

      console.log('Step 5: Checking submit button...');
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      expect(loginButton).toBeTruthy();
      console.log('✓ Submit button found');
      
      console.log('✓ TEST 1 PASSED\n');
      testResults.push({ name: 'Load Login Page Successfully', status: 'PASS' });
    } catch (error) {
      console.log('✗ TEST 1 FAILED:', error.message, '\n');
      testResults.push({ name: 'Load Login Page Successfully', status: 'FAIL', error: error.message });
      throw error;
    }
  }, 30000);

  test('should show error for invalid credentials', async () => {
    console.log('TEST 2: Show Error for Invalid Credentials');
    console.log('----------------------------------------');
    
    try {
      console.log('Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✓ Form loaded');

      console.log('Step 2: Entering invalid email (invalid@example.com)...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys('invalid@example.com');
      console.log('✓ Invalid email entered');

      console.log('Step 3: Entering invalid password...');
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      await passwordInput.clear();
      await passwordInput.sendKeys('invalidpassword');
      console.log('✓ Invalid password entered');

      console.log('Step 4: Clicking login button...');
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();
      console.log('✓ Login button clicked');

      console.log('Step 5: Waiting for error alert...');
      await driver.wait(until.alertIsPresent(), 10000);
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      console.log(`✓ Alert received: "${alertText}"`);

      console.log('Step 6: Verifying error message contains "Login Failed"...');
      expect(alertText).toContain('Login Failed');
      await alert.accept();
      console.log('✓ Alert dismissed');
      
      console.log('✓ TEST 2 PASSED\n');
      testResults.push({ name: 'Show Error for Invalid Credentials', status: 'PASS' });
    } catch (error) {
      console.log('✗ TEST 2 FAILED:', error.message, '\n');
      testResults.push({ name: 'Show Error for Invalid Credentials', status: 'FAIL', error: error.message });
      throw error;
    }
  }, 30000);

  test('should show validation error for empty fields', async () => {
    // Wait for the form to load
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Try to submit form without filling fields
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Check if browser validation prevents submission (HTML5 validation)
    // The form should not submit due to required attributes
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/login'); // Should still be on login page
  });

  test('should navigate to forgot password section', async () => {
    // Wait for the form to load
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Click forgot password link
    const forgotPasswordLink = await driver.findElement(By.xpath("//button[contains(text(), 'Forgot your password?')]"));
    await forgotPasswordLink.click();

    // Check if reset email input appears
    const resetEmailInput = await driver.wait(until.elementLocated(By.css('input[placeholder*="password reset"]')), 5000);
    expect(resetEmailInput).toBeTruthy();
  });

  test('should show Firebase login option', async () => {
    // Wait for the form to load
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Check if Firebase login button is present
    const firebaseButton = await driver.findElement(By.xpath("//button[contains(text(), 'Continue with Firebase')]"));
    expect(firebaseButton).toBeTruthy();

    // Check if Google logo is present in the button
    const googleIcon = await firebaseButton.findElement(By.css('svg'));
    expect(googleIcon).toBeTruthy();
  });

  test('should have proper form attributes', async () => {
    // Wait for the form to load
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));

    // Check required attributes
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');

    expect(emailRequired).toBeTruthy();
    expect(passwordRequired).toBeTruthy();
  });

  test('should display progress bar correctly', async () => {
    // Check if progress bar is present
    const progressBar = await driver.findElement(By.css('.flex.items-center.justify-between'));
    expect(progressBar).toBeTruthy();

    // Check if login step is highlighted
    const loginStep = await driver.findElement(By.xpath("//span[contains(text(), 'Login')]"));
    const loginStepClass = await loginStep.getAttribute('class');
    expect(loginStepClass).toContain('text-pink-400');
  });

  test('should have back to home link', async () => {
    // Check if back to home link exists
    const backLink = await driver.findElement(By.linkText('← Back to Home'));
    expect(backLink).toBeTruthy();

    // Check if link points to correct URL
    const href = await backLink.getAttribute('href');
    expect(href).toContain('/');
  });

  test('should successfully login with jeevan@gmail.com', async () => {
    console.log('TEST 9: Successful Login with jeevan@gmail.com');
    console.log('----------------------------------------');
    
    try {
      console.log('Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✓ Form loaded');

      console.log('Step 2: Entering valid email (jeevan@gmail.com)...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys('jeevan@gmail.com');
      console.log('✓ Email entered: jeevan@gmail.com');

      console.log('Step 3: Entering valid password...');
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      await passwordInput.clear();
      await passwordInput.sendKeys('Jeevan123!@#');
      console.log('✓ Password entered: ************');

      console.log('Step 4: Clicking login button...');
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();
      console.log('✓ Login button clicked');

      console.log('Step 5: Waiting for redirect...');
      await driver.sleep(3000);
      const currentUrl = await driver.getCurrentUrl();
      console.log(`✓ Current URL: ${currentUrl}`);

      console.log('Step 6: Verifying successful redirect...');
      const redirected = currentUrl.includes('dashboard') || !currentUrl.includes('login');
      expect(redirected).toBeTruthy();
      console.log('✓ Successfully redirected from login page');
      
      console.log('✓ TEST 9 PASSED\n');
      testResults.push({ name: 'Successful Login with jeevan@gmail.com', status: 'PASS' });
    } catch (error) {
      console.log('✗ TEST 9 FAILED:', error.message, '\n');
      testResults.push({ name: 'Successful Login with jeevan@gmail.com', status: 'FAIL', error: error.message });
      throw error;
    }
  }, 30000);
});
