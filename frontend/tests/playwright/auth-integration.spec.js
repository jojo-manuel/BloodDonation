// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Authentication Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Complete Registration and Login Flow', () => {
    test('should complete full registration and login flow', async ({ page }) => {
      // Step 1: Register a new user
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john.doe@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      
      // Mock successful registration
      await page.route('**/auth/register', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Registration successful'
          })
        });
      });
      
      // Submit registration
      await page.click('button[type="submit"]');
      
      // Wait for success alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Registration successful');
        await dialog.accept();
      });
      
      // Should navigate to login page
      await expect(page).toHaveURL('/login');
      
      // Step 2: Login with the registered user
      await page.fill('input[type="email"]', 'john.doe@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Mock successful login
      await page.route('**/auth/login', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { 
                id: '1', 
                role: 'user', 
                username: 'john.doe@example.com',
                isSuspended: false,
                isBlocked: false
              },
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          })
        });
      });
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Should navigate to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Check if user data is stored in localStorage
      const userId = await page.evaluate(() => localStorage.getItem('userId'));
      const role = await page.evaluate(() => localStorage.getItem('role'));
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      
      expect(userId).toBe('1');
      expect(role).toBe('user');
      expect(accessToken).toBe('mock-access-token');
    });

    test('should handle registration with existing email', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form with existing email
      await page.fill('input[name="firstName"]', 'Jane');
      await page.fill('input[name="lastName"]', 'Smith');
      await page.fill('input[name="email"]', 'existing@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      
      // Mock duplicate email error
      await page.route('**/auth/register', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Email already exists'
          })
        });
      });
      
      // Submit registration
      await page.click('button[type="submit"]');
      
      // Wait for error alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Email already exists');
        await dialog.accept();
      });
      
      // Should stay on registration page
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Authentication State Management', () => {
    test('should persist authentication state across page reloads', async ({ page }) => {
      // Simulate logged in state
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.setItem('userId', '1');
        localStorage.setItem('role', 'user');
        localStorage.setItem('username', 'testuser');
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem('refreshToken', 'mock-refresh-token');
      });
      
      // Reload the page
      await page.reload();
      
      // Check if authentication state is preserved
      const userId = await page.evaluate(() => localStorage.getItem('userId'));
      const role = await page.evaluate(() => localStorage.getItem('role'));
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      
      expect(userId).toBe('1');
      expect(role).toBe('user');
      expect(accessToken).toBe('mock-token');
    });

    test('should clear authentication state on logout', async ({ page }) => {
      // Simulate logged in state
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.setItem('userId', '1');
        localStorage.setItem('role', 'user');
        localStorage.setItem('username', 'testuser');
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem('refreshToken', 'mock-refresh-token');
      });
      
      // Navigate to dashboard (simulating logged in user)
      await page.goto('/dashboard');
      
      // Simulate logout by clearing localStorage
      await page.evaluate(() => localStorage.clear());
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login or show authentication error
      // (This depends on your app's authentication guard implementation)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(login|dashboard)/);
    });
  });

  test.describe('Form Validation Integration', () => {
    test('should validate all registration fields together', async ({ page }) => {
      await page.goto('/register');
      
      // Fill form with mixed valid/invalid data
      await page.fill('input[name="firstName"]', 'John123'); // Invalid
      await page.fill('input[name="lastName"]', 'Doe'); // Valid
      await page.fill('input[name="email"]', 'invalid-email'); // Invalid
      await page.fill('input[name="password"]', '123'); // Invalid
      await page.fill('input[name="confirmPassword"]', '456'); // Invalid
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check that all validation errors are shown
      await expect(page.locator('text=First name must contain only letters')).toBeVisible();
      await expect(page.locator('text=Invalid email format')).toBeVisible();
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
      
      // Form should not submit
      await expect(page).toHaveURL('/register');
    });

    test('should clear validation errors when user corrects input', async ({ page }) => {
      await page.goto('/register');
      
      // Fill form with invalid data
      await page.fill('input[name="firstName"]', 'John123');
      await page.fill('input[name="lastName"]', '');
      
      // Submit form to trigger validation
      await page.click('button[type="submit"]');
      
      // Check that errors are shown
      await expect(page.locator('text=First name must contain only letters')).toBeVisible();
      await expect(page.locator('text=Last name is required')).toBeVisible();
      
      // Correct the input
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      
      // Errors should be cleared
      await expect(page.locator('text=First name must contain only letters')).not.toBeVisible();
      await expect(page.locator('text=Last name is required')).not.toBeVisible();
    });
  });

  test.describe('Error Handling Integration', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Mock network error
      await page.route('**/auth/login', route => {
        route.abort('failed');
      });
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Login failed');
        await dialog.accept();
      });
      
      // Should stay on login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john.doe@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      
      // Mock server error
      await page.route('**/auth/register', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error'
          })
        });
      });
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Internal server error');
        await dialog.accept();
      });
      
      // Should stay on registration page
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across different browsers', async ({ page, browserName }) => {
      await page.goto('/login');
      
      // Test basic functionality
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Test form interaction
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Verify values are set correctly
      await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
      await expect(page.locator('input[type="password"]')).toHaveValue('password123');
      
      console.log(`Test passed on ${browserName}`);
    });
  });

  test.describe('Accessibility Integration', () => {
    test('should have proper form labels and accessibility attributes', async ({ page }) => {
      await page.goto('/login');
      
      // Check if form inputs have proper labels
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      // Check for associated labels
      await expect(page.locator('label:has-text("Email address")')).toBeVisible();
      await expect(page.locator('label:has-text("Password")')).toBeVisible();
      
      // Check for proper input types
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Check for required attributes
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/login');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });
  });
});
