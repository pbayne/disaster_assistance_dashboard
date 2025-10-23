import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/Databricks App/);

    // Check for the AppBar
    await expect(page.getByText('Databricks Application')).toBeVisible();
  });

  test('should have API Docs link', async ({ page }) => {
    await page.goto('/');

    // Check for API Docs button
    const apiDocsButton = page.getByRole('link', { name: /API Docs/i });
    await expect(apiDocsButton).toBeVisible();

    // Verify it has correct href
    await expect(apiDocsButton).toHaveAttribute('href', 'http://localhost:8000/docs');
  });

  test('should toggle drawer', async ({ page }) => {
    await page.goto('/');

    // Find the menu button
    const menuButton = page.getByRole('button', { name: /toggle drawer/i });
    await expect(menuButton).toBeVisible();

    // Click to toggle drawer
    await menuButton.click();

    // Wait for animation
    await page.waitForTimeout(500);

    // Click again to toggle back
    await menuButton.click();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Check Dashboard is initially selected
    await expect(page.getByRole('heading', { name: 'Global Operations Dashboard' })).toBeVisible();

    // Click on Analytics
    await page.getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();

    // Click on Reports
    await page.getByRole('button', { name: 'Reports' }).click();
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();

    // Click on Settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Click back to Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Global Operations Dashboard' })).toBeVisible();
  });

  test('should have all navigation items', async ({ page }) => {
    await page.goto('/');

    // Check all nav items are present
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reports' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });
});
