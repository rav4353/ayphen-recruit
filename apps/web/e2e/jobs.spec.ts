import { test, expect } from '@playwright/test';

test.describe('Jobs Management', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should display jobs list', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page).toHaveURL(/.*jobs/);
    await expect(page.getByRole('heading', { name: /jobs/i })).toBeVisible();
  });

  test('should open create job modal', async ({ page }) => {
    await page.goto('/jobs');
    await page.getByRole('button', { name: /create|new|add.*job/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/create.*job|new.*job/i)).toBeVisible();
  });

  test('should create a new job', async ({ page }) => {
    await page.goto('/jobs');
    await page.getByRole('button', { name: /create|new|add.*job/i }).click();

    // Fill in job details
    await page.getByLabel(/title/i).fill('Senior Software Engineer');
    await page.getByLabel(/department/i).selectOption({ index: 1 });
    await page.getByLabel(/location/i).selectOption({ index: 1 });
    
    const descriptionEditor = page.locator('[contenteditable="true"]').first();
    if (await descriptionEditor.isVisible()) {
      await descriptionEditor.fill('We are looking for a senior software engineer...');
    }

    await page.getByRole('button', { name: /save|create|submit/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    await page.goto('/jobs');
    const statusFilter = page.getByRole('combobox', { name: /status|filter/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('PUBLISHED');
      await expect(page).toHaveURL(/.*status=PUBLISHED/);
    }
  });

  test('should search jobs', async ({ page }) => {
    await page.goto('/jobs');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Engineer');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="job-card"]')).toHaveCount(1);
  });

  test('should view job details', async ({ page }) => {
    await page.goto('/jobs');
    const firstJob = page.locator('[data-testid="job-card"]').first();
    if (await firstJob.isVisible()) {
      await firstJob.click();
      await expect(page).toHaveURL(/.*jobs\/[a-z0-9-]+/);
    }
  });

  test('should edit a job', async ({ page }) => {
    await page.goto('/jobs');
    const firstJob = page.locator('[data-testid="job-card"]').first();
    if (await firstJob.isVisible()) {
      await firstJob.click();
      await page.getByRole('button', { name: /edit/i }).click();
      await page.getByLabel(/title/i).fill('Updated Job Title');
      await page.getByRole('button', { name: /save|update/i }).click();
      await expect(page.getByText(/updated|saved/i)).toBeVisible();
    }
  });
});
