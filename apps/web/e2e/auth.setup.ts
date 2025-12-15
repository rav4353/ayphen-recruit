import { test as setup, expect } from '@playwright/test';
const authFile = new URL('./.auth/user.json', import.meta.url).pathname;

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');

  // Fill in credentials using input type selectors (form uses unassociated labels)
  await page.locator('input[type="email"]').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD || 'testpassword123');
  
  // Submit login form (use type="submit" to target the main form button)
  await page.locator('button[type="submit"]').click();

  // Wait for successful login - should redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
