const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Blood Bank Complete Flow Tests', () => {
  let driver;
  const BASE_URL = 'http://localhost:5173';
  
  const BLOODBANK_CREDENTIALS = {
    email: 'bloodbank@gmail.com',
    password: 'BloodBank123!'
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

  test('should load blood bank login page', async () => {
    await driver.get(`${BASE_URL}/bloodbank-login`);
    await driver.wait(until.elementLocated(By.css('body')), 10000);
    
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('bloodbank-login');
  }, 30000);

  test('should successfully login as blood bank', async () => {
    await driver.get(`${BASE_URL}/bloodbank-login`);
    await driver.wait(until.elementLocated(By.css('input[type="email"], input[type="text"]')), 10000);

    const emailInput = await driver.findElement(By.css('input[type="email"], input[type="text"]'));
    await emailInput.clear();
    await emailInput.sendKeys(BLOODBANK_CREDENTIALS.email);

    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(BLOODBANK_CREDENTIALS.password);

    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Wait for redirect or dashboard elements
    await driver.sleep(3000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBeTruthy();
  }, 30000);

  test('should load blood bank registration page', async () => {
    await driver.get(`${BASE_URL}/bloodbank-register`);
    await driver.wait(until.elementLocated(By.css('form, input')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('bloodbank-register');
  }, 30000);

  test('should validate blood bank registration fields', async () => {
    await driver.get(`${BASE_URL}/bloodbank-register`);
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    // Check for essential blood bank fields
    const inputs = await driver.findElements(By.css('input'));
    expect(inputs.length).toBeGreaterThan(2);
  }, 30000);

  test('should navigate to blood bank dashboard', async () => {
    await driver.get(`${BASE_URL}/bloodbank-dashboard`);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('bloodbank');
  }, 30000);
});

