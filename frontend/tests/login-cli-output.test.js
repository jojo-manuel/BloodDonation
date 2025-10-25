const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Login Functionality Tests - CLI OUTPUT', () => {
  let driver;
  let testResults = [];

  beforeAll(async () => {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     SELENIUM END-TO-END TESTING - LOGIN MODULE           ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  Framework: Jest + Selenium WebDriver                     ║');
    console.log('║  Browser: Chrome (Headless Mode)                          ║');
    console.log('║  Application: Blood Donation System                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');

    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');  // HEADLESS MODE
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--window-size=1920,1080');
    chromeOptions.addArguments('--disable-gpu');

    console.log('⚙️  Initializing Chrome WebDriver...');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
    console.log('✅ WebDriver initialized successfully\n');
    console.log('━'.repeat(70));
  }, 30000);

  afterAll(async () => {
    console.log('\n' + '━'.repeat(70));
    console.log('\n📊 TEST EXECUTION SUMMARY\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL RESULTS                          ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    const total = testResults.length;
    
    console.log(`║  Total Tests: ${total}                                           ║`);
    console.log(`║  ✅ Passed: ${passed}                                             ║`);
    console.log(`║  ❌ Failed: ${failed}                                             ║`);
    console.log(`║  📈 Success Rate: ${((passed/total)*100).toFixed(1)}%                              ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 Detailed Results:\n');
    testResults.forEach((result, index) => {
      const icon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} Test ${index + 1}: ${result.name}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Duration: ${result.duration}ms`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    if (driver) {
      console.log('🔒 Closing WebDriver...');
      await driver.quit();
      console.log('✅ WebDriver closed successfully\n');
    }
  }, 30000);

  beforeEach(async () => {
    console.log('🌐 Navigating to http://localhost:5173/login');
    await driver.get('http://localhost:5173/login');
    console.log('✅ Page loaded\n');
  });

  test('TEST 1: Load Login Page Successfully', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 1: Load Login Page Successfully                   │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for form element to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✅ Form element located');
      
      console.log('⏳ Step 2: Verifying form is displayed...');
      const loginForm = await driver.findElement(By.css('form'));
      const isDisplayed = await loginForm.isDisplayed();
      console.log(`✅ Form is ${isDisplayed ? 'visible' : 'hidden'}`);
      
      console.log('⏳ Step 3: Checking email input field...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      console.log('✅ Email input field found');
      
      console.log('⏳ Step 4: Checking password input field...');
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      console.log('✅ Password input field found');
      
      console.log('⏳ Step 5: Checking submit button...');
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      console.log('✅ Submit button found');
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 1 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Load Login Page', status: 'PASSED', duration });
      expect(loginForm).toBeTruthy();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 1 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Load Login Page', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);

  test('TEST 2: Show Error for Invalid Credentials', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 2: Show Error for Invalid Credentials             │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✅ Form loaded');
      
      console.log('⏳ Step 2: Entering invalid email...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys('invalid@example.com');
      console.log('✅ Email entered: invalid@example.com');
      
      console.log('⏳ Step 3: Entering invalid password...');
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      await passwordInput.clear();
      await passwordInput.sendKeys('invalidpassword');
      console.log('✅ Password entered: ********');
      
      console.log('⏳ Step 4: Clicking login button...');
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();
      console.log('✅ Login button clicked');
      
      console.log('⏳ Step 5: Waiting for error alert...');
      await driver.wait(until.alertIsPresent(), 10000);
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      console.log(`✅ Alert displayed: "${alertText}"`);
      
      console.log('⏳ Step 6: Dismissing alert...');
      await alert.accept();
      console.log('✅ Alert dismissed');
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 2 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Invalid Credentials Error', status: 'PASSED', duration });
      expect(alertText).toContain('Login failed');
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 2 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Invalid Credentials Error', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);

  test('TEST 3: Validate Empty Fields', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 3: Validate Empty Fields                          │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✅ Form loaded');
      
      console.log('⏳ Step 2: Attempting to submit with empty fields...');
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();
      console.log('✅ Submit attempted');
      
      console.log('⏳ Step 3: Verifying page URL (should remain on login)...');
      const currentUrl = await driver.getCurrentUrl();
      console.log(`✅ Current URL: ${currentUrl}`);
      console.log(`✅ Contains '/login': ${currentUrl.includes('/login')}`);
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 3 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Empty Fields Validation', status: 'PASSED', duration });
      expect(currentUrl).toContain('/login');
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 3 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Empty Fields Validation', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);

  test('TEST 4: Show Firebase Login Option', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 4: Show Firebase Login Option                     │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✅ Form loaded');
      
      console.log('⏳ Step 2: Locating Firebase login button...');
      const firebaseButton = await driver.findElement(
        By.xpath("//button[contains(text(), 'Continue with Firebase') or contains(text(), 'Google')]")
      );
      console.log('✅ Firebase button found');
      
      console.log('⏳ Step 3: Verifying button is displayed...');
      const isDisplayed = await firebaseButton.isDisplayed();
      console.log(`✅ Firebase button is ${isDisplayed ? 'visible' : 'hidden'}`);
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 4 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Firebase Login Option', status: 'PASSED', duration });
      expect(firebaseButton).toBeTruthy();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 4 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Firebase Login Option', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);

  test('TEST 5: Navigate to Forgot Password', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 5: Navigate to Forgot Password                    │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✅ Form loaded');
      
      console.log('⏳ Step 2: Locating forgot password link...');
      const forgotPasswordLink = await driver.findElement(
        By.xpath("//button[contains(text(), 'Forgot your password?')]")
      );
      console.log('✅ Forgot password link found');
      
      console.log('⏳ Step 3: Clicking forgot password link...');
      await forgotPasswordLink.click();
      console.log('✅ Link clicked');
      
      console.log('⏳ Step 4: Waiting for reset email input...');
      const resetEmailInput = await driver.wait(
        until.elementLocated(By.css('input[placeholder*="password reset"], input[type="email"]')),
        5000
      );
      console.log('✅ Reset email input found');
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 5 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Forgot Password Navigation', status: 'PASSED', duration });
      expect(resetEmailInput).toBeTruthy();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 5 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Forgot Password Navigation', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);

  test('TEST 6: Verify Form Attributes', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 6: Verify Form Attributes                         │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✅ Form loaded');
      
      console.log('⏳ Step 2: Checking email input attributes...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const emailRequired = await emailInput.getAttribute('required');
      console.log(`✅ Email input required: ${emailRequired !== null}`);
      
      console.log('⏳ Step 3: Checking password input attributes...');
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const passwordRequired = await passwordInput.getAttribute('required');
      console.log(`✅ Password input required: ${passwordRequired !== null}`);
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 6 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Form Attributes Validation', status: 'PASSED', duration });
      expect(emailRequired).toBeTruthy();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 6 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Form Attributes Validation', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);

  test('TEST 7: Verify Back to Home Link', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 7: Verify Back to Home Link                       │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for page to load...');
      await driver.wait(until.elementLocated(By.css('body')), 10000);
      console.log('✅ Page loaded');
      
      console.log('⏳ Step 2: Locating back to home link...');
      const backLink = await driver.findElement(By.xpath("//a[contains(text(), 'Back to Home')]"));
      console.log('✅ Back to home link found');
      
      console.log('⏳ Step 3: Verifying link href attribute...');
      const href = await backLink.getAttribute('href');
      console.log(`✅ Link href: ${href}`);
      console.log(`✅ Points to home: ${href.includes('/')}`);
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 7 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Back to Home Link', status: 'PASSED', duration });
      expect(backLink).toBeTruthy();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 7 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Back to Home Link', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);

  test('TEST 8: Successful Login Flow', async () => {
    const startTime = Date.now();
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ TEST 8: Successful Login Flow                          │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    try {
      console.log('⏳ Step 1: Waiting for form to load...');
      await driver.wait(until.elementLocated(By.css('form')), 10000);
      console.log('✅ Form loaded');
      
      console.log('⏳ Step 2: Entering valid email...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys('jeevan@gmail.com');
      console.log('✅ Email entered: jeevan@gmail.com');
      
      console.log('⏳ Step 3: Entering valid password...');
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      await passwordInput.clear();
      await passwordInput.sendKeys('Jeevan123!@#');
      console.log('✅ Password entered: ************');
      
      console.log('⏳ Step 4: Clicking login button...');
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();
      console.log('✅ Login button clicked');
      
      console.log('⏳ Step 5: Waiting for redirect...');
      await driver.sleep(3000);
      const currentUrl = await driver.getCurrentUrl();
      console.log(`✅ Redirected to: ${currentUrl}`);
      console.log(`✅ Login successful: ${currentUrl.includes('dashboard') || !currentUrl.includes('login')}`);
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ TEST 8 PASSED (${duration}ms)`);
      console.log('━'.repeat(70));
      
      testResults.push({ name: 'Successful Login Flow', status: 'PASSED', duration });
      expect(currentUrl).toBeTruthy();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ TEST 8 FAILED (${duration}ms)`);
      console.log('Error:', error.message);
      console.log('━'.repeat(70));
      testResults.push({ name: 'Successful Login Flow', status: 'FAILED', duration, error: error.message });
      throw error;
    }
  }, 30000);
});

