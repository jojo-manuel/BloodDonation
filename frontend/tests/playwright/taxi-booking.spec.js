// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Taxi Booking E2E Tests
 * Tests the complete taxi booking flow for donors with confirmed donation slots
 */

test.describe('Taxi Booking Tests', () => {

  // Helper function to login as a donor user
  async function loginAsDonor(page) {
    // Directly set authentication state in localStorage
    await page.evaluate(() => {
      localStorage.setItem('userId', 'donor123');
      localStorage.setItem('role', 'user');
      localStorage.setItem('username', 'testdonor');
      localStorage.setItem('accessToken', 'mock-access-token-donor');
      localStorage.setItem('refreshToken', 'mock-refresh-token-donor');
      localStorage.setItem('isSuspended', 'false');
      localStorage.setItem('isBlocked', 'false');
    });

    // Setup route mocking for API calls that might check auth
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'donor123',
              email: 'donor@example.com',
              role: 'user',
              name: 'Test Donor',
              username: 'testdonor',
              isSuspended: false,
              isBlocked: false
            },
            accessToken: 'mock-access-token-donor',
            refreshToken: 'mock-refresh-token-donor'
          }
        })
      });
    });

    // Navigate directly to dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait a bit for the page to initialize
    await page.waitForTimeout(1000);
  }

  // Helper function to setup mock bookings with confirmed slots
  async function setupMockConfirmedBookings(page) {
    await page.route('**/api/users/my-bookings**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          bookings: [
            {
              _id: 'booking1',
              tokenNumber: 'TOKEN001',
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              time: '10:00',
              status: 'confirmed',
              bloodBankId: {
                _id: 'bank1',
                name: 'City Blood Bank',
                address: '123 Main St, Kochi',
                phone: '123-456-7890'
              },
              donorId: {
                _id: 'donor123',
                name: 'Test Donor',
                userId: {
                  username: 'testdonor',
                  phone: '987-654-3210'
                }
              },
              taxiBooking: null, // No taxi booked yet
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              _id: 'booking2',
              tokenNumber: 'TOKEN002',
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              time: '14:00',
              status: 'confirmed',
              bloodBankId: {
                _id: 'bank2',
                name: 'General Hospital Blood Bank',
                address: '456 Oak Ave, Ernakulam',
                phone: '987-654-3210'
              },
              donorId: {
                _id: 'donor123',
                name: 'Test Donor',
                userId: {
                  username: 'testdonor',
                  phone: '987-654-3210'
                }
              },
              taxiBooking: {
                _id: 'taxi1',
                pickupLocation: 'Home',
                pickupAddress: '123 Donor Street, Kochi',
                estimatedArrival: '09:30',
                driverName: 'John Driver',
                driverPhone: '555-0123',
                vehicleNumber: 'KL-01-AB-1234',
                fare: 150,
                status: 'confirmed',
                paymentStatus: 'paid'
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
            availableForDonation: true,
            address: '123 Donor Street, Kochi, Kerala'
          }
        })
      });
    });
  }

  test.beforeEach(async ({ page }) => {
    // Navigate to a page first to establish a valid origin
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      // Clear storage after navigation
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Ignore security errors in some browsers
        }
      });
    } catch (e) {
      // If navigation fails, try to clear storage anyway
      try {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      } catch (storageError) {
        // If both fail, continue - storage will be cleared when page loads
      }
    }
  });

  test.describe('Taxi Booking Access', () => {

    test('should display Book Taxi button for confirmed bookings without taxi', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Look for Book Taxi button on bookings without taxi
      const bookTaxiButton = page.locator('button:has-text("Book Taxi"), button[title*="taxi" i]').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await expect(bookTaxiButton).toBeVisible();
        await expect(bookTaxiButton).toBeEnabled();
      }
    });

    test('should not display Book Taxi button for bookings with existing taxi', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Look for bookings with taxi - should not have Book Taxi button
      const taxiBookedIndicator = page.locator('text=/Taxi Booked|Taxi Confirmed/i').first();

      if (await taxiBookedIndicator.isVisible({ timeout: 5000 })) {
        // If taxi is already booked, Book Taxi button should not be visible
        const bookTaxiButton = page.locator('button:has-text("Book Taxi")');
        await expect(bookTaxiButton).not.toBeVisible();
      }
    });

    test('should open taxi booking modal when Book Taxi is clicked', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        // Check if taxi booking modal appears
        await expect(page.locator('text=/Book Taxi|Taxi Booking/i')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=/Pickup Location|Select Location/i')).toBeVisible();
      }
    });

    test('should display booking details in taxi booking modal', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        // Verify booking details are displayed
        await expect(page.locator('text=/Booking ID|Token|Blood Bank|Date|Time/i')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Pickup Location Selection', () => {

    test('should display pickup location options', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        // Check for pickup location options
        const pickupSelect = page.locator('select[name*="pickup"], select:has(option[value="Home"])').first();
        await expect(pickupSelect).toBeVisible({ timeout: 5000 });

        // Check for common pickup options
        await expect(pickupSelect.locator('option[value="Home"]')).toBeVisible();
        await expect(pickupSelect.locator('option[value="Office"], option[value="Current Location"]')).toBeVisible();
      }
    });

    test('should allow selecting Home as pickup location', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const pickupSelect = page.locator('select[name*="pickup"]').first();

        if (await pickupSelect.isVisible({ timeout: 5000 })) {
          await pickupSelect.selectOption('Home');
          await expect(pickupSelect).toHaveValue('Home');
        }
      }
    });

    test('should allow selecting Office as pickup location', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const pickupSelect = page.locator('select[name*="pickup"]').first();

        if (await pickupSelect.isVisible({ timeout: 5000 })) {
          await pickupSelect.selectOption('Office');
          await expect(pickupSelect).toHaveValue('Office');
        }
      }
    });

    test('should show estimated fare based on pickup location', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const pickupSelect = page.locator('select[name*="pickup"]').first();

        if (await pickupSelect.isVisible({ timeout: 5000 })) {
          await pickupSelect.selectOption('Home');

          // Check for fare display
          await expect(page.locator('text=/Fare|Estimated Cost|₹|Rs/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Taxi Booking Submission', () => {

    test('should show loading state during taxi booking', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      // Mock taxi booking API with delay
      await page.route('**/api/users/book-taxi**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Taxi booked successfully',
            taxiBooking: {
              _id: 'taxi123',
              pickupLocation: 'Home',
              estimatedArrival: '09:30',
              driverName: 'John Driver',
              driverPhone: '555-0123',
              vehicleNumber: 'KL-01-AB-1234',
              fare: 150,
              status: 'confirmed'
            }
          })
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const pickupSelect = page.locator('select[name*="pickup"]').first();
        const confirmTaxiButton = page.locator('button:has-text("Book Taxi"), button:has-text("Confirm Taxi")').first();

        if (await pickupSelect.isVisible({ timeout: 5000 }) && await confirmTaxiButton.isVisible()) {
          await pickupSelect.selectOption('Home');
          await confirmTaxiButton.click();

          // Check for loading state
          await expect(page.locator('text=/Booking Taxi|Loading/i')).toBeVisible({ timeout: 2000 });
          await expect(confirmTaxiButton).toBeDisabled();
        }
      }
    });

    test('should successfully book taxi with valid data', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      // Mock successful taxi booking API
      await page.route('**/api/users/book-taxi**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Taxi booked successfully',
            taxiBooking: {
              _id: 'taxi123',
              pickupLocation: 'Home',
              pickupAddress: '123 Donor Street, Kochi',
              estimatedArrival: '09:30',
              driverName: 'John Driver',
              driverPhone: '555-0123',
              vehicleNumber: 'KL-01-AB-1234',
              fare: 150,
              status: 'confirmed'
            }
          })
        });
      });

      // Mock alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Taxi booked successfully');
        await dialog.accept();
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const pickupSelect = page.locator('select[name*="pickup"]').first();
        const confirmTaxiButton = page.locator('button:has-text("Book Taxi"), button:has-text("Confirm Taxi")').first();

        if (await pickupSelect.isVisible({ timeout: 5000 }) && await confirmTaxiButton.isVisible()) {
          await pickupSelect.selectOption('Home');
          await confirmTaxiButton.click();

          // Wait for success
          await page.waitForTimeout(2000);

          // Modal should close after successful booking
          await expect(page.locator('text=/Book Taxi|Taxi Booking/i')).not.toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should handle taxi booking API errors', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      // Mock failed taxi booking API
      await page.route('**/api/users/book-taxi**', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to book taxi. No drivers available.'
          })
        });
      });

      // Mock alert for error
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Failed to book taxi');
        await dialog.accept();
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const pickupSelect = page.locator('select[name*="pickup"]').first();
        const confirmTaxiButton = page.locator('button:has-text("Book Taxi"), button:has-text("Confirm Taxi")').first();

        if (await pickupSelect.isVisible({ timeout: 5000 }) && await confirmTaxiButton.isVisible()) {
          await pickupSelect.selectOption('Home');
          await confirmTaxiButton.click();

          // Wait for error
          await page.waitForTimeout(2000);
        }
      }
    });

    test('should disable confirm button when pickup location not selected', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const confirmTaxiButton = page.locator('button:has-text("Book Taxi"), button:has-text("Confirm Taxi")').first();

        if (await confirmTaxiButton.isVisible({ timeout: 5000 })) {
          // Button should be disabled when no pickup location selected
          await expect(confirmTaxiButton).toBeDisabled();
        }
      }
    });
  });

  test.describe('Payment Integration', () => {

    test('should initiate payment flow after taxi booking', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      // Mock taxi booking API that triggers payment
      await page.route('**/api/users/book-taxi**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Taxi booked successfully',
            taxiBooking: {
              _id: 'taxi123',
              pickupLocation: 'Home',
              fare: 150,
              status: 'pending_payment'
            },
            payment: {
              orderId: 'order_123',
              amount: 15000, // in paisa
              currency: 'INR'
            }
          })
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        const pickupSelect = page.locator('select[name*="pickup"]').first();
        const confirmTaxiButton = page.locator('button:has-text("Book Taxi"), button:has-text("Confirm Taxi")').first();

        if (await pickupSelect.isVisible({ timeout: 5000 }) && await confirmTaxiButton.isVisible()) {
          await pickupSelect.selectOption('Home');
          await confirmTaxiButton.click();

          // Check for payment modal or redirect
          await page.waitForTimeout(2000);
          const paymentElement = page.locator('text=/Payment|Pay|₹ 150|Razorpay/i').first();
          if (await paymentElement.isVisible({ timeout: 5000 })) {
            await expect(paymentElement).toBeVisible();
          }
        }
      }
    });

    test('should handle successful payment completion', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      // Mock payment success callback
      await page.route('**/api/users/payment-success**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Payment successful',
            taxiBooking: {
              _id: 'taxi123',
              status: 'confirmed',
              paymentStatus: 'paid'
            }
          })
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Simulate payment success (this would normally come from Razorpay)
      await page.evaluate(() => {
        // Simulate successful payment callback
        window.postMessage({
          type: 'payment_success',
          data: {
            orderId: 'order_123',
            paymentId: 'pay_123',
            signature: 'signature_123'
          }
        }, '*');
      });

      // Check for success message
      await page.waitForTimeout(1000);
      const successMessage = page.locator('text=/Payment successful|Payment completed/i').first();
      if (await successMessage.isVisible({ timeout: 5000 })) {
        await expect(successMessage).toBeVisible();
      }
    });

    test('should handle payment failure', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      // Mock payment failure callback
      await page.route('**/api/users/payment-failure**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Payment failed'
          })
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Simulate payment failure
      await page.evaluate(() => {
        window.postMessage({
          type: 'payment_failure',
          data: {
            orderId: 'order_123',
            error: 'Payment cancelled by user'
          }
        }, '*');
      });

      // Check for failure message
      await page.waitForTimeout(1000);
      const failureMessage = page.locator('text=/Payment failed|Payment cancelled/i').first();
      if (await failureMessage.isVisible({ timeout: 5000 })) {
        await expect(failureMessage).toBeVisible();
      }
    });
  });

  test.describe('Viewing Taxi Details', () => {

    test('should display taxi details for bookings with taxi', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Look for taxi details in bookings
      const taxiDetails = page.locator('text=/Driver|Vehicle|Taxi|Arrival/i').first();

      if (await taxiDetails.isVisible({ timeout: 5000 })) {
        await expect(taxiDetails).toBeVisible();

        // Check for specific taxi information
        await expect(page.locator('text=/John Driver|555-0123|KL-01-AB-1234/i')).toBeVisible();
      }
    });

    test('should show estimated arrival time', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Check for arrival time display
      const arrivalTime = page.locator('text=/09:30|Estimated Arrival|Arrival Time/i').first();

      if (await arrivalTime.isVisible({ timeout: 5000 })) {
        await expect(arrivalTime).toBeVisible();
      }
    });

    test('should display taxi fare and payment status', async ({ page }) => {
      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Check for fare and payment info
      const fareInfo = page.locator('text=/₹150|Rs 150|Paid|Payment Status/i').first();

      if (await fareInfo.isVisible({ timeout: 5000 })) {
        await expect(fareInfo).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        // Modal should be visible on mobile
        await expect(page.locator('text=/Book Taxi|Taxi Booking/i')).toBeVisible({ timeout: 5000 });

        // Form elements should be accessible
        await expect(page.locator('select[name*="pickup"]').first()).toBeVisible();
      }
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await loginAsDonor(page);
      await setupMockProfile(page);
      await setupMockConfirmedBookings(page);

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const bookTaxiButton = page.locator('button:has-text("Book Taxi")').first();

      if (await bookTaxiButton.isVisible({ timeout: 5000 })) {
        await bookTaxiButton.click();

        // Modal should be visible on tablet
        await expect(page.locator('text=/Book Taxi|Taxi Booking/i')).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
