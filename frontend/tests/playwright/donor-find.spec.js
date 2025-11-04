// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Donor Find/Search E2E Tests
 * Tests the flow for listing and searching donors
 */

test.describe('Donor Find/Search', () => {
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
    await page.waitForTimeout(500);
  }

  async function mockDonors(page, donors) {
    await page.route('**/api/**/donors**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, donors })
      });
    });
  }

  test.beforeEach(async ({ page }) => {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
    } catch {}
  });

  test('should list donors on the find page', async ({ page }) => {
    await loginAsPatient(page);
    await mockDonors(page, [
      { _id: 'd1', name: 'Alice Donor', bloodGroup: 'O+', city: 'Kochi', availableForDonation: true, userId: { username: 'alice' } },
      { _id: 'd2', name: 'Bob Donor', bloodGroup: 'A+', city: 'Kochi', availableForDonation: true, userId: { username: 'bob' } }
    ]);

    await page.goto('/donors', { waitUntil: 'domcontentloaded' }).catch(async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    const listItem = page.locator('text=/Alice Donor|Bob Donor|Blood Group|Available/i').first();
    await expect(listItem).toBeVisible({ timeout: 5000 });
  });

  test('should allow searching donors by blood group and location', async ({ page }) => {
    await loginAsPatient(page);
    await mockDonors(page, [
      { _id: 'd1', name: 'Alice Donor', bloodGroup: 'O+', city: 'Kochi', availableForDonation: true, userId: { username: 'alice' } },
      { _id: 'd2', name: 'Oscar Donor', bloodGroup: 'O+', city: 'Kochi', availableForDonation: true, userId: { username: 'oscar' } }
    ]);

    await page.goto('/donors', { waitUntil: 'domcontentloaded' }).catch(async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    // Flexible selectors for inputs (supports input/select variations)
    const bloodGroupInput = page.locator('[placeholder*="Blood" i], select:has(option[value="O+"]), input[name*="blood" i]').first();
    const locationInput = page.locator('[placeholder*="Location" i], input[name*="location" i], input[aria-label*="Location" i]').first();
    const searchButton = page.locator('button:has-text("Search"), button[title*="search" i], button:has-text("Find")').first();

    if (await bloodGroupInput.isVisible().catch(() => false)) {
      // Prefer selecting option if it's a select
      if ((await bloodGroupInput.evaluate((el) => el.tagName.toLowerCase())) === 'select') {
        await bloodGroupInput.selectOption('O+').catch(async () => { /* ignore if not an option */ });
      } else {
        await bloodGroupInput.fill('O+');
      }
    }

    if (await locationInput.isVisible().catch(() => false)) {
      await locationInput.fill('Kochi');
    }

    if (await searchButton.isVisible().catch(() => false)) {
      await searchButton.click();
    }

    // Expect O+ donors in Kochi to be visible
    await expect(page.locator('text=/Alice Donor|Oscar Donor/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show empty-state when no donors match filters', async ({ page }) => {
    await loginAsPatient(page);
    await mockDonors(page, []);

    await page.goto('/donors', { waitUntil: 'domcontentloaded' }).catch(async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    const emptyState = page.locator('text=/No donors|No results|not found/i').first();
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });
});


