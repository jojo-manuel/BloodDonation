const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function test() {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');

    console.log('Starting driver...');
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        console.log('Navigating to http://localhost:5173...');
        await driver.get('http://localhost:5173');
        const title = await driver.getTitle();
        console.log('Page Title:', title);

        // Check for some content
        const bodyText = await driver.findElement(By.tagName('body')).getText();
        console.log('Body length:', bodyText.length);
        console.log('Body snippet:', bodyText.substring(0, 100));
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await driver.quit();
    }
}

test();
