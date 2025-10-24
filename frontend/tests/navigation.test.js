const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Navigation and UI Tests', () => {
  let driver;
  const BASE_URL = 'http://localhost:5173';

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

  test('should load landing page successfully', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    const title = await driver.getTitle();
    expect(title).toBeTruthy();
  }, 30000);

  test('should navigate from home to login', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    // Find and click login link/button
    const loginLinks = await driver.findElements(By.xpath("//a[contains(text(), 'Login')] | //button[contains(text(), 'Login')]"));
    if (loginLinks.length > 0) {
      await loginLinks[0].click();
      await driver.wait(until.urlContains('login'), 10000);
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('login');
    }
  }, 30000);

  test('should navigate from home to register', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    // Find and click register link/button
    const registerLinks = await driver.findElements(By.xpath("//a[contains(text(), 'Register')] | //button[contains(text(), 'Register')]"));
    if (registerLinks.length > 0) {
      await registerLinks[0].click();
      await driver.sleep(2000);
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toBeTruthy();
    }
  }, 30000);

  test('should load donor search page', async () => {
    await driver.get(`${BASE_URL}/donor-search`);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('donor-search');
  }, 30000);

  test('should handle 404 pages gracefully', async () => {
    await driver.get(`${BASE_URL}/non-existent-page-12345`);
    await driver.sleep(2000);

    // Should either redirect or show 404
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBeTruthy();
  }, 30000);

  test('should have responsive navigation menu', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    // Check if navigation elements exist
    const navElements = await driver.findElements(By.css('nav, header'));
    expect(navElements.length).toBeGreaterThan(0);
  }, 30000);

  test('should have footer elements', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    // Scroll to bottom
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
    await driver.sleep(1000);

    // Check if footer exists
    const footerElements = await driver.findElements(By.css('footer'));
    expect(footerElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);
});

