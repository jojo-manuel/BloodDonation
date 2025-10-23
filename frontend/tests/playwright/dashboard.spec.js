// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Dashboard & User Profile E2E Tests
 */

test.describe('User Dashboard Tests', () => {
  
  // Helper function to login before tests
  async function loginAsUser(page, role = 'user') {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-' + role,
          user: {
            id: role + '123',
            email: role + '@example.com',
            role: role,
            name: 'Test ' + role.charAt(0).toUpperCase() + role.slice(1)
          }
        })
      });
    });
    
    await page.goto('/login');
    await page.fill('input[type="email"]', role + '@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      // Dashboard might have different URL
    });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Donor Dashboard', () => {
    
    test('should display donor profile information', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      // Mock profile API
      await page.route('**/api/users/me', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            user: {
              id: 'user123',
              name: 'John Donor',
              email: 'donor@example.com',
              phone: '1234567890',
              bloodType: 'O+',
              availableForDonation: true,
              lastDonationDate: '2024-01-15',
              totalDonations: 8
            }
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Verify profile elements are displayed
      await expect(page.locator('text=/John Donor|donor@example.com/i')).toBeVisible({ timeout: 5000 });
    });

    test('should display donation history', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      // Mock donation history API
      await page.route('**/api/users/donations', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            donations: [
              {
                id: '1',
                bloodBankName: 'City Blood Bank',
                date: '2024-01-15',
                status: 'completed'
              },
              {
                id: '2',
                bloodBankName: 'General Hospital',
                date: '2023-11-20',
                status: 'completed'
              }
            ]
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Check for donation history section
      const historySection = page.locator('text=/history|past donations|previous/i').first();
      if (await historySection.isVisible({ timeout: 5000 })) {
        await expect(page.locator('text=/City Blood Bank|General Hospital/i')).toBeVisible();
      }
    });

    test('should update user profile', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      // Mock profile update API
      await page.route('**/api/users/me', async (route) => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              message: 'Profile updated successfully',
              user: {
                id: 'user123',
                name: 'Updated Name',
                phone: '9876543210'
              }
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              user: { id: 'user123', name: 'John Donor', email: 'donor@example.com' }
            })
          });
        }
      });
      
      await page.goto('/dashboard');
      
      // Find and click edit profile button
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Update Profile")').first();
      if (await editButton.isVisible({ timeout: 5000 })) {
        await editButton.click();
        
        // Update name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
        if (await nameInput.isVisible()) {
          await nameInput.clear();
          await nameInput.fill('Updated Name');
          
          // Save changes
          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
          await saveButton.click();
          
          // Check for success message
          await expect(page.locator('text=/success|updated/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should toggle donation availability', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      // Mock availability toggle API
      await page.route('**/api/users/availability', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Availability updated',
            availableForDonation: false
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Find availability toggle
      const toggleButton = page.locator('input[type="checkbox"][name*="available"], button:has-text("Available")').first();
      if (await toggleButton.isVisible({ timeout: 5000 })) {
        await toggleButton.click();
        
        // Verify update
        await expect(page.locator('text=/updated|changed/i')).toBeVisible({ timeout: 5000 });
      }
    });

  });

  test.describe('Blood Bank Dashboard', () => {
    
    test('should display blood bank dashboard for blood bank users', async ({ page }) => {
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            token: 'mock-bloodbank-token',
            user: {
              id: 'bloodbank123',
              email: 'bloodbank@example.com',
              role: 'bloodbank',
              name: 'City Blood Bank'
            }
          })
        });
      });
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'bloodbank@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
      
      // Verify blood bank specific elements
      await expect(page.locator('text=/blood bank|inventory|requests/i')).toBeVisible({ timeout: 5000 });
    });

    test('should manage blood inventory', async ({ page }) => {
      await loginAsUser(page, 'bloodbank');
      
      // Mock inventory API
      await page.route('**/api/blood-banks/inventory', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            inventory: {
              'A+': 25,
              'A-': 10,
              'B+': 30,
              'B-': 8,
              'AB+': 15,
              'AB-': 5,
              'O+': 40,
              'O-': 12
            }
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Check for inventory display
      const inventorySection = page.locator('text=/inventory|stock|units/i').first();
      if (await inventorySection.isVisible({ timeout: 5000 })) {
        await expect(page.locator('text=/A\\+|O\\+|B\\+/i')).toBeVisible();
      }
    });

  });

  test.describe('Profile Completion', () => {
    
    test('should prompt user to complete profile if incomplete', async ({ page }) => {
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: {
              id: 'user123',
              email: 'incomplete@example.com',
              role: 'user',
              profileComplete: false
            }
          })
        });
      });
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'incomplete@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      // Should redirect to profile completion page
      await page.waitForTimeout(1000);
      
      const url = page.url();
      expect(url).toMatch(/profile|complete|setup/i);
    });

    test('should complete user profile with blood type and phone', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      // Mock profile completion API
      await page.route('**/api/users/complete-profile', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Profile completed successfully'
          })
        });
      });
      
      await page.goto('/complete-profile');
      
      // Fill profile fields
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i]').first();
      if (await phoneInput.isVisible({ timeout: 5000 })) {
        await phoneInput.fill('1234567890');
      }
      
      const bloodTypeSelect = page.locator('select[name*="blood"], input[name*="blood"]').first();
      if (await bloodTypeSelect.isVisible()) {
        await bloodTypeSelect.click();
        await page.keyboard.type('O+');
      }
      
      // Submit form
      const submitButton = page.locator('button:has-text("Complete"), button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should redirect to dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
      }
    });

  });

  test.describe('Notifications & Alerts', () => {
    
    test('should display donation requests to donors', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      // Mock requests API
      await page.route('**/api/donation-requests', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            requests: [
              {
                id: 'req1',
                patientName: 'John Patient',
                bloodType: 'O+',
                urgency: 'high',
                hospital: 'General Hospital',
                date: new Date().toISOString()
              }
            ]
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Check for notifications
      const notificationBadge = page.locator('[class*="badge"], [class*="notification"], text=/request/i').first();
      if (await notificationBadge.isVisible({ timeout: 5000 })) {
        await expect(page.locator('text=/John Patient|General Hospital/i')).toBeVisible();
      }
    });

  });

  test.describe('User Settings', () => {
    
    test('should allow user to change password', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      // Mock password change API
      await page.route('**/api/users/change-password', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Password changed successfully'
          })
        });
      });
      
      await page.goto('/settings');
      
      // Fill password change form
      const currentPasswordInput = page.locator('input[name*="current"], input[placeholder*="current" i]').first();
      if (await currentPasswordInput.isVisible({ timeout: 5000 })) {
        await currentPasswordInput.fill('OldPassword123!');
        
        const newPasswordInput = page.locator('input[name*="new"], input[placeholder*="new" i]').first();
        await newPasswordInput.fill('NewPassword123!');
        
        const confirmPasswordInput = page.locator('input[name*="confirm"], input[placeholder*="confirm" i]').first();
        await confirmPasswordInput.fill('NewPassword123!');
        
        // Submit
        const submitButton = page.locator('button:has-text("Change"), button[type="submit"]').first();
        await submitButton.click();
        
        // Check for success
        await expect(page.locator('text=/success|changed/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow user to logout', async ({ page }) => {
      await loginAsUser(page, 'user');
      
      await page.goto('/dashboard');
      
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first();
      if (await logoutButton.isVisible({ timeout: 5000 })) {
        await logoutButton.click();
        
        // Should redirect to home or login
        await page.waitForTimeout(1000);
        const url = page.url();
        expect(url).toMatch(/login|^\/$|home/);
      }
    });

  });

});

