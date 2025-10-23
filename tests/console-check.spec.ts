import { test, expect } from '@playwright/test';

test('check for console errors', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);

    if (msg.type() === 'error') {
      errors.push(text);
    } else if (msg.type() === 'warning') {
      warnings.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}\n${error.stack}`);
  });

  try {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 10000 });

    // Wait a bit for any async errors
    await page.waitForTimeout(3000);

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== ERRORS ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No errors found!');
    }

    console.log('\n=== WARNINGS ===');
    if (warnings.length > 0) {
      warnings.forEach(warn => console.log(warn));
    } else {
      console.log('No warnings found!');
    }

    // Check if page loaded successfully
    const body = await page.locator('body').innerHTML();
    console.log('\n=== PAGE LOADED ===');
    console.log(`Body content length: ${body.length} characters`);

    // Fail test if there are errors
    expect(errors.length).toBe(0);

  } catch (error) {
    console.log('\n=== TEST ERROR ===');
    console.log(error);
    throw error;
  }
});
