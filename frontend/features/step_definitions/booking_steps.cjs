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

// Background / Login
Given('I am logged in as {string} with password {string}', async function(email, password) {
  await this.driver.get('http://localhost:5173/login');
  await this.driver.wait(until.elementLocated(By.css('input[type="email"]')), 10000);

  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  await emailInput.clear();
  await emailInput.sendKeys(email);

  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  await passwordInput.clear();
  await passwordInput.sendKeys(password);

  const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();

  await this.driver.wait(until.urlContains('dashboard'), 15000);
});

// Navigation
When('I open the booking page', async function() {
  // Try common entry points to the booking UI
  // Prefer explicit link/button text if present
  const candidates = [
    "//a[contains(text(), 'Book Slot')]",
    "//button[contains(text(), 'Book Slot')]",
    "//a[contains(text(), 'Booking')]",
    "//a[contains(text(), 'Donor Booking')]",
  ];

  let opened = false;
  for (const xpath of candidates) {
    const elements = await this.driver.findElements(By.xpath(xpath));
    if (elements.length > 0) {
      await elements[0].click();
      opened = true;
      break;
    }
  }

  // As a fallback, try navigating directly if route exists
  if (!opened) {
    await this.driver.get('http://localhost:5173/dashboard/book');
  }

  // Wait for booking container to load
  await this.driver.wait(until.elementLocated(By.css('body')), 10000);
});

// Selections
When('I select blood bank {string}', async function(bloodBankName) {
  // Try select element first
  const selectMatches = await this.driver.findElements(By.css('select[name="bloodBank"], select#bloodBank'));
  if (selectMatches.length > 0) {
    await selectMatches[0].sendKeys(bloodBankName);
    return;
  }

  // Try clickable card/list item by text
  const card = await this.driver.findElement(By.xpath(`//*[contains(@class, 'blood-bank') or self::button or self::div][contains(text(), '${bloodBankName}')]`));
  await card.click();
});

When('I choose date {string}', async function(dateISO) {
  const dateInputCandidates = [
    'input[type="date"]',
    'input[name="date"]',
    '#date',
  ];

  let set = false;
  for (const sel of dateInputCandidates) {
    const els = await this.driver.findElements(By.css(sel));
    if (els.length) {
      await els[0].clear();
      await els[0].sendKeys(dateISO);
      set = true;
      break;
    }
  }
  assert.ok(set, 'Date input not found');
});

When('I choose time slot {string}', async function(time) {
  // Try explicit time slot button/div
  const slot = await this.driver.findElement(By.xpath(`//button[contains(@class,'time') or contains(@class,'slot') or contains(@class,'available')][contains(text(), '${time}')] | //div[contains(@class,'time') or contains(@class,'slot') or contains(@class,'available')][contains(text(), '${time}')]`));
  await slot.click();
});

When('I confirm the booking', async function() {
  // Look for a primary confirmation action
  const candidates = [
    "//button[contains(text(), 'Confirm Booking')]",
    "//button[contains(text(), 'Confirm')]",
    "//button[contains(text(), 'Book')]",
    "//button[contains(@class,'confirm')]",
  ];
  let clicked = false;
  for (const xpath of candidates) {
    const els = await this.driver.findElements(By.xpath(xpath));
    if (els.length) {
      await els[0].click();
      clicked = true;
      break;
    }
  }
  assert.ok(clicked, 'Confirm button not found');
});

// Assertions
Then('I should see booking confirmation', async function() {
  // Look for common confirmation cues
  const checks = [
    By.xpath("//*[contains(text(), 'Booking Confirmed') or contains(text(), 'confirmed') or contains(text(), 'successfully booked')]"),
    By.css('.booking-confirmation'),
    By.css('[data-test="booking-confirmation"]'),
  ];

  let found = false;
  for (const locator of checks) {
    const els = await this.driver.findElements(locator);
    if (els.length) { found = true; break; }
  }
  assert.ok(found, 'Booking confirmation not found');
});

Then('a QR code should be displayed', async function() {
  const qrCandidates = [By.css('.qr-code'), By.css('img[alt*="QR" i]')];
  let found = false;
  for (const locator of qrCandidates) {
    if ((await this.driver.findElements(locator)).length) { found = true; break; }
  }
  assert.ok(found, 'QR code not displayed');
});

Then('I should see a booking reference number', async function() {
  const refCandidates = [By.css('.booking-ref'), By.css('[data-test="booking-ref"]')];
  let found = false;
  for (const locator of refCandidates) {
    if ((await this.driver.findElements(locator)).length) { found = true; break; }
  }
  assert.ok(found, 'Booking reference not shown');
});

Then('the booking status should be {string}', async function(expected) {
  const statusEl = await this.driver.findElement(By.css('.booking-status, [data-test="booking-status"]'));
  const text = await statusEl.getText();
  assert.ok(text.toLowerCase().includes(expected.toLowerCase()), `Expected status to include "${expected}" but got "${text}"`);
});


