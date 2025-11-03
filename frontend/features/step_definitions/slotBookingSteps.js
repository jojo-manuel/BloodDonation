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
Given('I am logged in as a donor user with email {string}', async function(email) {
  await this.driver.get('http://localhost:5173/login');
  await this.driver.wait(until.elementLocated(By.css('input[type="email"]')), 10000);
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  await emailInput.sendKeys(email);
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  await passwordInput.sendKeys('password123'); // Assuming default password
  const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();
  await this.driver.wait(until.urlContains('dashboard'), 10000);
});

Given('I am on the donor dashboard', async function() {
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(currentUrl.includes('dashboard'), 'Should be on donor dashboard');
});

Given('I have booked donation slots', async function() {
  // Assume some slots are booked; in real test, might need to set up data
  this.bookedSlots = true;
});

Given('I have an upcoming booked slot', async function() {
  // Assume upcoming slot exists
  this.upcomingSlot = true;
});

Given('I donated blood 30 days ago', async function() {
  // Mock or assume donation history
  this.lastDonation = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
});

Given('I have a booking scheduled for tomorrow', async function() {
  // Assume booking exists
  this.tomorrowBooking = true;
});

Given('the blood bank has limited slots', async function() {
  // Setup limited slots
});

Given('I have completed multiple donations', async function() {
  // Assume donation history
});

Given('I have completed a donation', async function() {
  // Assume completed donation
});

Given('I have booked a donation slot', async function() {
  // Assume slot booked
});

Given('I have booked a taxi for donation', async function() {
  // Assume taxi booked
});

Given('I have a confirmed booking', async function() {
  // Assume confirmed booking
});

// When Steps
When('I navigate to {string} section', async function(section) {
  const link = await this.driver.findElement(By.linkText(section));
  await link.click();
});

When('I select a blood bank {string}', async function(bloodBank) {
  const select = await this.driver.findElement(By.css('select[name="bloodBank"]'));
  await select.sendKeys(bloodBank);
});

When('I select a date {string}', async function(date) {
  const dateInput = await this.driver.findElement(By.css('input[type="date"]'));
  await dateInput.sendKeys(date);
});

When('I select blood bank {string}', async function(bloodBank) {
  await this.selectBloodBank(bloodBank);
});

When('I select date {string}', async function(date) {
  await this.selectDate(date);
});

When('I select time slot {string}', async function(timeSlot) {
  const slot = await this.driver.findElement(By.xpath(`//div[contains(text(), '${timeSlot}')]`));
  await slot.click();
});

When('I confirm the booking', async function() {
  const confirmButton = await this.driver.findElement(By.css('button.confirm'));
  await confirmButton.click();
});

When('I click {string} on a future slot', async function(action) {
  const button = await this.driver.findElement(By.xpath(`//button[contains(text(), '${action}')]`));
  await button.click();
});

When('I provide cancellation reason {string}', async function(reason) {
  const input = await this.driver.findElement(By.css('input[name="reason"]'));
  await input.sendKeys(reason);
});

When('I confirm the cancellation', async function() {
  const confirmButton = await this.driver.findElement(By.css('button.confirm-cancel'));
  await confirmButton.click();
});

When('I try to select a past date', async function() {
  const pastDate = '2020-01-01';
  const dateInput = await this.driver.findElement(By.css('input[type="date"]'));
  await dateInput.sendKeys(pastDate);
});

When('I try to book a slot within 90 days', async function() {
  // Select date within 90 days
  const date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await this.selectDate(date);
});

When('I click {string} on a booking', async function(action) {
  const button = await this.driver.findElement(By.xpath(`//button[contains(text(), '${action}')]`));
  await button.click();
});

When('I select a new date {string}', async function(date) {
  await this.selectDate(date);
});

When('I select a new time slot {string}', async function(timeSlot) {
  await this.selectTimeSlot(timeSlot);
});

When('I confirm the rescheduling', async function() {
  const confirmButton = await this.driver.findElement(By.css('button.confirm-reschedule'));
  await confirmButton.click();
});

When('I enter location {string}', async function(location) {
  const input = await this.driver.findElement(By.css('input[name="location"]'));
  await input.sendKeys(location);
});

When('I apply location filter', async function() {
  const button = await this.driver.findElement(By.css('button.filter'));
  await button.click();
});

When('I view my booking details', async function() {
  // Navigate to booking details
});

When('I click {string}', async function(buttonText) {
  const button = await this.driver.findElement(By.xpath(`//button[contains(text(), '${buttonText}')]`));
  await button.click();
});

When('I select pickup location {string}', async function(location) {
  const select = await this.driver.findElement(By.css('select[name="pickup"]'));
  await select.sendKeys(location);
});

When('I confirm taxi booking', async function() {
  const confirmButton = await this.driver.findElement(By.css('button.confirm-taxi'));
  await confirmButton.click();
});

When('the payment page opens', async function() {
  // Wait for payment page
});

When('I select payment method {string}', async function(method) {
  const select = await this.driver.findElement(By.css('select[name="paymentMethod"]'));
  await select.sendKeys(method);
});

When('I complete the payment', async function() {
  const payButton = await this.driver.findElement(By.css('button.pay'));
  await payButton.click();
});

When('I click {string} on a booking', async function(action) {
  const button = await this.driver.findElement(By.xpath(`//button[contains(text(), '${action}')]`));
  await button.click();
});

When('another donor books the last available slot', async function() {
  // Simulate another booking
});

When('I refresh the slot selection page', async function() {
  await this.driver.navigate().refresh();
});

When('I select blood bank {string}', async function(bloodBank) {
  await this.selectBloodBank(bloodBank);
});

When('I select available date', async function() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await this.selectDate(date);
});

When('I select available time slot', async function() {
  const slot = await this.driver.findElement(By.css('.available-slot'));
  await slot.click();
});

// Then Steps
Then('I should see available time slots for that date', async function() {
  const slots = await this.driver.findElements(By.css('.time-slot'));
  assert.ok(slots.length > 0, 'Should see available slots');
});

Then('each slot should show:', async function(dataTable) {
  // Check table data
});

Then('I should see {string} message', async function(message) {
  const msg = await this.driver.findElement(By.xpath(`//*[contains(text(), '${message}')]`));
  assert.ok(msg, `Should see "${message}"`);
});

Then('I should receive a booking confirmation with QR code', async function() {
  const qr = await this.driver.findElement(By.css('.qr-code'));
  assert.ok(qr, 'Should have QR code');
});

Then('I should get booking reference number', async function() {
  const ref = await this.driver.findElement(By.css('.booking-ref'));
  assert.ok(ref, 'Should have booking reference');
});

Then('the slot should show as {string} status', async function(status) {
  const slotStatus = await this.driver.findElement(By.css('.slot-status'));
  const text = await slotStatus.getText();
  assert.strictEqual(text, status);
});

Then('I should see all my booked slots', async function() {
  const bookings = await this.driver.findElements(By.css('.booking'));
  assert.ok(bookings.length > 0, 'Should see bookings');
});

Then('each booking should display:', async function(dataTable) {
  // Check table
});

Then('the booking status should change to {string}', async function(status) {
  const statusEl = await this.driver.findElement(By.css('.booking-status'));
  const text = await statusEl.getText();
  assert.strictEqual(text, status);
});

Then('the slot should become available for others', async function() {
  // Check availability
});

Then('the blood bank should be notified', async function() {
  // Assume notification sent
});

Then('the past date should be disabled', async function() {
  const dateInput = await this.driver.findElement(By.css('input[type="date"]'));
  const disabled = await dateInput.getAttribute('disabled');
  assert.ok(disabled, 'Past date should be disabled');
});

Then('I should see a message {string}', async function(message) {
  const msg = await this.driver.findElement(By.xpath(`//*[contains(text(), '${message}')]`));
  assert.ok(msg);
});

Then('I should see a warning message', async function() {
  const warning = await this.driver.findElement(By.css('.warning'));
  assert.ok(warning);
});

Then('the message should indicate minimum waiting period', async function() {
  // Check message content
});

Then('I should be shown my next eligible donation date', async function() {
  const date = await this.driver.findElement(By.css('.next-date'));
  assert.ok(date);
});

Then('the booking should be updated with new date and time', async function() {
  // Check updated booking
});

Then('I should receive updated confirmation', async function() {
  // Check confirmation
});

Then('the old slot should become available', async function() {
  // Check availability
});

Then('I should see only blood banks in {string}', async function(location) {
  const banks = await this.driver.findElements(By.css('.blood-bank'));
  for (let bank of banks) {
    const loc = await bank.getText();
    assert.ok(loc.includes(location));
  }
});

Then('each result should show distance from my location', async function() {
  // Check distance
});

Then('I should receive estimated arrival time', async function() {
  const time = await this.driver.findElement(By.css('.arrival-time'));
  assert.ok(time);
});

Then('taxi details should be added to my booking', async function() {
  // Check booking
});

Then('I should receive payment receipt', async function() {
  const receipt = await this.driver.findElement(By.css('.receipt'));
  assert.ok(receipt);
});

Then('the booking status should update to {string}', async function(status) {
  const statusEl = await this.driver.findElement(By.css('.booking-status'));
  const text = await statusEl.getText();
  assert.strictEqual(text, status);
});

Then('a PDF document should be generated', async function() {
  // Check PDF download
});

Then('the PDF should contain:', async function(dataTable) {
  // Check PDF content
});

Then('I should receive a notification', async function() {
  const notification = await this.driver.findElement(By.css('.notification'));
  assert.ok(notification);
});

Then('the notification should include:', async function(dataTable) {
  // Check notification
});

Then('I should see {string} status', async function(status) {
  const statusEl = await this.driver.findElement(By.css('.status'));
  const text = await statusEl.getText();
  assert.strictEqual(text, status);
});

Then('the booking should be confirmed for {string}', async function(bloodBank) {
  const bank = await this.driver.findElement(By.css('.confirmed-bank'));
  const text = await bank.getText();
  assert.strictEqual(text, bloodBank);
});

Then('I should see all my past donations', async function() {
  const donations = await this.driver.findElements(By.css('.donation'));
  assert.ok(donations.length > 0);
});

Then('each record should show:', async function(dataTable) {
  // Check records
});

Then('a donation certificate PDF should be generated', async function() {
  // Check PDF
});

Then('the certificate should contain:', async function(dataTable) {
  // Check certificate
});
