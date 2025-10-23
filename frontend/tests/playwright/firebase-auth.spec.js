// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Firebase Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Firebase Login Button', () => {
    test('should display Firebase login button with Google icon', async ({ page }) => {
      await page.goto('/login');
      
      // Check if Firebase login button is present
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await expect(firebaseButton).toBeVisible();
      
      // Check if Google icon is present in the button
      const googleIcon = firebaseButton.locator('svg');
      await expect(googleIcon).toBeVisible();
      
      // Check if button has proper styling
      await expect(firebaseButton).toHaveClass(/bg-white/);
    });

    test('should show loading state when Firebase login is clicked', async ({ page }) => {
      await page.goto('/login');
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      
      // Mock Firebase auth to simulate loading
      await page.route('**/auth/firebase', route => {
        // Don't fulfill immediately to test loading state
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                user: { id: '1', role: 'user', username: 'testuser' },
                accessToken: 'mock-token',
                refreshToken: 'mock-refresh-token'
              }
            })
          });
        }, 1000);
      });
      
      // Click Firebase login button
      await firebaseButton.click();
      
      // Check if loading state is shown
      await expect(page.locator('text=Redirecting to Google...')).toBeVisible();
      await expect(firebaseButton).toBeDisabled();
    });

    test('should handle Firebase authentication success', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful Firebase authentication
      await page.route('**/auth/firebase', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { 
                id: '1', 
                role: 'user', 
                username: 'testuser',
                isSuspended: false,
                isBlocked: false
              },
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          })
        });
      });
      
      // Mock Firebase popup authentication
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            signInWithPopup: () => Promise.resolve({
              user: {
                getIdToken: () => Promise.resolve('mock-firebase-token')
              }
            })
          })
        };
      });
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await firebaseButton.click();
      
      // Should navigate to dashboard after successful authentication
      await expect(page).toHaveURL('/dashboard');
      
      // Check if user data is stored in localStorage
      const userId = await page.evaluate(() => localStorage.getItem('userId'));
      const role = await page.evaluate(() => localStorage.getItem('role'));
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      
      expect(userId).toBe('1');
      expect(role).toBe('user');
      expect(accessToken).toBe('mock-access-token');
    });

    test('should handle Firebase authentication failure', async ({ page }) => {
      await page.goto('/login');
      
      // Mock failed Firebase authentication
      await page.route('**/auth/firebase', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Firebase authentication failed'
          })
        });
      });
      
      // Mock Firebase popup authentication failure
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            signInWithPopup: () => Promise.reject(new Error('Firebase auth failed'))
          })
        };
      });
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await firebaseButton.click();
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Failed to sign in with Google');
        await dialog.accept();
      });
      
      // Should stay on login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should handle user cancellation of Firebase auth', async ({ page }) => {
      await page.goto('/login');
      
      // Mock user cancellation
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            signInWithPopup: () => Promise.reject({ code: 'auth/user-cancelled' })
          })
        };
      });
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await firebaseButton.click();
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Sign-in was cancelled');
        await dialog.accept();
      });
      
      // Should stay on login page
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Firebase Forgot Password', () => {
    test('should send password reset email successfully', async ({ page }) => {
      await page.goto('/login');
      
      // Click forgot password button
      await page.click('button:has-text("Forgot your password?")');
      
      // Fill in email
      await page.fill('input[placeholder*="password reset"]', 'test@example.com');
      
      // Mock successful password reset
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            sendPasswordResetEmail: () => Promise.resolve()
          })
        };
      });
      
      // Click send reset email button
      await page.click('button:has-text("Send Reset Email")');
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Password reset email sent!');
        await dialog.accept();
      });
      
      // Reset form should be hidden after successful send
      await expect(page.locator('input[placeholder*="password reset"]')).not.toBeVisible();
    });

    test('should show error for invalid email in password reset', async ({ page }) => {
      await page.goto('/login');
      
      // Click forgot password button
      await page.click('button:has-text("Forgot your password?")');
      
      // Fill in invalid email
      await page.fill('input[placeholder*="password reset"]', 'invalid-email');
      
      // Mock failed password reset
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            sendPasswordResetEmail: () => Promise.reject(new Error('Invalid email'))
          })
        };
      });
      
      // Click send reset email button
      await page.click('button:has-text("Send Reset Email")');
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Invalid email');
        await dialog.accept();
      });
    });

    test('should show error for empty email in password reset', async ({ page }) => {
      await page.goto('/login');
      
      // Click forgot password button
      await page.click('button:has-text("Forgot your password?")');
      
      // Try to send reset email without filling email
      await page.click('button:has-text("Send Reset Email")');
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Please enter your email');
        await dialog.accept();
      });
    });
  });

  test.describe('Firebase User Role Navigation', () => {
    test('should navigate to admin dashboard for admin users', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful Firebase authentication for admin
      await page.route('**/auth/firebase', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { 
                id: '1', 
                role: 'admin', 
                username: 'admin',
                isSuspended: false,
                isBlocked: false
              },
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          })
        });
      });
      
      // Mock Firebase popup authentication
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            signInWithPopup: () => Promise.resolve({
              user: {
                getIdToken: () => Promise.resolve('mock-firebase-token')
              }
            })
          })
        };
      });
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await firebaseButton.click();
      
      // Should navigate to admin dashboard
      await expect(page).toHaveURL('/admin-dashboard');
    });

    test('should navigate to blood bank dashboard for blood bank users', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful Firebase authentication for blood bank
      await page.route('**/auth/firebase', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { 
                id: '1', 
                role: 'bloodbank', 
                username: 'bloodbank',
                isSuspended: false,
                isBlocked: false
              },
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          })
        });
      });
      
      // Mock Firebase popup authentication
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            signInWithPopup: () => Promise.resolve({
              user: {
                getIdToken: () => Promise.resolve('mock-firebase-token')
              }
            })
          })
        };
      });
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await firebaseButton.click();
      
      // Should navigate to blood bank dashboard
      await expect(page).toHaveURL('/bloodbank/dashboard');
    });

    test('should handle suspended user authentication', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful Firebase authentication for suspended user
      await page.route('**/auth/firebase', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { 
                id: '1', 
                role: 'user', 
                username: 'suspendeduser',
                isSuspended: true,
                isBlocked: false
              },
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          })
        });
      });
      
      // Mock Firebase popup authentication
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            signInWithPopup: () => Promise.resolve({
              user: {
                getIdToken: () => Promise.resolve('mock-firebase-token')
              }
            })
          })
        };
      });
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await firebaseButton.click();
      
      // Wait for suspension alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Your account is suspended');
        await dialog.accept();
      });
      
      // Should navigate to dashboard but with suspension warning
      await expect(page).toHaveURL('/dashboard');
      
      // Check if suspension status is stored
      const isSuspended = await page.evaluate(() => localStorage.getItem('isSuspended'));
      expect(isSuspended).toBe('true');
    });

    test('should handle blocked user authentication', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful Firebase authentication for blocked user
      await page.route('**/auth/firebase', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { 
                id: '1', 
                role: 'user', 
                username: 'blockeduser',
                isSuspended: false,
                isBlocked: true
              },
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          })
        });
      });
      
      // Mock Firebase popup authentication
      await page.addInitScript(() => {
        window.firebase = {
          auth: () => ({
            signInWithPopup: () => Promise.resolve({
              user: {
                getIdToken: () => Promise.resolve('mock-firebase-token')
              }
            })
          })
        };
      });
      
      const firebaseButton = page.locator('button:has-text("Continue with Firebase")');
      await firebaseButton.click();
      
      // Wait for blocked user alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Your account is blocked');
        await dialog.accept();
      });
      
      // Should redirect back to login page
      await expect(page).toHaveURL('/login');
    });
  });
});
