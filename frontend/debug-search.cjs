const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function debug() {
    const options = new chrome.Options().addArguments('--headless', '--no-sandbox');
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    try {
        await driver.get('http://localhost:5173/donor-search');
        await driver.sleep(5000);
        const source = await driver.getPageSource();
        console.log('--- PAGE SOURCE START ---');
        console.log(source);
        console.log('--- PAGE SOURCE END ---');
    } catch (err) {
        console.error(err);
    } finally {
        await driver.quit();
    }
}
debug();
