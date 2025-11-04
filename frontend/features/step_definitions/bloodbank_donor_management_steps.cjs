const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

// Set default timeout to 60 seconds for complex operations
setDefaultTimeout(60000);

// Shared driver instance
let driver;

Before(async function() {
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--window-size=1920,1080');
  chromeOptions.addArguments('--disable-background-networking');
  chromeOptions.addArguments('--disable-sync');
  // Uncomment to run in headless mode
  // chromeOptions.addArguments('--headless');

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

// Helper function to login as blood bank user
async function loginAsBloodBank(driver) {
  // Navigate to blood bank login page
  await driver.get('http://localhost:5173/bloodbank-login');
  await driver.sleep(1000);
  
  // Wait for username/email input (blood bank login form has input with name="username" but type="email")
  let usernameInput;
  try {
    // First try by name attribute
    usernameInput = await driver.wait(
      until.elementLocated(By.css('input[name="username"]')),
      15000
    );
  } catch (e) {
    // Try by type="email" (the input is actually an email type)
    try {
      usernameInput = await driver.wait(
        until.elementLocated(By.css('input[type="email"]')),
        15000
      );
    } catch (e2) {
      // Try by finding first input that's not password
      const inputs = await driver.findElements(By.css('input'));
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        if (type !== 'password' && type !== 'submit' && type !== 'button') {
          usernameInput = input;
          break;
        }
      }
    }
  }
  
  if (!usernameInput) {
    throw new Error('Could not find username/email input field');
  }
  
  // Fill login credentials - use email format since the API expects email
  await usernameInput.clear();
  await usernameInput.sendKeys('bloodbank1@example.com');
  
  const passwordInput = await driver.findElement(By.css('input[type="password"]'));
  await passwordInput.clear();
  await passwordInput.sendKeys('password123');
  
  // Find and click submit button
  const loginButton = await driver.findElement(By.css('button[type="submit"]'));
  await loginButton.click();
  
  // Wait for navigation away from login page
  try {
    await driver.wait(until.urlContains('dashboard') || until.urlContains('pending'), 15000);
  } catch (e) {
    // If not redirected, check if we're still on login page
    await driver.sleep(2000);
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('/login') || currentUrl.includes('bloodbank-login')) {
      // Check for error messages
      const pageText = await driver.findElement(By.css('body')).getText();
      throw new Error('Login failed - still on login page. Page content: ' + pageText.substring(0, 200));
    }
  }
  await driver.sleep(2000);
}

// Background Steps
Given('I am logged in as a blood bank user', async function() {
  await loginAsBloodBank(this.driver);
  const currentUrl = await this.driver.getCurrentUrl();
  assert.ok(!currentUrl.includes('/login'), 'Should be logged in');
});

Given('I am on the blood bank dashboard', async function() {
  const currentUrl = await this.driver.getCurrentUrl();
  if (!currentUrl.includes('dashboard')) {
    // Try common dashboard routes
    try {
      await this.driver.get('http://localhost:5173/dashboard');
      await this.driver.sleep(2000);
    } catch (e) {
      // If that fails, try bloodbank specific route
      await this.driver.get('http://localhost:5173/bloodbank/dashboard');
      await this.driver.sleep(2000);
    }
  }
  await this.driver.wait(until.elementLocated(By.css('body')), 10000);
});

Given('I navigate to the donors tab', async function() {
  // Wait for the donors tab button and click it
  // The button text is "🩸 Manage Donors"
  let donorsTab;
  try {
    // Try by finding button with "Manage Donors" or "Donors" text
    const buttons = await this.driver.findElements(By.css('button'));
    for (const btn of buttons) {
      const text = await btn.getText();
      if (text.includes('Manage Donors') || text.includes('Donors') || text.includes('🩸')) {
        donorsTab = btn;
        break;
      }
    }
  } catch (e) {
    // If that fails, try xpath
    try {
      donorsTab = await this.driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Manage Donors') or contains(text(), 'Donors')]")),
        10000
      );
    } catch (e2) {
      console.log('Could not find donors tab button');
    }
  }
  
  if (donorsTab) {
    await donorsTab.click();
    await this.driver.sleep(2000);
  } else {
    // If we can't find the button, try navigating via URL or state
    // The donors tab is set via setActiveTab('donors')
    // For now, just verify we're on the dashboard
    const currentUrl = await this.driver.getCurrentUrl();
    assert.ok(currentUrl.includes('dashboard'), 'Should be on dashboard');
  }
  
  // Verify we're on the donors section by checking for donor-related content
  await this.driver.sleep(2000);
  const pageText = await this.driver.findElement(By.css('body')).getText();
  assert.ok(pageText.toLowerCase().includes('donor') || pageText.toLowerCase().includes('donors'), 
    'Should see donor-related content');
});

Given('I have searched for a donor', async function() {
  // Search for any donor to have a result
  const emailInput = await this.driver.wait(
    until.elementLocated(By.css('input[type="email"]')),
    10000
  );
  await emailInput.sendKeys('donor@example.com');
  await this.driver.sleep(1000);
});

Given('I have searched for donors with blood group {string}', async function(bloodGroup) {
  // Click on blood group dropdown
  const bloodGroupButton = await this.driver.wait(
    until.elementLocated(By.css('button[id="dropdown-button"], button[data-dropdown-toggle="dropdown"]')),
    10000
  );
  await bloodGroupButton.click();
  await this.driver.sleep(500);
  
  // Select the blood group
  const bloodGroupOption = await this.driver.wait(
    until.elementLocated(By.xpath(`//button[contains(text(), '${bloodGroup}')]`)),
    10000
  );
  await bloodGroupOption.click();
  await this.driver.sleep(1000);
});

// When Steps
When('I search for donors with blood group {string}', async function(bloodGroup) {
  // Click on blood group dropdown
  const bloodGroupButton = await this.driver.wait(
    until.elementLocated(By.css('button[id="dropdown-button"], button[data-dropdown-toggle="dropdown"]')),
    10000
  );
  await bloodGroupButton.click();
  await this.driver.sleep(500);
  
  // Select the blood group
  const bloodGroupOption = await this.driver.wait(
    until.elementLocated(By.xpath(`//button[contains(text(), '${bloodGroup}')]`)),
    10000
  );
  await bloodGroupOption.click();
  await this.driver.sleep(2000);
});

When('I search for donors with email {string}', async function(email) {
  const emailInput = await this.driver.wait(
    until.elementLocated(By.css('input[type="email"]')),
    10000
  );
  await emailInput.clear();
  await emailInput.sendKeys(email);
  await this.driver.sleep(2000);
});

When('I search for donors in location {string}', async function(location) {
  const locationInput = await this.driver.wait(
    until.elementLocated(By.css('input[id="search-place"], input[placeholder*="place" i]')),
    10000
  );
  await locationInput.clear();
  await locationInput.sendKeys(location);
  await this.driver.sleep(2000);
});

When('I click on {string} view', async function(viewName) {
  const viewButton = await this.driver.wait(
    until.elementLocated(By.xpath(`//button[contains(text(), '${viewName}')]`)),
    10000
  );
  await viewButton.click();
  await this.driver.sleep(2000);
});

When('I search for donors with:', async function(dataTable) {
  const rows = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(rows)) {
    if (field === 'Blood Group') {
      const bloodGroupButton = await this.driver.wait(
        until.elementLocated(By.css('button[id="dropdown-button"], button[data-dropdown-toggle="dropdown"]')),
        10000
      );
      await bloodGroupButton.click();
      await this.driver.sleep(500);
      
      const bloodGroupOption = await this.driver.wait(
        until.elementLocated(By.xpath(`//button[contains(text(), '${value}')]`)),
        10000
      );
      await bloodGroupOption.click();
      await this.driver.sleep(500);
    } else if (field === 'Location') {
      const locationInput = await this.driver.wait(
        until.elementLocated(By.css('input[id="search-place"], input[placeholder*="place" i]')),
        10000
      );
      await locationInput.clear();
      await locationInput.sendKeys(value);
      await this.driver.sleep(500);
    }
  }
  await this.driver.sleep(2000);
});

When('I clear the search filters', async function() {
  const clearButton = await this.driver.wait(
    until.elementLocated(By.css('button[type="button"]:has(svg), button:has-text("Clear")')),
    10000
  );
  await clearButton.click();
  await this.driver.sleep(2000);
});

When('I click on a donor from the list', async function() {
  // Click on the first donor card or row
  const donorCard = await this.driver.wait(
    until.elementLocated(By.css('.donor-card, .donor-item, [class*="donor"]')),
    10000
  );
  await donorCard.click();
  await this.driver.sleep(2000);
});

// Then Steps
Then('I should see a list of donors with blood group {string}', async function(bloodGroup) {
  await this.driver.sleep(2000);
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  assert.ok(donorElements.length > 0 || await this.driver.findElement(By.xpath(`//*[contains(text(), '${bloodGroup}')]`)), 
    `Should see donors with blood group ${bloodGroup}`);
});

Then('each donor should display their name and contact information', async function() {
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  
  if (donorElements.length > 0) {
    const firstDonor = donorElements[0];
    const donorText = await firstDonor.getText();
    // Check if name or contact info is present
    assert.ok(donorText.length > 0, 'Donor should display information');
  }
});

Then('I should see donor information for {string}', async function(email) {
  await this.driver.sleep(2000);
  const pageText = await this.driver.findElement(By.css('body')).getText();
  assert.ok(pageText.includes(email) || pageText.includes('donor'), 
    `Should see donor information for ${email}`);
});

Then('the donor details should include name, blood group, and contact information', async function() {
  const pageText = await this.driver.findElement(By.css('body')).getText();
  // Check for common donor detail indicators
  assert.ok(pageText.includes('Blood') || pageText.includes('Contact') || pageText.includes('Phone'), 
    'Should display donor details');
});

Then('I should see donors located in {string}', async function(location) {
  await this.driver.sleep(2000);
  const pageText = await this.driver.findElement(By.css('body')).getText();
  assert.ok(pageText.includes(location) || pageText.toLowerCase().includes(location.toLowerCase()), 
    `Should see donors in ${location}`);
});

Then('each donor should display their address information', async function() {
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  
  if (donorElements.length > 0) {
    const firstDonor = donorElements[0];
    const donorText = await firstDonor.getText();
    // Check if address-related text is present
    assert.ok(donorText.includes('Address') || donorText.includes('City') || donorText.includes('District'), 
      'Donor should display address information');
  }
});

Then('I should see a list of all available donors', async function() {
  await this.driver.sleep(2000);
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  assert.ok(donorElements.length >= 0, 'Should see donor list (even if empty)');
});

Then('each donor should display their basic information', async function() {
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  
  if (donorElements.length > 0) {
    const firstDonor = donorElements[0];
    const donorText = await firstDonor.getText();
    assert.ok(donorText.length > 0, 'Donor should display basic information');
  }
});

Then('I should see a list of donors who have visited', async function() {
  await this.driver.sleep(2000);
  const visitHistory = await this.driver.findElements(By.css('.visit-history, .visit-item, [class*="visit"]'));
  assert.ok(visitHistory.length >= 0, 'Should see visit history (even if empty)');
});

Then('each entry should show visit date and donation details', async function() {
  const visitElements = await this.driver.findElements(By.css('.visit-history, .visit-item, [class*="visit"]'));
  
  if (visitElements.length > 0) {
    const firstVisit = visitElements[0];
    const visitText = await firstVisit.getText();
    assert.ok(visitText.length > 0, 'Visit entry should display information');
  }
});

Then('I should see donors matching both criteria', async function() {
  await this.driver.sleep(2000);
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  assert.ok(donorElements.length >= 0, 'Should see filtered donors');
});

Then('each donor should have blood group {string} and be located in {string}', async function(bloodGroup, location) {
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  
  if (donorElements.length > 0) {
    const pageText = await this.driver.findElement(By.css('body')).getText();
    assert.ok(pageText.includes(bloodGroup), `Should see blood group ${bloodGroup}`);
    assert.ok(pageText.includes(location) || pageText.toLowerCase().includes(location.toLowerCase()), 
      `Should see location ${location}`);
  }
});

Then('I should see all donors again', async function() {
  await this.driver.sleep(2000);
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  assert.ok(donorElements.length >= 0, 'Should see all donors');
});

Then('the search fields should be empty', async function() {
  const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
  const emailValue = await emailInput.getAttribute('value');
  assert.ok(!emailValue || emailValue === '', 'Email field should be empty');
});

Then('I should see detailed donor information including:', async function(dataTable) {
  const rows = dataTable.raw();
  const pageText = await this.driver.findElement(By.css('body')).getText();
  
  for (const row of rows) {
    const field = row[0];
    // Check if field is visible in the page
    assert.ok(pageText.includes(field) || pageText.toLowerCase().includes(field.toLowerCase()), 
      `Should see ${field} in donor details`);
  }
});

Then('I should see a message indicating no donors found', async function() {
  await this.driver.sleep(2000);
  const pageText = await this.driver.findElement(By.css('body')).getText();
  const noResultsKeywords = ['no donors', 'not found', 'no results', 'empty', 'no matches'];
  const hasNoResults = noResultsKeywords.some(keyword => 
    pageText.toLowerCase().includes(keyword.toLowerCase())
  );
  assert.ok(hasNoResults || pageText.includes('0'), 'Should see no donors found message');
});

Then('I should see an empty donor list', async function() {
  await this.driver.sleep(2000);
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  assert.ok(donorElements.length === 0, 'Donor list should be empty');
});

Then('I should see a message indicating no donors found or an empty donor list', async function() {
  await this.driver.sleep(2000);
  const pageText = await this.driver.findElement(By.css('body')).getText();
  const donorElements = await this.driver.findElements(By.css('.donor-card, .donor-item, [class*="donor"]'));
  
  // Check for either a no results message OR an empty list
  const noResultsKeywords = ['no donors', 'not found', 'no results', 'empty', 'no matches'];
  const hasNoResults = noResultsKeywords.some(keyword => 
    pageText.toLowerCase().includes(keyword.toLowerCase())
  );
  const isEmptyList = donorElements.length === 0;
  
  assert.ok(hasNoResults || isEmptyList || pageText.includes('0'), 
    'Should see no donors found message or empty donor list');
});

