import { test, expect } from '@playwright/test';

test.describe('Map Dashboard', () => {
  test('should display the map on Dashboard page', async ({ page }) => {
    await page.goto('/');

    // Verify we're on the Dashboard
    await expect(page.getByRole('heading', { name: 'Global Operations Dashboard' })).toBeVisible();

    // Check for map container (Leaflet creates a div with leaflet-container class)
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });

  test('should display location cards', async ({ page }) => {
    await page.goto('/');

    // Wait for location cards to load
    await page.waitForTimeout(1000);

    // Check for location cards
    await expect(page.getByText('San Francisco')).toBeVisible();
    await expect(page.getByText('New York')).toBeVisible();
    await expect(page.getByText('London')).toBeVisible();
    await expect(page.getByText('Tokyo')).toBeVisible();
    await expect(page.getByText('Sydney')).toBeVisible();
  });

  test('should display status chips on location cards', async ({ page }) => {
    await page.goto('/');

    // Wait for cards to load
    await page.waitForTimeout(1000);

    // Check for status chips (ACTIVE, WARNING, INACTIVE)
    const statusChips = page.locator('[class*="MuiChip"]').filter({ hasText: /ACTIVE|WARNING|INACTIVE/ });
    await expect(statusChips.first()).toBeVisible();
  });

  test('should display active user counts', async ({ page }) => {
    await page.goto('/');

    // Wait for cards to load
    await page.waitForTimeout(1000);

    // Check for "Active Users" text
    const activeUsersText = page.getByText('Active Users').first();
    await expect(activeUsersText).toBeVisible();
  });

  test('should show selected location details when card is clicked', async ({ page }) => {
    await page.goto('/');

    // Wait for cards to load
    await page.waitForTimeout(1000);

    // Click on San Francisco card
    const sfCard = page.locator('text=San Francisco').locator('..');
    await sfCard.click();

    // Wait for selection to process
    await page.waitForTimeout(500);

    // Check for selected location details
    await expect(page.getByText(/Selected Location:/)).toBeVisible();
  });

  test('should have map tiles loaded', async ({ page }) => {
    await page.goto('/');

    // Wait for map to initialize
    await page.waitForTimeout(2000);

    // Check for OpenStreetMap attribution
    const attribution = page.locator('.leaflet-control-attribution');
    await expect(attribution).toBeVisible();
    await expect(attribution).toContainText('OpenStreetMap');
  });

  test('should display map markers', async ({ page }) => {
    await page.goto('/');

    // Wait for map to fully load
    await page.waitForTimeout(2000);

    // Check for Leaflet markers
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers.first()).toBeVisible();
  });

  test('should display circles on map', async ({ page }) => {
    await page.goto('/');

    // Wait for map to fully load
    await page.waitForTimeout(2000);

    // Check for SVG circles (Leaflet uses SVG for circles)
    const circles = page.locator('circle[fill-opacity]');
    await expect(circles.first()).toBeVisible();
  });
});
