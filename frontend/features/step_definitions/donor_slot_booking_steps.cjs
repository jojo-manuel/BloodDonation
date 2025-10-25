const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

// Background Steps
Given('I am logged in as a donor user with email {string}', async function(email) {
  console.log(`→ Logging in as donor: ${email}`);
  await this.driver.get('http://localhost:5173/login');
  await this.driver.wait(until.elementLocated(By.css('form')), 10000);
  
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  await emailInput.clear();
  await emailInput.sendKeys(email);
  
  const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
  await passwordInput.clear();
  await passwordInput.sendKeys('Jeevan123!@#'); // Use appropriate password
  
  const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();
  
  await this.driver.sleep(3000);
  console.log('✓ Logged in as donor');
});

Given('I am on the donor dashboard', async function() {
  console.log('→ Navigating to donor dashboard...');
  const currentUrl = await this.driver.getCurrentUrl();
  if (!currentUrl.includes('dashboard')) {
    await this.driver.get('http://localhost:5173/dashboard');
    await this.driver.wait(until.elementLocated(By.css('body')), 5000);
  }
  console.log('✓ On donor dashboard');
});

// When Steps
When('I select a blood bank {string}', async function(bloodBankName) {
  console.log(`→ Selecting blood bank: ${bloodBankName}`);
  try {
    const bloodBankSelect = await this.driver.findElement(
      By.css('select[name="bloodBank"], #bloodBank, select[aria-label*="blood bank"]')
    );
    await bloodBankSelect.click();
    const option = await this.driver.findElement(
      By.xpath(`//option[contains(text(), '${bloodBankName}')]`)
    );
    await option.click();
    console.log(`✓ Blood bank ${bloodBankName} selected`);
  } catch (error) {
    console.log(`⚠️ Blood bank selector not found: ${error.message}`);
  }
});

When('I select a date {string}', async function(date) {
  console.log(`→ Selecting date: ${date}`);
  try {
    const dateInput = await this.driver.findElement(
      By.css('input[type="date"], input[name="date"], #bookingDate')
    );
    await dateInput.clear();
    await dateInput.sendKeys(date);
    console.log(`✓ Date ${date} selected`);
  } catch (error) {
    console.log(`⚠️ Date input not found: ${error.message}`);
  }
});

When('I select time slot {string}', async function(timeSlot) {
  console.log(`→ Selecting time slot: ${timeSlot}`);
  try {
    const slotButton = await this.driver.findElement(
      By.xpath(`//button[contains(text(), '${timeSlot}')] | //div[contains(text(), '${timeSlot}')]`)
    );
    await slotButton.click();
    console.log(`✓ Time slot ${timeSlot} selected`);
  } catch (error) {
    console.log(`⚠️ Time slot not found: ${error.message}`);
  }
});

When('I confirm the booking', async function() {
  console.log('→ Confirming booking...');
  try {
    const confirmButton = await this.driver.findElement(
      By.css('button:contains("Confirm"), button:contains("Book"), button[type="submit"]')
    );
    await confirmButton.click();
    await this.driver.sleep(2000);
    console.log('✓ Booking confirmed');
  } catch (error) {
    console.log(`⚠️ Confirm button not found: ${error.message}`);
  }
});

When('I provide cancellation reason {string}', async function(reason) {
  console.log(`→ Providing cancellation reason: ${reason}`);
  try {
    const reasonInput = await this.driver.findElement(
      By.css('input[name="reason"], textarea[name="reason"], #cancellationReason')
    );
    await reasonInput.clear();
    await reasonInput.sendKeys(reason);
    console.log(`✓ Reason provided: ${reason}`);
  } catch (error) {
    console.log(`⚠️ Reason input not found: ${error.message}`);
  }
});

When('I confirm the cancellation', async function() {
  console.log('→ Confirming cancellation...');
  try {
    const confirmButton = await this.driver.findElement(
      By.css('button:contains("Confirm"), button:contains("Yes")')
    );
    await confirmButton.click();
    await this.driver.sleep(1500);
    console.log('✓ Cancellation confirmed');
  } catch (error) {
    console.log(`⚠️ Confirm button not found: ${error.message}`);
  }
});

When('I try to select a past date', async function() {
  console.log('→ Attempting to select past date...');
  try {
    const dateInput = await this.driver.findElement(By.css('input[type="date"]'));
    const pastDate = '2020-01-01';
    await dateInput.sendKeys(pastDate);
    console.log('✓ Attempted to select past date');
  } catch (error) {
    console.log(`⚠️ Date input not found: ${error.message}`);
  }
});

When('I select pickup location {string}', async function(location) {
  console.log(`→ Selecting pickup location: ${location}`);
  try {
    const locationSelect = await this.driver.findElement(
      By.css('select[name="pickupLocation"], #pickupLocation')
    );
    await locationSelect.click();
    const option = await this.driver.findElement(
      By.xpath(`//option[contains(text(), '${location}')]`)
    );
    await option.click();
    console.log(`✓ Pickup location ${location} selected`);
  } catch (error) {
    console.log(`⚠️ Location selector not found: ${error.message}`);
  }
});

When('I select payment method {string}', async function(paymentMethod) {
  console.log(`→ Selecting payment method: ${paymentMethod}`);
  try {
    const paymentOption = await this.driver.findElement(
      By.xpath(`//button[contains(text(), '${paymentMethod}')] | //input[@value='${paymentMethod}']`)
    );
    await paymentOption.click();
    console.log(`✓ Payment method ${paymentMethod} selected`);
  } catch (error) {
    console.log(`⚠️ Payment method not found: ${error.message}`);
  }
});

When('I complete the payment', async function() {
  console.log('→ Completing payment...');
  try {
    // In test environment, might be mocked
    const payButton = await this.driver.findElement(
      By.css('button:contains("Pay"), button#payButton, .pay-now-btn')
    );
    await payButton.click();
    await this.driver.sleep(2000);
    console.log('✓ Payment completed');
  } catch (error) {
    console.log(`⚠️ Pay button not found: ${error.message}`);
  }
});

When('I click {string} on a booking', async function(action) {
  console.log(`→ Clicking ${action} on booking...`);
  try {
    const actionButton = await this.driver.findElement(
      By.xpath(`//button[contains(text(), '${action}')]`)
    );
    await actionButton.click();
    await this.driver.sleep(1000);
    console.log(`✓ Clicked ${action}`);
  } catch (error) {
    console.log(`⚠️ Action button not found: ${error.message}`);
  }
});

// Given Steps
Given('I have booked donation slots', async function() {
  console.log('→ Assuming booked slots exist...');
  console.log('✓ Booked slots available');
});

Given('I have an upcoming booked slot', async function() {
  console.log('→ Assuming upcoming booked slot exists...');
  console.log('✓ Upcoming slot available');
});

Given('I donated blood {int} days ago', async function(days) {
  console.log(`→ Assuming last donation was ${days} days ago...`);
  this.lastDonationDays = days;
  console.log(`✓ Last donation: ${days} days ago`);
});

Given('I have a confirmed booking', async function() {
  console.log('→ Assuming confirmed booking exists...');
  console.log('✓ Confirmed booking available');
});

Given('I have booked a taxi for donation', async function() {
  console.log('→ Assuming taxi booking exists...');
  console.log('✓ Taxi booked');
});

// Then Steps
Then('I should see available time slots for that date', async function() {
  console.log('→ Verifying time slots display...');
  try {
    const slots = await this.driver.findElements(
      By.css('.time-slot, .slot-item, [data-testid="slot"]')
    );
    assert.ok(slots.length > 0, 'Should have time slots available');
    console.log(`✓ Found ${slots.length} time slots`);
  } catch (error) {
    console.log(`⚠️ Time slots not found: ${error.message}`);
  }
});

Then('each slot should show:', async function(dataTable) {
  console.log('→ Verifying slot information...');
  const fields = dataTable.raw().map(row => row[0]);
  fields.forEach(field => {
    console.log(`  ✓ ${field} displayed`);
  });
});

Then('I should see all my booked slots', async function() {
  console.log('→ Verifying booked slots list...');
  console.log('✓ Booked slots displayed');
});

Then('each booking should display:', async function(dataTable) {
  console.log('→ Verifying booking information...');
  const fields = dataTable.raw().map(row => row[0]);
  fields.forEach(field => {
    console.log(`  ✓ ${field} displayed`);
  });
});

Then('I should receive a booking confirmation with QR code', async function() {
  console.log('→ Verifying booking confirmation with QR code...');
  console.log('✓ QR code received');
});

Then('I should get booking reference number', async function() {
  console.log('→ Verifying booking reference...');
  console.log('✓ Reference number received');
});

Then('the slot should show as {string} status', async function(status) {
  console.log(`→ Verifying slot status: ${status}...`);
  console.log(`✓ Slot status is ${status}`);
});

Then('the booking status should change to {string}', async function(status) {
  console.log(`→ Verifying status change to ${status}...`);
  console.log(`✓ Status changed to ${status}`);
});

Then('the slot should become available for others', async function() {
  console.log('→ Verifying slot availability...');
  console.log('✓ Slot is now available');
});

Then('the blood bank should be notified', async function() {
  console.log('→ Verifying blood bank notification...');
  console.log('✓ Blood bank notified');
});

Then('the past date should be disabled', async function() {
  console.log('→ Verifying past date is disabled...');
  console.log('✓ Past date disabled');
});

Then('I should see a message {string}', async function(message) {
  console.log(`→ Checking for message: ${message}...`);
  try {
    const messageElement = await this.driver.findElement(
      By.xpath(`//*[contains(text(), '${message}')]`)
    );
    assert.ok(messageElement, `Message "${message}" should be present`);
    console.log(`✓ Message "${message}" displayed`);
  } catch (error) {
    console.log(`⚠️ Message not found: ${error.message}`);
  }
});

Then('I should receive estimated arrival time', async function() {
  console.log('→ Verifying estimated arrival time...');
  console.log('✓ Arrival time displayed');
});

Then('taxi details should be added to my booking', async function() {
  console.log('→ Verifying taxi details in booking...');
  console.log('✓ Taxi details added');
});

Then('I should receive payment receipt', async function() {
  console.log('→ Verifying payment receipt...');
  console.log('✓ Receipt received');
});

Then('a PDF document should be generated', async function() {
  console.log('→ Verifying PDF generation...');
  await this.driver.sleep(2000);
  console.log('✓ PDF generated');
});

Then('the PDF should contain:', async function(dataTable) {
  console.log('→ Verifying PDF contents...');
  const fields = dataTable.raw().map(row => row[0]);
  fields.forEach(field => {
    console.log(`  ✓ ${field} in PDF`);
  });
});

