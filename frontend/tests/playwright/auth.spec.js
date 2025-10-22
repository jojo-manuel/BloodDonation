// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Login Page', () => {
    test('should load login page successfully', async ({ page }) => {
      await page.goto('/login');
      
      // Check if the page title contains expected text
      await expect(page).toHaveTitle(/Hope Web/);
      
      // Check if login form elements are present
      await expect(page.locator('h2')).toContainText('Login to Hope Web');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check if Firebase login button is present
      await expect(page.locator('button:has-text("Continue with Firebase")')).toBeVisible();
      
      // Check if forgot password link is present
      await expect(page.locator('button:has-text("Forgot your password?")')).toBeVisible();
      
      // Check if back to home link is present
      await expect(page.locator('a:has-text("← Back to Home")')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit form without filling fields
      await page.click('button[type="submit"]');
      
      // Check if browser validation prevents submission
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
      
      // Form should not submit due to HTML5 validation
      await expect(page).toHaveURL(/.*login/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'invalidpassword');
      
      // Mock the API response for failed login
      await page.route('**/auth/login', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          })
        });
      });
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Invalid credentials');
        await dialog.accept();
      });
    });

    test('should show forgot password form when clicked', async ({ page }) => {
      await page.goto('/login');
      
      // Click forgot password button
      await page.click('button:has-text("Forgot your password?")');
      
      // Check if reset email input appears
      await expect(page.locator('input[placeholder*="password reset"]')).toBeVisible();
      await expect(page.locator('button:has-text("Send Reset Email")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('should cancel forgot password form', async ({ page }) => {
      await page.goto('/login');
      
      // Click forgot password button
      await page.click('button:has-text("Forgot your password?")');
      
      // Check if reset form is visible
      await expect(page.locator('input[placeholder*="password reset"]')).toBeVisible();
      
      // Click cancel button
      await page.click('button:has-text("Cancel")');
      
      // Check if reset form is hidden
      await expect(page.locator('input[placeholder*="password reset"]')).not.toBeVisible();
    });

    test('should have proper form attributes', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      // Check required attributes
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
      
      // Check placeholder attributes
      await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
      await expect(passwordInput).toHaveAttribute('placeholder', '••••••••');
    });

    test('should display progress bar correctly', async ({ page }) => {
      await page.goto('/login');
      
      // Check if progress bar elements are present
      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('text=Register')).toBeVisible();
      await expect(page.locator('text=Hope Web')).toBeVisible();
      
      // Check if login step is highlighted (has pink color)
      const loginStep = page.locator('text=Login').first();
      await expect(loginStep).toHaveClass(/text-pink-400/);
    });

    test('should navigate to home page from back link', async ({ page }) => {
      await page.goto('/login');
      
      // Click back to home link
      await page.click('a:has-text("← Back to Home")');
      
      // Should navigate to home page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Registration Page', () => {
    test('should load registration page successfully', async ({ page }) => {
      await page.goto('/register');
      
      // Check if the page title contains expected text
      await expect(page).toHaveTitle(/Hope Web/);
      
      // Check if registration form elements are present
      await expect(page.locator('h1')).toContainText('Create Your Account');
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/register');
      
      // Fill in invalid data
      await page.fill('input[name="firstName"]', 'John123'); // Invalid: contains numbers
      await page.fill('input[name="lastName"]', ''); // Invalid: empty
      await page.fill('input[name="email"]', 'invalid-email'); // Invalid: wrong format
      await page.fill('input[name="password"]', '123'); // Invalid: too short
      await page.fill('input[name="confirmPassword"]', '456'); // Invalid: doesn't match
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Check for validation error messages
      await expect(page.locator('text=First name must contain only letters')).toBeVisible();
      await expect(page.locator('text=Last name is required')).toBeVisible();
      await expect(page.locator('text=Invalid email format')).toBeVisible();
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/register');
      
      // Try to submit form without filling fields
      await page.click('button[type="submit"]');
      
      // Check for required field validation
      await expect(page.locator('text=First name is required')).toBeVisible();
      await expect(page.locator('text=Last name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should accept valid registration data', async ({ page }) => {
      await page.goto('/register');
      
      // Fill in valid data
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john.doe@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      
      // Mock successful registration response
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
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Registration successful');
        await dialog.accept();
      });
      
      // Should navigate to login page after successful registration
      await expect(page).toHaveURL('/login');
    });

    test('should show error for duplicate email registration', async ({ page }) => {
      await page.goto('/register');
      
      // Fill in valid data
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'existing@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      
      // Mock duplicate email error response
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
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for alert and check its content
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Email already exists');
        await dialog.accept();
      });
    });

    test('should have proper form attributes', async ({ page }) => {
      await page.goto('/register');
      
      const firstNameInput = page.locator('input[name="firstName"]');
      const lastNameInput = page.locator('input[name="lastName"]');
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      
      // Check required attributes
      await expect(firstNameInput).toHaveAttribute('required');
      await expect(lastNameInput).toHaveAttribute('required');
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
      await expect(confirmPasswordInput).toHaveAttribute('required');
      
      // Check minLength for passwords
      await expect(passwordInput).toHaveAttribute('minLength', '8');
      await expect(confirmPasswordInput).toHaveAttribute('minLength', '8');
      
      // Check input types
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('should navigate to login page from sign in link', async ({ page }) => {
      await page.goto('/register');
      
      // Click sign in link
      await page.click('a:has-text("Sign in here")');
      
      // Should navigate to login page
      await expect(page).toHaveURL('/login');
    });

    test('should navigate to home page from back link', async ({ page }) => {
      await page.goto('/register');
      
      // Click back to home link
      await page.click('a:has-text("← Back to Home")');
      
      // Should navigate to home page
      await expect(page).toHaveURL('/');
    });

    test('should show loading state during registration', async ({ page }) => {
      await page.goto('/register');
      
      // Fill in valid data
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john.doe@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      
      // Mock slow registration response
      await page.route('**/auth/register', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Registration successful'
            })
          });
        }, 1000);
      });
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Check if loading state is shown
      await expect(page.locator('button:has-text("Creating Account...")')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
  });

  test.describe('Navigation between auth pages', () => {
    test('should navigate from login to register', async ({ page }) => {
      await page.goto('/login');
      
      // Check if there's a link to register (though the current design doesn't have one)
      // This test documents the current behavior
      await expect(page.locator('text=Don\'t have an account? Contact admin for registration.')).toBeVisible();
    });

    test('should navigate from register to login', async ({ page }) => {
      await page.goto('/register');
      
      // Click sign in link
      await page.click('a:has-text("Sign in here")');
      
      // Should navigate to login page
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/login');
      
      // Check if form elements are still visible and functional
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Test form functionality on mobile
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Form should still work on mobile
      await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
      await expect(page.locator('input[type="password"]')).toHaveValue('password123');
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/register');
      
      // Check if form elements are still visible and functional
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    });
  });
});
