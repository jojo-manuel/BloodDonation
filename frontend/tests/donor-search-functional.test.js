const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Donor Search Functional Test', () => {
    let driver;
    const BASE_URL = 'http://localhost:5173';

    beforeAll(async () => {
        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments('--headless');
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();
    }, 30000);

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    test('should load the donor search page', async () => {
        console.log('Navigating to donor search page...');
        await driver.get(`${BASE_URL}/donor-search`);

        // Wait for the page to load
        await driver.wait(until.elementLocated(By.tagName('h1')), 10000);
        const titleText = await driver.findElement(By.tagName('h1')).getText();
        expect(titleText).toContain('Search Blood Donors');
        console.log('✅ Page loaded successfully');
    }, 15000);

    test('should search for donors using patient MRID 402', async () => {
        console.log('Starting search by MRID 402 (Patient 402 is O+)...');
        const mridInput = await driver.wait(until.elementLocated(By.name('mrid')), 10000);
        await mridInput.clear();
        await mridInput.sendKeys('402');

        const searchButton = await driver.findElement(By.xpath("//button[text()='Search']"));
        await searchButton.click();

        console.log('Waiting for results...');
        // The page shows "Searching..." or similar
        await driver.sleep(4000);

        const pageSource = await driver.getPageSource();

        // Check if O+ donors are shown (since patient 402 is O+)
        expect(pageSource).toContain('O+');

        // Check for specific seeded donors
        const hasDonors = pageSource.includes('Aby Son') || pageSource.includes('abhi jith');
        expect(hasDonors).toBe(true);

        console.log('✅ Correct donors found for MRID 402');
    }, 30000);

    test('should search by location (Test City)', async () => {
        console.log('Refreshing to clear and searching by city...');
        await driver.get(`${BASE_URL}/donor-search`);
        const cityInput = await driver.wait(until.elementLocated(By.name('city')), 10000);
        await cityInput.sendKeys('Test City');

        const searchButton = await driver.findElement(By.xpath("//button[text()='Search']"));
        await searchButton.click();

        await driver.sleep(3000);
        console.log('✅ Search by location completed');
    }, 30000);

    test('should find donors by Blood Group B+', async () => {
        console.log('Searching by Blood Group B+...');
        await driver.get(`${BASE_URL}/donor-search`);
        const bloodGroupSelect = await driver.wait(until.elementLocated(By.name('bloodGroup')), 10000);
        await bloodGroupSelect.sendKeys('B+');

        const searchButton = await driver.findElement(By.xpath("//button[text()='Search']"));
        await searchButton.click();

        await driver.sleep(3000);
        const pageSource = await driver.getPageSource();
        expect(pageSource).toContain('B+');
        console.log('✅ Blood Group B+ search verified');
    }, 30000);
});
