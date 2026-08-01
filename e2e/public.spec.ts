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

  test('role picker deep link survives refresh', async ({ page }) => {
    await page.goto('/?auth=sign-in&pick=role');
    await waitForAppReady(page);
    await expect(page.getByRole('button', { name: /Log in as guard/i })).toBeVisible();
    await page.reload();
    await waitForAppReady(page);
    await expect(page.getByRole('button', { name: /Log in as guard/i })).toBeVisible();
  });

  test('legal terms page is reachable', async ({ page }) => {
    await page.goto('/legal/terms');
    await waitForAppReady(page);
    await expect(page.locator('body')).toContainText(/terms of service/i);
  });

  test('sign-up terms checkbox is tappable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 727 });
    await page.goto('/?auth=sign-up&ar=guard');
    await waitForAppReady(page);

    const checkbox = page.locator('#auth-accept-terms');
    await checkbox.scrollIntoViewIfNeeded();
    await expect(checkbox).toBeVisible();
    await expect(page.locator('.legal-accept-checkbox-visual')).toBeVisible();

    const termsLink = page.locator('#auth-accept-terms-copy a').first();
    await expect(termsLink).toHaveAttribute('href', '/legal/terms');
    await expect(termsLink).toHaveAttribute('target', '_blank');

    await expect(checkbox).not.toBeChecked();
    await page.locator('.legal-accept-checkbox-visual').click();
    await expect(checkbox).toBeChecked();

    const copy = page.locator('#auth-accept-terms-copy');
    await copy.click({ position: { x: 8, y: 8 } });
    await expect(checkbox).not.toBeChecked();
  });

  test('staff sign-up checkbox does not scroll page on tap', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 727 });
    await page.goto('/?auth=sign-up&ar=staff');
    await waitForAppReady(page);

    await expect(page.locator('body')).not.toContainText('I also accept the .');
    await expect(page.locator('.legal-footer-link')).toHaveCount(0);

    const main = page.locator('.auth-role-choice-main');
    await page.locator('.legal-accept-checkbox-visual').scrollIntoViewIfNeeded();

    const scrollBefore = await main.evaluate((el) => el.scrollTop);
    await page.locator('.legal-accept-checkbox-visual').click();
    const scrollAfter = await main.evaluate((el) => el.scrollTop);

    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(8);
    await expect(page.locator('#auth-accept-terms')).toBeChecked();
  });
});
