// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Donor Request E2E Tests
 * Tests the flow where a patient sends a donation request to a donor
 */

test.describe('Donor Request Tests', () => {
  // Helper: login as patient using localStorage to align with existing tests
  async function loginAsPatient(page) {
    await page.evaluate(() => {
      localStorage.setItem('userId', 'patient123');
      localStorage.setItem('role', 'user');
      localStorage.setItem('username', 'testpatient');
      localStorage.setItem('accessToken', 'mock-access-token-patient');
      localStorage.setItem('refreshToken', 'mock-refresh-token-patient');
      localStorage.setItem('isSuspended', 'false');
      localStorage.setItem('isBlocked', 'false');
    });

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
  }

  // Helper: mock donors search/list API
  async function setupMockDonors(page) {
    await page.route('**/api/**/donors**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          donors: [
            {
              _id: 'donorA',
              name: 'Alice Donor',
              bloodGroup: 'O+',
              userId: { username: 'alice', phone: '111-222-3333' },
              city: 'Kochi',
              availableForDonation: true
            },
            {
              _id: 'donorB',
              name: 'Bob Donor',
              bloodGroup: 'A+',
              userId: { username: 'bob', phone: '444-555-6666' },
              city: 'Kochi',
              availableForDonation: true
            }
          ]
        })
      });
    });
  }

  test.beforeEach(async ({ page }) => {
    // Establish origin then clear storage (mirrors pattern in other specs)
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch { /* ignore */ }
      });
    } catch { /* ignore */ }
  });

  test('should display donors and show Request button', async ({ page }) => {
    await loginAsPatient(page);
    await setupMockDonors(page);

    // Navigate to donor search/list page (fallback to dashboard if unified)
    await page.goto('/donors', { waitUntil: 'domcontentloaded' }).catch(async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    await page.waitForTimeout(500);

    const donorCard = page.locator('text=/Donor|Blood Group|Available|Alice Donor|Bob Donor/i').first();
    await expect(donorCard).toBeVisible({ timeout: 5000 });

    const requestButton = page.locator(
      'button:has-text("Request"), button[title*="Request" i], button:has-text("Send Request")'
    ).first();
    await expect(requestButton).toBeVisible({ timeout: 5000 });
  });

  test('should successfully send a request to a donor', async ({ page }) => {
    await loginAsPatient(page);
    await setupMockDonors(page);

    // Mock request send API success (broad pattern to tolerate endpoint variations)
    await page.route('**/api/**/request**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Request sent successfully', requestId: 'req123' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/donors', { waitUntil: 'domcontentloaded' }).catch(async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    // Choose a donor (first card) and click Request
    const firstRequestBtn = page
      .locator('button:has-text("Request"), button[title*="Request" i], button:has-text("Send Request")')
      .first();

    await firstRequestBtn.waitFor({ state: 'visible', timeout: 5000 });
    await firstRequestBtn.click();

    // If a modal or confirmation appears, confirm action if present
    const confirmBtn = page.locator(
      'button:has-text("Confirm"), button:has-text("Send"), button:has-text("Yes"), button[title*="confirm" i]'
    ).first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }

    // Validate success feedback (toast/alert/label)
    const successText = page.locator('text=/Request sent|success|Successfully/i').first();
    await expect(successText).toBeVisible({ timeout: 5000 });
  });

  test('should handle API error when sending request', async ({ page }) => {
    await loginAsPatient(page);
    await setupMockDonors(page);

    // Mock error response
    await page.route('**/api/**/request**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unable to send request' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/donors', { waitUntil: 'domcontentloaded' }).catch(async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    const firstRequestBtn = page
      .locator('button:has-text("Request"), button[title*="Request" i], button:has-text("Send Request")')
      .first();

    await firstRequestBtn.waitFor({ state: 'visible', timeout: 5000 });
    await firstRequestBtn.click();

    const confirmBtn = page.locator(
      'button:has-text("Confirm"), button:has-text("Send"), button:has-text("Yes"), button[title*="confirm" i]'
    ).first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }

    // Expect an error indication
    const errorText = page.locator('text=/Unable to send|Failed|Error/i').first();
    await expect(errorText).toBeVisible({ timeout: 5000 });
  });
});


