package com.blooddonation.tests;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.time.Duration;

public class LoginTest extends BaseTest {

    @Test
    public void testSuccessfulLogin() {
        // Assume frontend React is running on localhost:3000
        driver.get(baseUrl + "/login");
        
        // Wait until page is loaded
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        
        // Note: The specific locators for email/password/button depend on your frontend code
        // Update these selectors based on your actual React application inputs
        
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//input[@type='email' or @name='email']")));
        WebElement passwordInput = driver.findElement(By.xpath("//input[@type='password' or @name='password']"));
        WebElement loginButton = driver.findElement(By.xpath("//button[@type='submit' or contains(text(), 'Login')]"));

        // Entering credentials
        emailInput.sendKeys( "Abyson@gmail.com"); // Fill with valid test credentials
        passwordInput.sendKeys("#Saveme@2001");
        loginButton.click();

        // Verify successful login (e.g., check for dashboard URL or specific element)
        // Wait for the URL to contain 'dashboard', 'admin', or whatever your app routes to after login
        boolean urlChanged = wait.until(ExpectedConditions.urlContains("/dashboard"));
        Assert.assertTrue(urlChanged, "Login failed, URL did not become /dashboard");
        
        // Optionally assert some post-login element is visible
        // WebElement dashboardHeading = wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("h1")));
        // Assert.assertTrue(dashboardHeading.getText().contains("Dashboard"), "Dashboard heading not found");
    }

    @Test
    public void testInvalidLogin() {
        driver.get(baseUrl + "/login");

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//input[@type='email' or @name='email']")));
        WebElement passwordInput = driver.findElement(By.xpath("//input[@type='password' or @name='password']"));
        WebElement loginButton = driver.findElement(By.xpath("//button[@type='submit' or contains(text(), 'Login')]"));

        emailInput.sendKeys("invaliduser@example.com");
        passwordInput.sendKeys("wrongpassword");
        loginButton.click();

        // Check for error message display
        // Example locator for error toast or span, change it based on your app
        WebElement errorMessage = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(text(), 'Invalid credentials') or contains(text(), 'error')]")));
        
        Assert.assertTrue(errorMessage.isDisplayed(), "Error message was not displayed for invalid login.");
    }
}
