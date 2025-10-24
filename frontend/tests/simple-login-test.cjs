// Simple Login Test - Blood Donation System
// Similar to Selenium Java test structure

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function main() {
  // Set up Chrome driver
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--window-size=1920,1080');
  
  console.log('Starting ChromeDriver...');
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();
  
  try {
    console.log('ChromeDriver started successfully.');
    console.log('');
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await driver.get("http://localhost:5173/login");
    await driver.sleep(2000);
    
    // Find and fill email input
    console.log('Finding email input field...');
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.sendKeys("jeevan@gmail.com");
    console.log('Email entered: jeevan@gmail.com');
    
    // Find and fill password input
    console.log('Finding password input field...');
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.sendKeys("Jeevan123!@#");
    console.log('Password entered: ************');
    
    // Click login button
    console.log('Finding login button...');
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();
    console.log('Login button clicked');
    
    // Wait for redirect
    console.log('Waiting for authentication...');
    await driver.sleep(3000);
    
    // Handle any alerts
    try {
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      console.log('Alert detected: ' + alertText);
      await alert.accept();
      console.log('Alert dismissed');
    } catch (e) {
      // No alert present, continue
    }
    
    // Get current URL
    const currentUrl = await driver.getCurrentUrl();
    const expectedUrl = "http://localhost:5173/login";
    
    console.log('');
    console.log('Current URL: ' + currentUrl);
    console.log('Expected different from: ' + expectedUrl);
    
    // Check if login was successful (URL changed from login page)
    if (!currentUrl.includes('/login') || currentUrl !== expectedUrl) {
      console.log('');
      console.log('✅ Test passed');
      console.log('Login successful - Redirected to: ' + currentUrl);
    } else {
      console.log('');
      console.log('❌ Test failed');
      console.log('Still on login page - Authentication failed');
    }
    
  } catch (error) {
    console.log('');
    console.log('❌ Test failed');
    console.log('Error: ' + error.message);
  } finally {
    console.log('');
    console.log('Closing browser...');
    await driver.quit();
    console.log('Browser closed.');
  }
}

// Run the test
main();

