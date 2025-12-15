import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page.getByText(/required|please enter|invalid/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot.*password/i }).click();
    await expect(page).toHaveURL(/.*forgot-password|reset/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    const signUpLink = page.getByRole('link', { name: /sign up|register|create account/i });
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page).toHaveURL(/.*register|signup/);
    }
  });
});

test.describe('Authenticated User', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should access dashboard after login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display user menu', async ({ page }) => {
    await page.goto('/dashboard');
    const userMenu = page.getByRole('button', { name: /profile|account|user/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await expect(page.getByText(/settings|logout|sign out/i)).toBeVisible();
    }
  });
});
