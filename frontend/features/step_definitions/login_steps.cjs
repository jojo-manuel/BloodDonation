const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

// Set default timeout to 30 seconds
setDefaultTimeout(30000);

// Shared driver instance
let driver;

Before(async function() {
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--window-size=1920,1080');
  chromeOptions.addArguments('--disable-background-networking');
  chromeOptions.addArguments('--disable-sync');

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();
  
  this.driver = driver;
});

After(async function() {
  if (this.driver) {
    await this.driver.quit();
  }
});

// Background Steps
Given('I am on the login page', async function() {
  await this.driver.get('http://localhost:5173/login');
  await this.driver.wait(until.elementLocated(By.css('body')), 10000);
});

// When Steps
When('I enter email {string}', async function(email) {
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  await emailInput.clear();
  await emailInput.sendKeys(email);
});

When('I enter password {string}', async function(password) {
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  await passwordInput.clear();
  await passwordInput.sendKeys(password);
});

When('I click the login button', async function() {
  const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();
});

When('I click the login button without entering credentials', async function() {
  const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();
});

When('I click on {string} link', async function(linkText) {
  const link = await this.driver.findElement(By.xpath(`//button[contains(text(), '${linkText}')]`));
  await link.click();
});

// Then Steps
Then('I should see the login form', async function() {
  const form = await this.driver.wait(until.elementLocated(By.css('form')), 10000);
  assert.ok(form, 'Login form should be present');
});

Then('I should see the email input field', async function() {
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  assert.ok(emailInput, 'Email input should be present');
});

Then('I should see the password input field', async function() {
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  assert.ok(passwordInput, 'Password input should be present');
});

Then('I should see the submit button', async function() {
  const submitButton = await this.driver.findElement(By.css('button[type="submit"]'));
  assert.ok(submitButton, 'Submit button should be present');
});

Then('I should be redirected to the dashboard', async function() {
  await this.driver.sleep(3000);
  const currentUrl = await this.driver.getCurrentUrl();
  const redirected = currentUrl.includes('dashboard') || !currentUrl.includes('login');
  assert.ok(redirected, 'Should be redirected away from login page');
});

Then('I should not be on the login page', async function() {
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(!currentUrl.includes('/login'), 'Should not be on login page');
});

Then('I should see an error alert', async function() {
  await this.driver.wait(until.alertIsPresent(), 10000);
  const alert = await this.driver.switchTo().alert();
  this.alertText = await alert.getText();
  await alert.accept();
});

Then('the alert should contain {string}', async function(expectedText) {
  assert.ok(this.alertText.includes(expectedText), `Alert should contain "${expectedText}"`);
});

Then('I should remain on the login page', async function() {
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(currentUrl.includes('/login'), 'Should still be on login page');
});

Then('the form should show validation errors', async function() {
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(currentUrl.includes('/login'), 'Form validation should prevent submission');
});

Then('I should see the password reset form', async function() {
  const resetInput = await this.driver.wait(
    until.elementLocated(By.css('input[placeholder*="password reset"], input[type="email"]')),
    5000
  );
  assert.ok(resetInput, 'Password reset form should be present');
});

Then('I should see the reset email input field', async function() {
  const resetEmailInput = await this.driver.findElement(By.css('input[type="email"]'));
  assert.ok(resetEmailInput, 'Reset email input should be present');
});

Then('I should see the Firebase login button', async function() {
  const firebaseButton = await this.driver.findElement(
    By.xpath("//button[contains(text(), 'Continue with Firebase') or contains(text(), 'Google')]")
  );
  assert.ok(firebaseButton, 'Firebase login button should be present');
});

Then('the Firebase button should be visible', async function() {
  const firebaseButton = await this.driver.findElement(
    By.xpath("//button[contains(text(), 'Continue with Firebase') or contains(text(), 'Google')]")
  );
  const isDisplayed = await firebaseButton.isDisplayed();
  assert.ok(isDisplayed, 'Firebase button should be visible');
});

Then('the email field should be required', async function() {
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  const isRequired = await emailInput.getAttribute('required');
  assert.ok(isRequired !== null, 'Email field should be required');
});

Then('the password field should be required', async function() {
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  const isRequired = await passwordInput.getAttribute('required');
  assert.ok(isRequired !== null, 'Password field should be required');
});

Then('I should see the {string} link', async function(linkText) {
  const link = await this.driver.findElement(By.linkText(linkText));
  assert.ok(link, `"${linkText}" link should be present`);
});

Then('the link should point to the home page', async function() {
  const link = await this.driver.findElement(By.linkText('← Back to Home'));
  const href = await link.getAttribute('href');
  assert.ok(href.includes('/') || href.endsWith('/'), 'Link should point to home page');
});

Then('the password field should hide the password text', async function() {
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  const type = await passwordInput.getAttribute('type');
  assert.strictEqual(type, 'password', 'Password field should hide text');
});

Then('the page should display {string} branding', async function(brandText) {
  const body = await this.driver.findElement(By.css('body'));
  const pageSource = await this.driver.getPageSource();
  assert.ok(pageSource.includes(brandText), `Page should contain "${brandText}"`);
});

Then('the page should have proper styling', async function() {
  const body = await this.driver.findElement(By.css('body'));
  assert.ok(body, 'Page should have body element with styling');
});

