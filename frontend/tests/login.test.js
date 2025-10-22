const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Login Functionality Tests', () => {
  let driver;

  beforeAll(async () => {
    // Set up Chrome options for headless mode
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--window-size=1920,1080');

    // Build the WebDriver instance
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async () => {
    // Navigate to the login page before each test
    await driver.get('http://localhost:5173/login'); // Adjust URL as needed
  });

  test('should load login page successfully', async () => {
    // Wait for the login form to be visible
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Check if the login form is present
    const loginForm = await driver.findElement(By.css('form'));
    expect(loginForm).toBeTruthy();

    // Check if email input field is present
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    expect(emailInput).toBeTruthy();

    // Check if password input field is present
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    expect(passwordInput).toBeTruthy();

    // Check if login button is present
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    expect(loginButton).toBeTruthy();
  });

  test('should show error for invalid credentials', async () => {
    // Wait for the form to load
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Enter invalid email
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys('invalid@example.com');

    // Enter invalid password
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys('invalidpassword');

    // Click login button
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Wait for alert or error message
    await driver.wait(until.alertIsPresent(), 10000);
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();

    // Verify error message
    expect(alertText).toContain('Login failed');
    await alert.accept();
  });

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
});
