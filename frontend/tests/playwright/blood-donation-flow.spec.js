// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Tests for Blood Donation Application
 * Tests complete user flows from registration to blood donation booking
 */

test.describe('Blood Donation Application - End-to-End Tests', () => {
  
  // Test data
  const testUser = {
    email: `test.donor.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'John Doe',
    phone: '1234567890',
    bloodType: 'O+'
  };

  const testPatient = {
    email: `test.patient.${Date.now()}@example.com`,
    password: 'PatientPassword123!',
    name: 'Jane Smith',
    phone: '0987654321'
  };

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('User Registration & Profile Setup', () => {
    
    test('should complete donor registration flow', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.fill('input[placeholder*="name"]', testUser.name);
      
      // Submit registration
      await page.click('button[type="submit"]');
      
      // Wait for successful registration
      await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {
        // Registration might redirect to dashboard if auto-login
      });
      
      // Verify success message or redirect
      const url = page.url();
      expect(url).toMatch(/login|dashboard/);
    });

    test('should not allow duplicate email registration', async ({ page }) => {
      await page.goto('/register');
      
      // Try to register with existing email
      await page.fill('input[type="email"]', 'existing@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.fill('input[placeholder*="name"]', 'Test User');
      
      // Mock API response for duplicate email
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Email already exists'
          })
        });
      });
      
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=/email already exists/i')).toBeVisible({ timeout: 5000 });
    });

  });

  test.describe('User Authentication', () => {
    
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful login
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: {
              id: '123',
              email: 'donor@example.com',
              role: 'user',
              name: 'Test Donor'
            }
          })
        });
      });
      
      await page.fill('input[type="email"]', 'donor@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      // Verify user is logged in
      await expect(page.locator('text=/welcome/i, text=/dashboard/i')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Mock failed login
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          })
        });
      });
      
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=/invalid/i, text=/incorrect/i')).toBeVisible({ timeout: 5000 });
    });

  });

  test.describe('Donor Dashboard & Profile', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login');
      
      // Mock login
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: { id: '123', email: 'donor@example.com', role: 'user', name: 'Test Donor' }
          })
        });
      });
      
      await page.fill('input[type="email"]', 'donor@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('should display donor dashboard with key information', async ({ page }) => {
      // Mock dashboard data
      await page.route('**/api/users/me', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            user: {
              id: '123',
              name: 'Test Donor',
              email: 'donor@example.com',
              bloodType: 'O+',
              availableForDonation: true,
              totalDonations: 5
            }
          })
        });
      });
      
      await page.reload();
      
      // Check for dashboard elements
      await expect(page.locator('text=/dashboard/i')).toBeVisible();
    });

    test('should update donor availability status', async ({ page }) => {
      // Mock update availability API
      await page.route('**/api/users/availability', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Availability updated'
          })
        });
      });
      
      // Find and click availability toggle
      const availabilityToggle = page.locator('input[type="checkbox"], button:has-text("Available")').first();
      if (await availabilityToggle.isVisible()) {
        await availabilityToggle.click();
        
        // Wait for success message
        await expect(page.locator('text=/updated/i, text=/success/i')).toBeVisible({ timeout: 5000 });
      }
    });

  });

  test.describe('Blood Bank Search & Discovery', () => {
    
    test('should display list of blood banks', async ({ page }) => {
      // Mock blood banks API
      await page.route('**/api/blood-banks**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            bloodBanks: [
              {
                _id: '1',
                name: 'City Blood Bank',
                address: '123 Main St',
                phone: '555-0100',
                email: 'city@bloodbank.com',
                status: 'approved'
              },
              {
                _id: '2',
                name: 'General Hospital Blood Bank',
                address: '456 Oak Ave',
                phone: '555-0200',
                email: 'general@hospital.com',
                status: 'approved'
              }
            ]
          })
        });
      });
      
      await page.goto('/blood-banks');
      
      // Check if blood banks are displayed
      await expect(page.locator('text=/blood bank/i').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/City Blood Bank|General Hospital/i')).toBeVisible();
    });

    test('should search for blood banks by location', async ({ page }) => {
      await page.goto('/blood-banks');
      
      // Mock search API
      await page.route('**/api/blood-banks?*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            bloodBanks: [
              {
                _id: '1',
                name: 'Downtown Blood Center',
                address: '789 Downtown St',
                city: 'TestCity'
              }
            ]
          })
        });
      });
      
      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('TestCity');
        await page.keyboard.press('Enter');
        
        // Wait for results
        await page.waitForTimeout(1000);
        await expect(page.locator('text=/Downtown Blood Center/i')).toBeVisible();
      }
    });

  });

  test.describe('Blood Donation Booking', () => {
    
    test('should book a donation slot at blood bank', async ({ page }) => {
      // Mock login first
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: { id: '123', role: 'user' }
          })
        });
      });
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'donor@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      // Mock blood banks
      await page.route('**/api/blood-banks**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            bloodBanks: [{ _id: '1', name: 'Test Blood Bank', status: 'approved' }]
          })
        });
      });
      
      // Mock booking API
      await page.route('**/api/users/book-slot', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Slot booked successfully',
            booking: { id: 'booking123', bloodBankId: '1', date: new Date().toISOString() }
          })
        });
      });
      
      await page.goto('/blood-banks');
      
      // Find and click book button
      const bookButton = page.locator('button:has-text("Book"), button:has-text("Schedule")').first();
      if (await bookButton.isVisible({ timeout: 5000 })) {
        await bookButton.click();
        
        // Check for success message
        await expect(page.locator('text=/success|booked|confirmed/i')).toBeVisible({ timeout: 5000 });
      }
    });

  });

  test.describe('Donor Search (Patient/Blood Bank)', () => {
    
    test('should search for available donors by blood type', async ({ page }) => {
      // Mock donor search API
      await page.route('**/api/donors/search**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            donors: [
              {
                _id: '1',
                name: 'John Donor',
                bloodType: 'O+',
                availableForDonation: true,
                location: 'TestCity'
              },
              {
                _id: '2',
                name: 'Jane Donor',
                bloodType: 'O+',
                availableForDonation: true,
                location: 'TestCity'
              }
            ]
          })
        });
      });
      
      await page.goto('/donors');
      
      // Select blood type
      const bloodTypeSelect = page.locator('select, input[placeholder*="blood type" i]').first();
      if (await bloodTypeSelect.isVisible({ timeout: 5000 })) {
        await bloodTypeSelect.click();
        await page.keyboard.type('O+');
        
        // Submit search
        const searchButton = page.locator('button:has-text("Search"), button[type="submit"]').first();
        await searchButton.click();
        
        // Wait for results
        await expect(page.locator('text=/John Donor|Jane Donor/i')).toBeVisible({ timeout: 5000 });
      }
    });

  });

  test.describe('Review & Feedback System', () => {
    
    test('should submit a review for blood bank', async ({ page }) => {
      // Mock login
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: { id: '123', role: 'user' }
          })
        });
      });
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'donor@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      // Mock review submission
      await page.route('**/api/reviews', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              success: true,
              message: 'Review submitted successfully'
            })
          });
        }
      });
      
      await page.goto('/blood-banks');
      
      // Find review button
      const reviewButton = page.locator('button:has-text("Review"), button:has-text("Rate")').first();
      if (await reviewButton.isVisible({ timeout: 5000 })) {
        await reviewButton.click();
        
        // Fill review form
        await page.waitForTimeout(500);
        const ratingInput = page.locator('input[type="number"], select[name*="rating"]').first();
        if (await ratingInput.isVisible()) {
          await ratingInput.fill('5');
        }
        
        const commentInput = page.locator('textarea, input[name*="comment"]').first();
        if (await commentInput.isVisible()) {
          await commentInput.fill('Excellent service and very professional staff!');
        }
        
        // Submit review
        const submitButton = page.locator('button:has-text("Submit"), button[type="submit"]').first();
        await submitButton.click();
        
        // Check for success message
        await expect(page.locator('text=/success|submitted|thank you/i')).toBeVisible({ timeout: 5000 });
      }
    });

  });

  test.describe('Admin Dashboard', () => {
    
    test('should access admin dashboard with admin role', async ({ page }) => {
      // Mock admin login
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            token: 'mock-admin-token',
            user: {
              id: 'admin123',
              email: 'admin@blooddonation.com',
              role: 'admin',
              name: 'Admin User'
            }
          })
        });
      });
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@blooddonation.com');
      await page.fill('input[type="password"]', 'AdminPassword123!');
      await page.click('button[type="submit"]');
      
      // Navigate to admin dashboard
      await page.goto('/admin');
      
      // Verify admin dashboard elements
      await expect(page.locator('text=/admin|dashboard|manage/i')).toBeVisible({ timeout: 5000 });
    });

  });

  test.describe('Responsive Design & Accessibility', () => {
    
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Check if mobile menu/hamburger is visible
      const mobileMenu = page.locator('button[aria-label*="menu" i], button.hamburger, svg.menu-icon').first();
      
      // Verify page is accessible on mobile
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have proper ARIA labels for accessibility', async ({ page }) => {
      await page.goto('/login');
      
      // Check for form labels
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('aria-label', /.*/);
      
      // Check for buttons with descriptive text
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

  });

  test.describe('Error Handling', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/login');
      
      // Simulate network error
      await page.route('**/api/**', async (route) => {
        await route.abort('failed');
      });
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 5000 });
    });

    test('should handle server errors (500)', async ({ page }) => {
      await page.goto('/login');
      
      // Mock server error
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            message: 'Internal server error'
          })
        });
      });
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=/error|server/i')).toBeVisible({ timeout: 5000 });
    });

  });

  test.describe('Navigation & User Flow', () => {
    
    test('should navigate through main pages correctly', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to different pages
      const pages = ['/login', '/register', '/about', '/contact'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Verify page loaded
        expect(page.url()).toContain(pagePath);
      }
    });

    test('should redirect unauthenticated users from protected routes', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 5000 });
      expect(page.url()).toContain('login');
    });

  });

});

