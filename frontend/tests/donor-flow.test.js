const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Donor Complete Flow Tests', () => {
  let driver;
  const BASE_URL = 'http://localhost:5173';
  
  // Test credentials
  const DONOR_CREDENTIALS = {
    email: 'jojo2001p@gmail.com',
    password: 'MyPassword123!'
  };

  beforeAll(async () => {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
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

  test('should successfully login as donor', async () => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.sendKeys(DONOR_CREDENTIALS.email);

    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.sendKeys(DONOR_CREDENTIALS.password);

    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Wait for redirect to dashboard
    await driver.wait(until.urlContains('dashboard'), 15000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('dashboard');
  }, 30000);

  test('should navigate to donor registration page', async () => {
    await driver.get(`${BASE_URL}/donor-register`);
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Check if donor registration form is present
    const nameInput = await driver.findElement(By.css('input[name="name"], input[placeholder*="name" i]'));
    expect(nameInput).toBeTruthy();
  }, 30000);

  test('should load donor search page', async () => {
    await driver.get(`${BASE_URL}/donor-search`);
    await driver.wait(until.elementLocated(By.css('input, select')), 10000);

    // Check if search filters are present
    const pageTitle = await driver.getTitle();
    expect(pageTitle).toBeTruthy();
  }, 30000);

  test('should validate blood group selection', async () => {
    await driver.get(`${BASE_URL}/donor-register`);
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Check if blood group dropdown/select exists
    const bloodGroupElements = await driver.findElements(By.css('select, input[name*="blood"]'));
    expect(bloodGroupElements.length).toBeGreaterThan(0);
  }, 30000);

  test('should validate required fields', async () => {
    await driver.get(`${BASE_URL}/donor-register`);
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Try to submit without filling fields
    const submitButtons = await driver.findElements(By.css('button[type="submit"]'));
    if (submitButtons.length > 0) {
      await submitButtons[0].click();
      
      // Page should still be on register page (validation prevents submission)
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('register');
    }
  }, 30000);
});

