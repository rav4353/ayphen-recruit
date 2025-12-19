import { test, expect } from '@playwright/test';

test.describe('Super Admin Portal', () => {
  test.describe('Authentication', () => {
    test('should display super admin login page', async ({ page }) => {
      await page.goto('/super-admin/login');
      await expect(page).toHaveURL(/.*super-admin\/login/);
      await expect(page.getByRole('heading', { name: /super.*admin|command.*center/i })).toBeVisible();
    });

    test('should show validation errors for empty credentials', async ({ page }) => {
      await page.goto('/super-admin/login');
      await page.getByRole('button', { name: /sign in|login|access/i }).click();
      await expect(page.getByText(/required|please enter|invalid/i)).toBeVisible();
    });

    test('should show error for invalid super admin credentials', async ({ page }) => {
      await page.goto('/super-admin/login');
      await page.locator('input[type="email"]').fill('invalid@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|login|access/i }).click();
      await expect(page.getByText(/invalid|incorrect|failed|unauthorized/i)).toBeVisible();
    });
  });
});

test.describe('Super Admin Dashboard', () => {
  // These tests require authenticated super admin session
  // Skip if no auth state available
  test.skip(({ browserName }) => true, 'Requires super admin authentication setup');

  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/.*super-admin\/dashboard/);
    // Check for key dashboard elements
    await expect(page.getByText(/tenants|organizations/i)).toBeVisible();
    await expect(page.getByText(/users/i)).toBeVisible();
  });

  test('should navigate to tenants page', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await page.getByRole('link', { name: /tenants|organizations/i }).click();
    await expect(page).toHaveURL(/.*super-admin\/tenants/);
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await page.getByRole('link', { name: /analytics|intelligence/i }).click();
    await expect(page).toHaveURL(/.*super-admin\/analytics/);
  });

  test('should navigate to subscriptions page', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await page.getByRole('link', { name: /subscriptions|billing/i }).click();
    await expect(page).toHaveURL(/.*super-admin\/subscriptions/);
  });
});

test.describe('Super Admin Tenants', () => {
  test.skip(({ browserName }) => true, 'Requires super admin authentication setup');

  test('should display tenants list', async ({ page }) => {
    await page.goto('/super-admin/tenants');
    await expect(page).toHaveURL(/.*super-admin\/tenants/);
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should open create tenant modal', async ({ page }) => {
    await page.goto('/super-admin/tenants');
    await page.getByRole('button', { name: /create|add|new/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/create.*tenant|new.*organization/i)).toBeVisible();
  });

  test('should search tenants', async ({ page }) => {
    await page.goto('/super-admin/tenants');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    // Wait for search results to update
    await page.waitForTimeout(500);
  });
});

test.describe('Super Admin Analytics', () => {
  test.skip(({ browserName }) => true, 'Requires super admin authentication setup');

  test('should display analytics overview', async ({ page }) => {
    await page.goto('/super-admin/analytics');
    await expect(page).toHaveURL(/.*super-admin\/analytics/);
    // Check for metric cards
    await expect(page.getByText(/market reach|tenants/i)).toBeVisible();
    await expect(page.getByText(/revenue|mrr|arr/i)).toBeVisible();
  });

  test('should switch time periods', async ({ page }) => {
    await page.goto('/super-admin/analytics');
    const periodButtons = page.locator('button:has-text("week"), button:has-text("month"), button:has-text("year")');
    if (await periodButtons.first().isVisible()) {
      await periodButtons.first().click();
    }
  });
});

test.describe('Super Admin Security', () => {
  test.skip(({ browserName }) => true, 'Requires super admin authentication setup');

  test('should display security center', async ({ page }) => {
    await page.goto('/super-admin/security');
    await expect(page).toHaveURL(/.*super-admin\/security/);
    await expect(page.getByText(/security|alerts|blocked/i)).toBeVisible();
  });
});

test.describe('Super Admin Data Management', () => {
  test.skip(({ browserName }) => true, 'Requires super admin authentication setup');

  test('should display data management page', async ({ page }) => {
    await page.goto('/super-admin/data');
    await expect(page).toHaveURL(/.*super-admin\/data/);
    await expect(page.getByText(/backup|snapshot|data/i)).toBeVisible();
  });

  test('should switch between data management tabs', async ({ page }) => {
    await page.goto('/super-admin/data');
    // Check backups tab
    await expect(page.getByText(/snapshot|backup/i)).toBeVisible();
    
    // Switch to exports tab
    const exportsTab = page.getByRole('button', { name: /export|pipeline/i });
    if (await exportsTab.isVisible()) {
      await exportsTab.click();
    }
    
    // Switch to GDPR tab
    const gdprTab = page.getByRole('button', { name: /gdpr|privacy|compliance/i });
    if (await gdprTab.isVisible()) {
      await gdprTab.click();
    }
  });
});
