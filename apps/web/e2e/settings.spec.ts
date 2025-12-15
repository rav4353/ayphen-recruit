import { test, expect } from '@playwright/test';

// Settings tests - storageState is provided by playwright.config.ts project setup
test.describe('Settings', () => {
  // Helper to get tenantId from dashboard redirect
  const getTenantUrl = async (page: any, path: string) => {
    // First go to root which redirects to /:tenantId/dashboard
    await page.goto('/');
    await page.waitForURL(/.*\/dashboard/);
    const url = new URL(page.url());
    const tenantId = url.pathname.split('/')[1];
    return `/${tenantId}${path}`;
  };

  test('should display settings page', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings');
    await page.goto(settingsUrl);
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should navigate between settings tabs', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings');
    await page.goto(settingsUrl);
    
    // Navigate to Security tab
    await page.getByRole('button', { name: /security/i }).click();
    await expect(page).toHaveURL(/.*tab=security/);

    // Navigate to Notifications tab
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page).toHaveURL(/.*tab=notifications/);
  });

  test('should search settings', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings');
    await page.goto(settingsUrl);
    const searchInput = page.getByPlaceholder(/search.*settings/i);
    await searchInput.fill('email');
    await page.waitForTimeout(300);
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test('should access keyboard shortcuts tab', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings?tab=shortcuts');
    await page.goto(settingsUrl);
    await expect(page.getByText(/keyboard.*shortcuts/i)).toBeVisible();
  });

  test('should access bulk import tab', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings?tab=import');
    await page.goto(settingsUrl);
    await expect(page.getByText(/bulk.*import|import/i)).toBeVisible();
  });

  test('should access audit logs tab', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings?tab=audit');
    await page.goto(settingsUrl);
    await expect(page.getByText(/audit.*log|activity/i)).toBeVisible();
  });

  test('should access background checks tab', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings?tab=bgv');
    await page.goto(settingsUrl);
    await expect(page.getByText(/background.*check/i)).toBeVisible();
  });

  test('should persist tab selection on page reload', async ({ page }) => {
    const settingsUrl = await getTenantUrl(page, '/settings?tab=security');
    await page.goto(settingsUrl);
    await expect(page).toHaveURL(/.*tab=security/);
    
    // Reload the page
    await page.reload();
    
    // Tab should still be security
    await expect(page).toHaveURL(/.*tab=security/);
  });
});
