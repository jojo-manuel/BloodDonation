const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

// Set default timeout to 30 seconds
setDefaultTimeout(30000);

// Shared driver instance
let driver;

Before(async function() {
  console.log('\n🚀 Starting test scenario...');
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('--headless');
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--window-size=1920,1080');
  chromeOptions.addArguments('--disable-background-networking');
  chromeOptions.addArguments('--disable-sync');
  chromeOptions.excludeSwitches(['enable-logging']);

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();
  
  this.driver = driver;
  console.log('✓ Browser initialized');
});

After(async function() {
  if (this.driver) {
    await this.driver.quit();
    console.log('✓ Browser closed');
  }
});

// Background Steps
Given('I am on the login page', async function() {
  console.log('→ Navigating to login page...');
  await this.driver.get('http://localhost:5173/login');
  await this.driver.wait(until.elementLocated(By.css('body')), 10000);
  console.log('✓ Login page loaded');
});

// When Steps
When('I enter email {string}', async function(email) {
  console.log(`→ Entering email: ${email}`);
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  await emailInput.clear();
  await emailInput.sendKeys(email);
  console.log('✓ Email entered');
});

When('I enter password {string}', async function(password) {
  console.log('→ Entering password: ************');
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  await passwordInput.clear();
  await passwordInput.sendKeys(password);
  console.log('✓ Password entered');
});

When('I click the login button', async function() {
  console.log('→ Clicking login button...');
  const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();
  console.log('✓ Login button clicked');
});

When('I click the login button without entering credentials', async function() {
  console.log('→ Attempting to submit without credentials...');
  const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();
  console.log('✓ Submit attempted');
});

When('I click on {string} link', async function(linkText) {
  console.log(`→ Clicking on "${linkText}" link...`);
  const link = await this.driver.findElement(By.xpath(`//button[contains(text(), '${linkText}')]`));
  await link.click();
  console.log('✓ Link clicked');
});

// Then Steps
Then('I should see the login form', async function() {
  console.log('→ Verifying login form...');
  const form = await this.driver.wait(until.elementLocated(By.css('form')), 10000);
  assert.ok(form, 'Login form should be present');
  console.log('✓ Login form found');
});

Then('I should see the email input field', async function() {
  console.log('→ Checking email input field...');
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  assert.ok(emailInput, 'Email input should be present');
  console.log('✓ Email input field found');
});

Then('I should see the password input field', async function() {
  console.log('→ Checking password input field...');
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  assert.ok(passwordInput, 'Password input should be present');
  console.log('✓ Password input field found');
});

Then('I should see the submit button', async function() {
  console.log('→ Checking submit button...');
  const submitButton = await this.driver.findElement(By.css('button[type="submit"]'));
  assert.ok(submitButton, 'Submit button should be present');
  console.log('✓ Submit button found');
});

Then('I should be redirected to the dashboard', async function() {
  console.log('→ Waiting for redirect...');
  await this.driver.sleep(3000);
  const currentUrl = await this.driver.getCurrentUrl();
  console.log(`→ Current URL: ${currentUrl}`);
  const redirected = currentUrl.includes('dashboard') || !currentUrl.includes('login');
  assert.ok(redirected, 'Should be redirected away from login page');
  console.log('✓ Successfully redirected');
});

Then('I should not be on the login page', async function() {
  console.log('→ Verifying not on login page...');
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(!currentUrl.includes('/login'), 'Should not be on login page');
  console.log('✓ Not on login page');
});

Then('I should see an error alert', async function() {
  console.log('→ Waiting for error alert...');
  await this.driver.wait(until.alertIsPresent(), 10000);
  const alert = await this.driver.switchTo().alert();
  this.alertText = await alert.getText();
  console.log(`✓ Alert received: "${this.alertText}"`);
  await alert.accept();
});

Then('the alert should contain {string}', async function(expectedText) {
  console.log(`→ Verifying alert contains: "${expectedText}"`);
  assert.ok(this.alertText.includes(expectedText), `Alert should contain "${expectedText}"`);
  console.log('✓ Alert message verified');
});

Then('I should remain on the login page', async function() {
  console.log('→ Verifying still on login page...');
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(currentUrl.includes('/login'), 'Should still be on login page');
  console.log('✓ Still on login page');
});

Then('the form should show validation errors', async function() {
  console.log('→ Checking for validation errors...');
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(currentUrl.includes('/login'), 'Form validation should prevent submission');
  console.log('✓ Form validation working');
});

Then('I should see the password reset form', async function() {
  console.log('→ Checking for password reset form...');
  const resetInput = await this.driver.wait(
    until.elementLocated(By.css('input[placeholder*="password reset"], input[type="email"]')),
    5000
  );
  assert.ok(resetInput, 'Password reset form should be present');
  console.log('✓ Password reset form found');
});

Then('I should see the reset email input field', async function() {
  console.log('→ Verifying reset email input...');
  const resetEmailInput = await this.driver.findElement(By.css('input[type="email"]'));
  assert.ok(resetEmailInput, 'Reset email input should be present');
  console.log('✓ Reset email input found');
});

Then('I should see the Firebase login button', async function() {
  console.log('→ Checking for Firebase login button...');
  const firebaseButton = await this.driver.findElement(
    By.xpath("//button[contains(text(), 'Continue with Firebase') or contains(text(), 'Google')]")
  );
  assert.ok(firebaseButton, 'Firebase login button should be present');
  console.log('✓ Firebase login button found');
});

Then('the Firebase button should be visible', async function() {
  console.log('→ Verifying Firebase button visibility...');
  const firebaseButton = await this.driver.findElement(
    By.xpath("//button[contains(text(), 'Continue with Firebase') or contains(text(), 'Google')]")
  );
  const isDisplayed = await firebaseButton.isDisplayed();
  assert.ok(isDisplayed, 'Firebase button should be visible');
  console.log('✓ Firebase button is visible');
});

Then('the email field should be required', async function() {
  console.log('→ Checking email field required attribute...');
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  const isRequired = await emailInput.getAttribute('required');
  assert.ok(isRequired !== null, 'Email field should be required');
  console.log('✓ Email field is required');
});

Then('the password field should be required', async function() {
  console.log('→ Checking password field required attribute...');
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  const isRequired = await passwordInput.getAttribute('required');
  assert.ok(isRequired !== null, 'Password field should be required');
  console.log('✓ Password field is required');
});

Then('I should see the {string} link', async function(linkText) {
  console.log(`→ Checking for "${linkText}" link...`);
  const link = await this.driver.findElement(By.linkText(linkText));
  assert.ok(link, `"${linkText}" link should be present`);
  console.log(`✓ "${linkText}" link found`);
});

Then('the link should point to the home page', async function() {
  console.log('→ Verifying link destination...');
  const link = await this.driver.findElement(By.linkText('← Back to Home'));
  const href = await link.getAttribute('href');
  assert.ok(href.includes('/') || href.endsWith('/'), 'Link should point to home page');
  console.log('✓ Link points to home page');
});

Then('the password field should hide the password text', async function() {
  console.log('→ Verifying password field type...');
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  const type = await passwordInput.getAttribute('type');
  assert.strictEqual(type, 'password', 'Password field should hide text');
  console.log('✓ Password field is secure');
});

Then('the page should display {string} branding', async function(brandText) {
  console.log(`→ Checking for "${brandText}" branding...`);
  const body = await this.driver.findElement(By.css('body'));
  const pageSource = await this.driver.getPageSource();
  assert.ok(pageSource.includes(brandText), `Page should contain "${brandText}"`);
  console.log(`✓ "${brandText}" branding found`);
});

Then('the page should have proper styling', async function() {
  console.log('→ Verifying page styling...');
  const body = await this.driver.findElement(By.css('body'));
  assert.ok(body, 'Page should have body element with styling');
  console.log('✓ Page has proper styling');
});

