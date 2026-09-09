import { test, expect, type Page } from '@playwright/test';

/** Wait for the Supabase bootstrap loading screen to finish before asserting UI. */
async function waitForAppReady(page: Page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
}

async function emulateInstalledApp(page: Page, app: 'client' | 'guard' | 'staff') {
  await page.route('**/native-product-app.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `window.__GUARDR_NATIVE_PRODUCT_APP__ = ${JSON.stringify(app)};`,
    });
  });
  await page.addInitScript((productApp) => {
    window.__GUARDR_NATIVE_PRODUCT_APP__ = productApp;
    try {
      localStorage.setItem('guardr_product_app', productApp);
    } catch {
      /* ignore */
    }
  }, app);
}

test.describe('installed Guard / Customer / Staff apps', () => {
  test.use({ viewport: { width: 390, height: 727 } });

  test('Guard welcome does not overlay copy with Sign in', async ({ page }) => {
    await emulateInstalledApp(page, 'guard');
    await page.goto('/');
    await waitForAppReady(page);

    await expect(page.locator('.app-welcome-sub')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

    const sub = page.locator('.app-welcome-sub');
    const dock = page.locator('.app-welcome-dock');
    const subBox = await sub.boundingBox();
    const dockBox = await dock.boundingBox();
    expect(subBox, 'welcome subtitle should be laid out').toBeTruthy();
    expect(dockBox, 'sign-in dock should be laid out').toBeTruthy();
    expect(subBox!.y + subBox!.height).toBeLessThanOrEqual(dockBox!.y + 1);
  });

  test('Work Sign in opens the guard form, not Log in as', async ({ page }) => {
    await emulateInstalledApp(page, 'guard');
    await page.goto('/');
    await waitForAppReady(page);

    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('button', { name: /Log in as/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Use the Guard app/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Guard app sign in/i })).toBeVisible();
  });

  test('Customer Sign in asks personal, business, or security company, not Log in as', async ({ page }) => {
    await emulateInstalledApp(page, 'client');
    await page.goto('/');
    await waitForAppReady(page);

    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('button', { name: /Log in as/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Use the Customer app/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Who is hiring/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Personal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Business/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Security company/i })).toBeVisible();

    await page.getByRole('button', { name: /^Personal/i }).click();
    await expect(page.getByRole('heading', { name: /Personal sign in/i })).toBeVisible();
  });
});
