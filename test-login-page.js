const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function testLoginPage() {
  console.log('================================================================================');
  console.log(' 🔍 LOGIN PAGE DIAGNOSTIC TEST');
  console.log('================================================================================');
  console.log('');
  console.log('This script will:');
  console.log('  1. Open Chrome browser');
  console.log('  2. Navigate to your login page');
  console.log('  3. Check what form elements exist');
  console.log('  4. Show you what the page looks like');
  console.log('');
  console.log('🚀 Starting test...');
  console.log('');
  
  const options = new chrome.Options();
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  try {
    console.log('🌐 Navigating to: http://localhost:5173/login');
    await driver.get('http://localhost:5173/login');
    
    console.log('⏳ Waiting 5 seconds for page to fully load...');
    await driver.sleep(5000);
    
    const currentUrl = await driver.getCurrentUrl();
    console.log(`\\n📍 Current URL: ${currentUrl}`);
    
    if (currentUrl !== 'http://localhost:5173/login') {
      console.log(`⚠️  WARNING: Page redirected! Expected /login but got: ${currentUrl}`);
    }
    
    const pageTitle = await driver.getTitle();
    console.log(`📄 Page Title: ${pageTitle}`);
    
    console.log('\\n================================================================================');
    console.log(' 🔍 CHECKING FOR LOGIN FORM ELEMENTS');
    console.log('================================================================================\\n');
    
    // Check various possible input names
    const checks = [
      { selector: 'input[name="username"]', desc: 'Input with name="username"' },
      { selector: 'input[name="email"]', desc: 'Input with name="email"' },
      { selector: 'input[name="identifier"]', desc: 'Input with name="identifier"' },
      { selector: 'input[type="email"]', desc: 'Input with type="email"' },
      { selector: 'input[type="text"]', desc: 'Input with type="text"' },
      { selector: 'input[placeholder*="mail"]', desc: 'Input with "mail" in placeholder (case-insensitive)' },
      { selector: 'input[placeholder*="Mail"]', desc: 'Input with "Mail" in placeholder' },
      { selector: 'input[placeholder*="username"]', desc: 'Input with "username" in placeholder' },
      { selector: 'input[placeholder*="Username"]', desc: 'Input with "Username" in placeholder' },
      { selector: 'input[type="password"]', desc: 'Password input' },
      { selector: 'input[name="password"]', desc: 'Password with name="password"' },
      { selector: 'button[type="submit"]', desc: 'Submit button' },
      { selector: 'button:contains("Login")', desc: 'Button containing "Login"' },
      { selector: 'button:contains("Sign")', desc: 'Button containing "Sign"' },
    ];
    
    let foundElements = [];
    let missingElements = [];
    
    for (const check of checks) {
      try {
        const elements = await driver.findElements(By.css(check.selector));
        if (elements.length > 0) {
          console.log(`✅ FOUND: ${check.desc}`);
          foundElements.push(check.desc);
          
          // Try to get more details about the first matching element
          try {
            const tagName = await elements[0].getTagName();
            const name = await elements[0].getAttribute('name');
            const type = await elements[0].getAttribute('type');
            const placeholder = await elements[0].getAttribute('placeholder');
            const id = await elements[0].getAttribute('id');
            
            console.log(`   ├─ Tag: ${tagName}`);
            if (name) console.log(`   ├─ name="${name}"`);
            if (type) console.log(`   ├─ type="${type}"`);
            if (placeholder) console.log(`   ├─ placeholder="${placeholder}"`);
            if (id) console.log(`   └─ id="${id}"`);
          } catch (e) {
            // Ignore if we can't get attributes
          }
        } else {
          console.log(`❌ NOT FOUND: ${check.desc}`);
          missingElements.push(check.desc);
        }
      } catch (e) {
        console.log(`❌ NOT FOUND: ${check.desc}`);
        missingElements.push(check.desc);
      }
    }
    
    console.log('\\n================================================================================');
    console.log(' 📊 SUMMARY');
    console.log('================================================================================\\n');
    console.log(`✅ Found Elements: ${foundElements.length}`);
    console.log(`❌ Missing Elements: ${missingElements.length}`);
    
    if (foundElements.length === 0) {
      console.log('\\n⚠️  WARNING: No login form elements found!');
      console.log('   Possible reasons:');
      console.log('   1. Wrong URL (page redirected or different path)');
      console.log('   2. Page uses different form structure');
      console.log('   3. Login form is inside a modal/popup');
      console.log('   4. React app not fully loaded (try increasing wait time)');
    } else {
      console.log('\\n✅ Login form detected!');
      console.log('\\n💡 RECOMMENDATION:');
      console.log('   Update your test file to use the selectors shown above.');
      console.log('   Look for the ✅ FOUND entries and use those CSS selectors.');
    }
    
    console.log('\\n================================================================================');
    console.log(' 👀 CHECK THE BROWSER WINDOW');
    console.log('================================================================================\\n');
    console.log('Look at the Chrome window that opened.');
    console.log('Do you see a login form?');
    console.log('Right-click on the email/username field → Inspect Element');
    console.log('\\nBrowser will close in 30 seconds...');
    console.log('(Press Ctrl+C to close immediately)');
    console.log('');
    
    await driver.sleep(30000);
    
  } catch (error) {
    console.error('\\n❌ ERROR:', error.message);
    console.error('\\nFull error:', error);
  } finally {
    await driver.quit();
    console.log('\\n🔚 Browser closed');
    console.log('\\n================================================================================');
    console.log(' 📝 NEXT STEPS');
    console.log('================================================================================\\n');
    console.log('1. Review the elements found above');
    console.log('2. Update donor_search_standalone_steps.cjs with correct selectors');
    console.log('3. Run tests again: .\\run-donor-search-tests.bat');
    console.log('\\nFor more help, see: DONOR-SEARCH-TEST-TROUBLESHOOTING.md');
    console.log('\\n');
  }
})();

