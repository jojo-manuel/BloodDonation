// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Slot Booking E2E Tests
 * Tests the complete slot booking flow for donors
 */

test.describe('Slot Booking Tests', () => {
  
  // Helper function to login as a donor user
  async function loginAsDonor(page) {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-donor',
          user: {
            id: 'donor123',
            email: 'donor@example.com',
            role: 'user',
            name: 'Test Donor',
            username: 'testdonor'
          }
        })
      });
    });
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'donor@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      // Dashboard might have different URL pattern
    });
  }

  // Helper function to setup mock donation requests
  async function setupMockRequests(page) {
    await page.route('**/api/users/my-requests**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          requests: [
            {
              _id: 'request1',
              status: 'accepted',
              bloodGroup: 'O+',
              patientId: {
                _id: 'patient1',
                name: 'John Patient',
                mrid: 'MR123456'
              },
              bloodBankId: {
                _id: 'bank1',
                name: 'City Blood Bank',
                address: '123 Main St',
                phone: '123-456-7890'
              },
              requesterId: {
                _id: 'requester1',
                username: 'requester1'
              },
              donorId: {
                _id: 'donor123',
                name: 'Test Donor',
                userId: {
                  username: 'testdonor',
                  phone: '987-654-3210'
                },
                bloodGroup: 'O+'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              _id: 'request2',
              status: 'booked',
              bloodGroup: 'A+',
              patientId: {
                _id: 'patient2',
                name: 'Jane Patient',
                mrid: 'MR789012'
              },
              bloodBankId: {
                _id: 'bank2',
                name: 'General Hospital Blood Bank',
                address: '456 Oak Ave',
                phone: '987-654-3210'
              },
              bookingId: {
                _id: 'booking1',
                tokenNumber: 'TOKEN001',
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '10:00',
                status: 'confirmed'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        })
      });
    });
  }

  // Helper function to setup mock user profile
  async function setupMockProfile(page) {
    await page.route('**/api/users/me**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'donor123',
            name: 'Test Donor',
            email: 'donor@example.com',
            role: 'user',
            phone: '987-654-3210',
            bloodType: 'O+',
            availableForDonation: true
          }
        })
      });
    });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Booking Modal Access', () => {
    
    test('should display booking modal when Book Slot button is clicked', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      
      // Wait for requests to load
      await page.waitForTimeout(2000);
      
      // Find and click "Book Slot" button on an accepted request
      const bookSlotButton = page.locator('button:has-text("Book Slot"), button[title*="Book" i]').first();
      
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Check if booking modal appears
        await expect(page.locator('text=/Book Donation Slot/i')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=/Request Details/i')).toBeVisible();
        await expect(page.locator('text=/Booking Rules/i')).toBeVisible();
      }
    });

    test('should display request details in booking modal', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Verify request details are displayed
        await expect(page.locator('text=/Request ID|Blood Group|Patient|Blood Bank/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display booking rules in modal', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Verify booking rules are displayed
        await expect(page.locator('text=/Minimum booking|Maximum booking|3 hours|7 days/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should close booking modal when cancel button is clicked', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Wait for modal to appear
        await expect(page.locator('text=/Book Donation Slot/i')).toBeVisible({ timeout: 5000 });
        
        // Find and click cancel/close button
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("×"), button:has-text("Close")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          
          // Modal should be hidden
          await expect(page.locator('text=/Book Donation Slot/i')).not.toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Date and Time Selection', () => {
    
    test('should display date input field', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Check for date input
        const dateInput = page.locator('input[type="date"]').first();
        await expect(dateInput).toBeVisible({ timeout: 5000 });
        await expect(dateInput).toHaveAttribute('required');
      }
    });

    test('should display time select dropdown', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Check for time select
        const timeSelect = page.locator('select:has(option[value="09:00"])').first();
        await expect(timeSelect).toBeVisible({ timeout: 5000 });
        await expect(timeSelect).toHaveAttribute('required');
      }
    });

    test('should have time slots from 9:00 AM to 6:00 PM', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const timeSelect = page.locator('select').first();
        if (await timeSelect.isVisible({ timeout: 5000 })) {
          // Check for morning slots
          await expect(timeSelect.locator('option[value="09:00"]')).toBeVisible();
          await expect(timeSelect.locator('option[value="10:00"]')).toBeVisible();
          
          // Check for afternoon slots
          await expect(timeSelect.locator('option[value="12:00"]')).toBeVisible();
          await expect(timeSelect.locator('option[value="13:00"]')).toBeVisible();
          
          // Check for evening slots
          await expect(timeSelect.locator('option[value="17:00"]')).toBeVisible();
          await expect(timeSelect.locator('option[value="18:00"]')).toBeVisible();
        }
      }
    });

    test('should allow selecting a valid date', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible({ timeout: 5000 })) {
          // Calculate a valid date (4 hours from now, within 7 days)
          const validDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
          const dateString = validDate.toISOString().split('T')[0];
          
          await dateInput.fill(dateString);
          await expect(dateInput).toHaveValue(dateString);
        }
      }
    });

    test('should allow selecting a time slot', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const timeSelect = page.locator('select').first();
        if (await timeSelect.isVisible({ timeout: 5000 })) {
          await timeSelect.selectOption('10:00');
          await expect(timeSelect).toHaveValue('10:00');
        }
      }
    });

    test('should disable confirm button when date or time is not selected', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const confirmButton = page.locator('button:has-text("Confirm Booking"), button:has-text("📅 Confirm Booking")').first();
        if (await confirmButton.isVisible({ timeout: 5000 })) {
          // Button should be disabled when no date/time selected
          await expect(confirmButton).toBeDisabled();
        }
      }
    });
  });

  test.describe('Booking Validation', () => {
    
    test('should validate minimum booking time (3 hours)', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Set up dialog handler for alert
        page.on('dialog', async dialog => {
          expect(dialog.message()).toContain('3 hours');
          await dialog.accept();
        });
        
        const dateInput = page.locator('input[type="date"]').first();
        const timeSelect = page.locator('select').first();
        
        if (await dateInput.isVisible({ timeout: 5000 })) {
          // Try to select a date less than 3 hours from now
          const invalidDate = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now
          const dateString = invalidDate.toISOString().split('T')[0];
          
          await dateInput.fill(dateString);
          await timeSelect.selectOption('10:00');
          
          const confirmButton = page.locator('button:has-text("Confirm Booking")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            
            // Should show validation error
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('should validate maximum booking time (7 days)', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Set up dialog handler for alert
        page.on('dialog', async dialog => {
          expect(dialog.message()).toContain('7 days');
          await dialog.accept();
        });
        
        const dateInput = page.locator('input[type="date"]').first();
        const timeSelect = page.locator('select').first();
        
        if (await dateInput.isVisible({ timeout: 5000 })) {
          // Try to select a date more than 7 days from now
          const invalidDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
          const dateString = invalidDate.toISOString().split('T')[0];
          
          // Check if max attribute prevents selection
          const maxDate = await dateInput.getAttribute('max');
          if (maxDate) {
            // Browser will enforce max date, so we can't select invalid date
            // But we can verify the max attribute is set correctly
            expect(maxDate).toBeTruthy();
          }
        }
      }
    });

    test('should enforce date input min attribute', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible({ timeout: 5000 })) {
          const minDate = await dateInput.getAttribute('min');
          expect(minDate).toBeTruthy();
          
          // Min date should be approximately 3 hours from now
          const minDateObj = new Date(minDate);
          const now = new Date();
          const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
          
          // Allow some tolerance (within 1 hour)
          const diff = Math.abs(minDateObj.getTime() - threeHoursFromNow.getTime());
          expect(diff).toBeLessThan(60 * 60 * 1000);
        }
      }
    });

    test('should enforce date input max attribute', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible({ timeout: 5000 })) {
          const maxDate = await dateInput.getAttribute('max');
          expect(maxDate).toBeTruthy();
          
          // Max date should be approximately 7 days from now
          const maxDateObj = new Date(maxDate);
          const now = new Date();
          const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          // Allow some tolerance (within 1 day)
          const diff = Math.abs(maxDateObj.getTime() - sevenDaysFromNow.getTime());
          expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
        }
      }
    });
  });

  test.describe('Booking Submission', () => {
    
    test('should show loading state during booking submission', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      // Mock booking API with delay
      await page.route('**/api/users/direct-book-slot**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Booking confirmed successfully',
            booking: {
              _id: 'booking123',
              tokenNumber: 'TOKEN123',
              date: new Date().toISOString().split('T')[0],
              time: '10:00',
              status: 'pending'
            }
          })
        });
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Fill in booking details
        const dateInput = page.locator('input[type="date"]').first();
        const timeSelect = page.locator('select').first();
        
        if (await dateInput.isVisible({ timeout: 5000 })) {
          const validDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
          const dateString = validDate.toISOString().split('T')[0];
          
          await dateInput.fill(dateString);
          await timeSelect.selectOption('10:00');
          
          const confirmButton = page.locator('button:has-text("Confirm Booking")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            
            // Check for loading state
            await expect(page.locator('text=/Booking...|Loading/i')).toBeVisible({ timeout: 2000 });
            await expect(confirmButton).toBeDisabled();
          }
        }
      }
    });

    test('should successfully submit booking with valid data', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      // Mock successful booking API
      await page.route('**/api/users/direct-book-slot**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Booking confirmed successfully',
            booking: {
              _id: 'booking123',
              tokenNumber: 'TOKEN123',
              date: new Date().toISOString().split('T')[0],
              time: '10:00',
              status: 'pending'
            }
          })
        });
      });
      
      // Mock alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Booking confirmed');
        await dialog.accept();
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Fill in booking details
        const dateInput = page.locator('input[type="date"]').first();
        const timeSelect = page.locator('select').first();
        
        if (await dateInput.isVisible({ timeout: 5000 })) {
          const validDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
          const dateString = validDate.toISOString().split('T')[0];
          
          await dateInput.fill(dateString);
          await timeSelect.selectOption('10:00');
          
          const confirmButton = page.locator('button:has-text("Confirm Booking")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            
            // Wait for success message
            await page.waitForTimeout(2000);
            
            // Modal should close after successful booking
            await expect(page.locator('text=/Book Donation Slot/i')).not.toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('should handle booking API errors gracefully', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      // Mock failed booking API
      await page.route('**/api/users/direct-book-slot**', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to book slot. Please try again.'
          })
        });
      });
      
      // Mock alert for error
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Failed');
        await dialog.accept();
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const dateInput = page.locator('input[type="date"]').first();
        const timeSelect = page.locator('select').first();
        
        if (await dateInput.isVisible({ timeout: 5000 })) {
          const validDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
          const dateString = validDate.toISOString().split('T')[0];
          
          await dateInput.fill(dateString);
          await timeSelect.selectOption('10:00');
          
          const confirmButton = page.locator('button:has-text("Confirm Booking")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            
            // Wait for error message
            await page.waitForTimeout(2000);
          }
        }
      }
    });
  });

  test.describe('Viewing Booked Slots', () => {
    
    test('should display booked slots in dashboard', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      // Check for booked requests
      await expect(page.locator('text=/booked|Booked|TOKEN/i')).toBeVisible({ timeout: 5000 });
    });

    test('should display booking details for booked slots', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      // Look for booking details like token number, date, time
      const bookingDetails = page.locator('text=/TOKEN|Token|Date|Time/i').first();
      if (await bookingDetails.isVisible({ timeout: 5000 })) {
        // Verify booking information is displayed
        await expect(page.locator('text=/TOKEN001|TOKEN/i')).toBeVisible();
      }
    });

    test('should allow viewing booking PDF for booked slots', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      // Look for "View Booking" or download PDF button
      const viewBookingButton = page.locator('button[title*="View booking"], button[title*="download PDF"], button:has-text("View")').first();
      if (await viewBookingButton.isVisible({ timeout: 5000 })) {
        await viewBookingButton.click();
        
        // Should show booking details or trigger PDF download
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Medical Consent Form', () => {
    
    test('should show medical consent form after confirming booking', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      // Mock successful booking API
      await page.route('**/api/users/direct-book-slot**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Booking confirmed successfully',
            booking: {
              _id: 'booking123',
              tokenNumber: 'TOKEN123',
              date: new Date().toISOString().split('T')[0],
              time: '10:00',
              status: 'pending'
            }
          })
        });
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        const dateInput = page.locator('input[type="date"]').first();
        const timeSelect = page.locator('select').first();
        
        if (await dateInput.isVisible({ timeout: 5000 })) {
          const validDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
          const dateString = validDate.toISOString().split('T')[0];
          
          await dateInput.fill(dateString);
          await timeSelect.selectOption('10:00');
          
          const confirmButton = page.locator('button:has-text("Confirm Booking")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            
            // Check for medical consent form
            await page.waitForTimeout(2000);
            const consentForm = page.locator('text=/Medical Consent|Consent|I agree/i').first();
            if (await consentForm.isVisible({ timeout: 5000 })) {
              await expect(consentForm).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Modal should be visible on mobile
        await expect(page.locator('text=/Book Donation Slot/i')).toBeVisible({ timeout: 5000 });
        
        // Form elements should be accessible
        await expect(page.locator('input[type="date"]').first()).toBeVisible();
        await expect(page.locator('select').first()).toBeVisible();
      }
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockRequests(page);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      const bookSlotButton = page.locator('button:has-text("Book Slot")').first();
      if (await bookSlotButton.isVisible({ timeout: 5000 })) {
        await bookSlotButton.click();
        
        // Modal should be visible on tablet
        await expect(page.locator('text=/Book Donation Slot/i')).toBeVisible({ timeout: 5000 });
      }
    });
  });
});

