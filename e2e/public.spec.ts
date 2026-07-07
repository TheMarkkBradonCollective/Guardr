import { test, expect } from '@playwright/test';

test.describe('Guardr public pages', () => {
  test('homepage loads with Guardr branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Guardr/i);
  });

  test('auth deep link opens sign-in', async ({ page }) => {
    await page.goto('/?auth=sign-in&ar=guard');
    await expect(page.locator('body')).toContainText(/sign in|sign up/i);
  });

  test('legal terms page is reachable', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page.locator('body')).toContainText(/terms|service/i);
  });
});
