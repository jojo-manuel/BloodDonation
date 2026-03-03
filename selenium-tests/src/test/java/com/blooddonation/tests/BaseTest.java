package com.blooddonation.tests;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import java.time.Duration;

public class BaseTest {
    protected WebDriver driver;

    // Use the URL your frontend currently runs on. By default it usually runs on 5173 (Vite) or 3000 (Create React App) 
    protected String baseUrl = "http://localhost:5173";

    @BeforeMethod
    public void setUp() {
        // Selenium 4.6+ comes with Selenium Manager which handles browser drivers automatically.
        ChromeOptions options = new ChromeOptions();
        
        // Uncomment the line below if you want tests to run headlessly (without opening browser UI)
        // options.addArguments("--headless=new"); 

        options.addArguments("--start-maximized");
        options.addArguments("--remote-allow-origins=*");
        
        driver = new ChromeDriver(options);
        
        // Setup implicit wait
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
