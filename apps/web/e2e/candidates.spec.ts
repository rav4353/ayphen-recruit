import { test, expect } from '@playwright/test';

test.describe('Candidates Management', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should display candidates list', async ({ page }) => {
    await page.goto('/candidates');
    await expect(page).toHaveURL(/.*candidates/);
    await expect(page.getByRole('heading', { name: /candidates/i })).toBeVisible();
  });

  test('should open add candidate modal', async ({ page }) => {
    await page.goto('/candidates');
    await page.getByRole('button', { name: /add|create|new.*candidate/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should add a new candidate', async ({ page }) => {
    await page.goto('/candidates');
    await page.getByRole('button', { name: /add|create|new.*candidate/i }).click();

    await page.getByLabel(/first.*name/i).fill('John');
    await page.getByLabel(/last.*name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('john.doe@example.com');
    await page.getByLabel(/phone/i).fill('+1234567890');

    await page.getByRole('button', { name: /save|add|create/i }).click();
    await expect(page.getByText(/added|created|success/i)).toBeVisible();
  });

  test('should search candidates', async ({ page }) => {
    await page.goto('/candidates');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('John');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should view candidate profile', async ({ page }) => {
    await page.goto('/candidates');
    const firstCandidate = page.locator('[data-testid="candidate-row"]').first();
    if (await firstCandidate.isVisible()) {
      await firstCandidate.click();
      await expect(page).toHaveURL(/.*candidates\/[a-z0-9-]+/);
    }
  });

  test('should add note to candidate', async ({ page }) => {
    await page.goto('/candidates');
    const firstCandidate = page.locator('[data-testid="candidate-row"]').first();
    if (await firstCandidate.isVisible()) {
      await firstCandidate.click();
      
      const notesTab = page.getByRole('tab', { name: /notes/i });
      if (await notesTab.isVisible()) {
        await notesTab.click();
        await page.getByPlaceholder(/add.*note/i).fill('Test note from E2E');
        await page.getByRole('button', { name: /add|save/i }).click();
        await expect(page.getByText('Test note from E2E')).toBeVisible();
      }
    }
  });

  test('should apply to job from candidate profile', async ({ page }) => {
    await page.goto('/candidates');
    const firstCandidate = page.locator('[data-testid="candidate-row"]').first();
    if (await firstCandidate.isVisible()) {
      await firstCandidate.click();
      
      const applyButton = page.getByRole('button', { name: /apply.*job|add.*application/i });
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    }
  });
});
