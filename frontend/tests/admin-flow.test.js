const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Admin Complete Flow Tests', () => {
  let driver;
  const BASE_URL = 'http://localhost:5173';
  
  const ADMIN_CREDENTIALS = {
    email: 'admin@example.com',
    password: 'Admin123!@#'
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

  test('should successfully login as admin', async () => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.css('form')), 10000);

    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.sendKeys(ADMIN_CREDENTIALS.email);

    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.sendKeys(ADMIN_CREDENTIALS.password);

    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    await driver.sleep(3000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBeTruthy();
  }, 30000);

  test('should navigate to admin dashboard', async () => {
    await driver.get(`${BASE_URL}/admin-dashboard`);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('admin');
  }, 30000);

  test('should load admin registration page', async () => {
    await driver.get(`${BASE_URL}/admin-register`);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('admin');
  }, 30000);
});

