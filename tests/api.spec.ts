import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should fetch API data successfully', async ({ page }) => {
    await page.goto('/');

    // Navigate to a non-Dashboard page that shows API data
    await page.getByRole('button', { name: 'Analytics' }).click();

    // Wait for API call to complete
    await page.waitForTimeout(1000);

    // Check for API Status card
    await expect(page.getByText('API Status')).toBeVisible();

    // Check for the API response message
    await expect(page.getByText('Hello from FastAPI!')).toBeVisible();
  });

  test('should display timestamp from API', async ({ page }) => {
    await page.goto('/');

    // Navigate to Analytics page
    await page.getByRole('button', { name: 'Analytics' }).click();

    // Wait for API call
    await page.waitForTimeout(1000);

    // Check for timestamp text
    await expect(page.getByText(/Timestamp:/)).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept the API call and force it to fail
    await page.route('**/api/data', route => route.abort());

    await page.goto('/');

    // Navigate to Analytics page
    await page.getByRole('button', { name: 'Analytics' }).click();

    // Wait for error to appear
    await page.waitForTimeout(1000);

    // Check for error message
    await expect(page.getByText(/Error:/)).toBeVisible();
  });

  test('backend health check endpoint should work', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.environment).toBeDefined();
  });

  test('backend data endpoint should return valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/data');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toBe('Hello from FastAPI!');
    expect(data.timestamp).toBeDefined();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.data.length).toBeGreaterThan(0);
  });

  test('backend data endpoint should return sample items', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/data');
    const data = await response.json();

    // Check for sample data structure
    expect(data.data[0]).toHaveProperty('id');
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('value');
  });
});
