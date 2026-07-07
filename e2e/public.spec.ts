import { test, expect, type Page } from '@playwright/test';

/** Wait for the Supabase bootstrap loading screen to finish before asserting UI. */
async function waitForAppReady(page: Page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
}

test.describe('Guardr public pages', () => {
  test('homepage loads with Guardr branding', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await expect(page.locator('body')).toContainText(/Guardr/i);
  });

  test('auth deep link opens sign-in', async ({ page }) => {
    await page.goto('/?auth=sign-in&ar=guard');
    await waitForAppReady(page);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true }).first()).toBeVisible();
  });

  test('legal terms page is reachable', async ({ page }) => {
    await page.goto('/legal/terms');
    await waitForAppReady(page);
    await expect(page.locator('body')).toContainText(/terms of service/i);
  });
});
