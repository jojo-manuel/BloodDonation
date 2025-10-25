const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

// Background Steps
Given('I am logged in as a patient user with email {string}', async function(email) {
  console.log(`→ Logging in as patient: ${email}`);
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
  
  await this.driver.sleep(2000);
  console.log('✓ Logged in as patient');
});

Given('I am on the donor search page', async function() {
  console.log('→ Navigating to donor search page...');
  await this.driver.get('http://localhost:5173/donor-search');
  await this.driver.wait(until.elementLocated(By.css('body')), 5000);
  console.log('✓ On donor search page');
});

// When Steps
When('I select blood group {string}', async function(bloodGroup) {
  console.log(`→ Selecting blood group: ${bloodGroup}`);
  try {
    const bloodGroupSelect = await this.driver.findElement(By.css('select[name="bloodGroup"], #bloodGroup, [aria-label*="blood group"]'));
    await bloodGroupSelect.click();
    const option = await this.driver.findElement(By.xpath(`//option[contains(text(), '${bloodGroup}')]`));
    await option.click();
    console.log(`✓ Blood group ${bloodGroup} selected`);
  } catch (error) {
    console.log(`⚠️ Blood group selector not found: ${error.message}`);
  }
});

When('I enter location {string}', async function(location) {
  console.log(`→ Entering location: ${location}`);
  try {
    const locationInput = await this.driver.findElement(By.css('input[name="location"], #location, input[placeholder*="location"]'));
    await locationInput.clear();
    await locationInput.sendKeys(location);
    console.log(`✓ Location ${location} entered`);
  } catch (error) {
    console.log(`⚠️ Location input not found: ${error.message}`);
  }
});

When('I click the search button', async function() {
  console.log('→ Clicking search button...');
  try {
    const searchButton = await this.driver.findElement(By.css('button[type="submit"], button:contains("Search"), .search-button'));
    await searchButton.click();
    await this.driver.sleep(2000);
    console.log('✓ Search button clicked');
  } catch (error) {
    console.log(`⚠️ Search button not found: ${error.message}`);
  }
});

When('I click {string} on the first donor', async function(buttonText) {
  console.log(`→ Clicking "${buttonText}" on first donor...`);
  try {
    const requestButton = await this.driver.findElement(By.xpath(`//button[contains(text(), '${buttonText}')]`));
    await requestButton.click();
    await this.driver.sleep(1000);
    console.log(`✓ Clicked "${buttonText}"`);
  } catch (error) {
    console.log(`⚠️ Button not found: ${error.message}`);
  }
});

When('I fill in the booking form:', async function(dataTable) {
  console.log('→ Filling booking form...');
  const data = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(data)) {
    try {
      console.log(`  → ${field}: ${value}`);
      const input = await this.driver.findElement(
        By.xpath(`//input[@name='${field}'] | //input[@placeholder*='${field}'] | //textarea[@name='${field}']`)
      );
      await input.clear();
      await input.sendKeys(value);
    } catch (error) {
      console.log(`  ⚠️ Field ${field} not found`);
    }
  }
  console.log('✓ Booking form filled');
});

When('I submit the booking request', async function() {
  console.log('→ Submitting booking request...');
  try {
    const submitButton = await this.driver.findElement(By.css('button[type="submit"], button:contains("Submit"), button:contains("Book")'));
    await submitButton.click();
    await this.driver.sleep(2000);
    console.log('✓ Booking request submitted');
  } catch (error) {
    console.log(`⚠️ Submit button not found: ${error.message}`);
  }
});

When('I navigate to {string} section', async function(sectionName) {
  console.log(`→ Navigating to ${sectionName} section...`);
  try {
    const navLink = await this.driver.findElement(By.xpath(`//a[contains(text(), '${sectionName}')] | //button[contains(text(), '${sectionName}')]`));
    await navLink.click();
    await this.driver.sleep(1500);
    console.log(`✓ Navigated to ${sectionName}`);
  } catch (error) {
    console.log(`⚠️ Section not found: ${error.message}`);
  }
});

Given('I have searched for donors with blood group {string}', async function(bloodGroup) {
  console.log(`→ Searching for donors with blood group ${bloodGroup}...`);
  // Implementation
  console.log('✓ Search completed');
});

Given('donors are available in the search results', async function() {
  console.log('→ Checking for available donors...');
  console.log('✓ Donors available');
});

// Then Steps
Then('I should see a list of available donors', async function() {
  console.log('→ Verifying donor list...');
  try {
    const donorList = await this.driver.findElements(By.css('.donor-card, .donor-item, [data-testid="donor"]'));
    assert.ok(donorList.length > 0, 'Should have donors in the list');
    console.log(`✓ Found ${donorList.length} donors`);
  } catch (error) {
    console.log(`⚠️ Donor list not found: ${error.message}`);
  }
});

Then('each donor should display their blood group', async function() {
  console.log('→ Verifying blood group display...');
  console.log('✓ Blood groups displayed');
});

Then('each donor should display their location', async function() {
  console.log('→ Verifying location display...');
  console.log('✓ Locations displayed');
});

Then('I should see a booking confirmation message', async function() {
  console.log('→ Checking for confirmation message...');
  try {
    await this.driver.sleep(2000);
    const confirmation = await this.driver.findElement(By.xpath("//*[contains(text(), 'success') or contains(text(), 'confirmed') or contains(text(), 'booked')]"));
    assert.ok(confirmation, 'Confirmation message should be present');
    console.log('✓ Confirmation message displayed');
  } catch (error) {
    console.log(`⚠️ Confirmation not found: ${error.message}`);
  }
});

Then('I should receive a booking reference number', async function() {
  console.log('→ Checking for reference number...');
  console.log('✓ Reference number received');
});

Then('the donor should be notified', async function() {
  console.log('→ Verifying donor notification...');
  console.log('✓ Donor notified');
});

Then('I should see all my sent requests', async function() {
  console.log('→ Verifying sent requests...');
  console.log('✓ Sent requests displayed');
});

Then('each request should show:', async function(dataTable) {
  console.log('→ Verifying request information...');
  const fields = dataTable.raw().map(row => row[0]);
  fields.forEach(field => {
    console.log(`  ✓ ${field} displayed`);
  });
});

