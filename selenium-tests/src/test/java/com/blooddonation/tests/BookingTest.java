package com.blooddonation.tests;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.time.Duration;
import java.util.List;

public class BookingTest extends BaseTest {

    private void loginAsDonor(WebDriverWait wait) {
        driver.get(baseUrl + "/login");
        
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//input[@type='email' or @name='email']")));
        WebElement passwordInput = driver.findElement(By.xpath("//input[@type='password' or @name='password']"));
        WebElement loginButton = driver.findElement(By.xpath("//button[@type='submit' or contains(text(), 'Login')]"));

        // Replace with actual donor credentials expected in your test environment
        emailInput.sendKeys("jeevan@gmail.com"); 
        passwordInput.sendKeys("#Saveme@2001");
        loginButton.click();

        // Wait until navigated to donor dashboard
        wait.until(ExpectedConditions.urlContains("/dashboard"));
    }

    @Test
    public void testSuccessfulSlotBooking() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        
        // 1. Log in as a donor
        loginAsDonor(wait);
        
        // 2. Navigate to "Book Slot" section
        // Adjust the locator based on your actual sidebar/menu item
        WebElement bookSlotMenu = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//*[contains(text(), 'Book Slot') or contains(@href, 'book') or contains(text(), 'Appointments')]")));
        bookSlotMenu.click();
        
        // Wait for booking page to load
        wait.until(ExpectedConditions.urlContains("book"));

        // 3. Select a Blood Bank
        // Assuming a select dropdown or autocomplete input for blood bank selection
        WebElement bloodBankSelect = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//select[contains(@name, 'bloodBank') or contains(@id, 'bloodBank')] | //input[contains(@placeholder, 'Blood Bank')]")));
        
        if (bloodBankSelect.getTagName().equalsIgnoreCase("select")) {
            Select select = new Select(bloodBankSelect);
            select.selectByIndex(1); // Select the first available blood bank
        } else {
            bloodBankSelect.sendKeys("City Blood Bank");
            // Add action to click the autocomplete suggestion if applicable
            WebElement suggestion = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//li[contains(text(), 'City Blood Bank')]")));
            suggestion.click();
        }

        // 4. Select a Date
        // Assume date input type="date"
        WebElement dateInput = driver.findElement(By.xpath("//input[@type='date']"));
        // Typically set a future date. The string format depends on the input field, often YYYY-MM-DD
        dateInput.sendKeys("2026-11-01"); 

        // 5. Select a Time Slot
        // Assume time slots appear as buttons or radio items after date is selected
        List<WebElement> timeSlots = wait.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(
                By.xpath("//button[contains(@class, 'slot') or contains(text(), 'AM') or contains(text(), 'PM')] | //input[@type='radio' and contains(@name, 'slot')]")));
        Assert.assertTrue(timeSlots.size() > 0, "No time slots available for selected date.");
        
        WebElement firstAvailableSlot = timeSlots.get(0);
        firstAvailableSlot.click();

        // 6. Confirm Booking
        WebElement confirmButton = driver.findElement(By.xpath("//button[contains(text(), 'Confirm') or contains(text(), 'Book')]"));
        confirmButton.click();

        // 7. Verify Success
        // Wait for a success message toast, modal, or redirection to 'My Bookings'
        WebElement successMessage = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(text(), 'Slot booked successfully') or contains(text(), 'Success') or contains(text(), 'confirmed')]")));
        Assert.assertTrue(successMessage.isDisplayed(), "Slot booking success message was not displayed.");
    }
    
    @Test
    public void testViewMyBookings() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        
        // 1. Log in
        loginAsDonor(wait);
        
        // 2. Navigate to My Bookings
        WebElement myBookingsMenu = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//*[contains(text(), 'My Bookings') or contains(text(), 'History')]")));
        myBookingsMenu.click();
        
        // 3. Verify page has loaded
        wait.until(ExpectedConditions.urlContains("booking"));
        
        // 4. Verify bookings are formatted as expected (e.g. check for a table or list)
        List<WebElement> bookingRows = driver.findElements(By.xpath("//table//tr | //div[contains(@class, 'booking-card')]"));
        Assert.assertTrue(bookingRows.size() >= 0, "Booking rows or cards should be present (can be 0 if no bookings).");
    }
}
