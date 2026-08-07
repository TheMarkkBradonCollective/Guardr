import { test, expect, type Page } from '@playwright/test';

/**
 * Guards the three-surface contract against the production bundle.
 *
 * These assertions are deliberately structural rather than cosmetic: they check
 * that each device type loads its own application with its own navigation model,
 * and that the chrome belonging to one surface never appears on another. A
 * regression that quietly turns the three applications back into one responsive
 * layout would fail here.
 *
 * See `docs/SURFACES.md`.
 */

const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  tablet: { width: 900, height: 1200 },
  desktop: { width: 1600, height: 1000 },
} as const;

/** Wait for the Supabase bootstrap loading screen to finish. */
async function waitForAppReady(page: Page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
}

async function surfaceOf(page: Page): Promise<string | undefined> {
  return page.evaluate(() => document.body.dataset.surface);
}

test.describe('surface resolution', () => {
  test('a phone viewport loads the mobile application', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await page.goto('/');
    await waitForAppReady(page);
    expect(await surfaceOf(page)).toBe('mobile');
    await expect(page.locator('body.sf-mobile')).toHaveCount(1);
    await expect(page.locator('body.sf-tablet, body.sf-desktop')).toHaveCount(0);
  });

  test('a tablet viewport loads the tablet application', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/');
    await waitForAppReady(page);
    expect(await surfaceOf(page)).toBe('tablet');
    await expect(page.locator('body.sf-tablet')).toHaveCount(1);
  });

  test('a wide pointer viewport loads the desktop operations centre', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/');
    await waitForAppReady(page);
    expect(await surfaceOf(page)).toBe('desktop');
    await expect(page.locator('body.sf-desktop')).toHaveCount(1);
  });

  test('the ?ui= override forces a surface and is marked as forced', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/?ui=mobile');
    await waitForAppReady(page);
    expect(await surfaceOf(page)).toBe('mobile');
    expect(await page.evaluate(() => document.body.dataset.surfaceMode)).toBe('forced');

    await page.goto('/');
    await waitForAppReady(page);
    expect(await surfaceOf(page)).toBe('desktop');
    expect(await page.evaluate(() => document.body.dataset.surfaceMode)).toBe('auto');
  });

  test('each surface publishes its own control sizing', async ({ page }) => {
    const read = () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return {
          target: style.getPropertyValue('--sf-target').trim(),
          navWidth: style.getPropertyValue('--sf-nav-w').trim(),
          bottomBar: style.getPropertyValue('--sf-bottom-bar-h').trim(),
        };
      });

    await page.setViewportSize(VIEWPORTS.phone);
    await page.goto('/');
    await waitForAppReady(page);
    const mobile = await read();

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/');
    await waitForAppReady(page);
    const desktop = await read();

    // Touch surfaces clear the 48px hit-area floor; the pointer surface trades
    // hit area for density. If these ever match, one surface is being scaled.
    expect(mobile.target).toBe('48px');
    expect(desktop.target).toBe('32px');
    expect(mobile.navWidth).toBe('0px');
    expect(desktop.navWidth).not.toBe('0px');
    expect(mobile.bottomBar).not.toBe('0px');
  });

  test('surface chrome never leaks across device types', async ({ page }) => {
    // The mobile app owns bottom tabs and sheets; the desktop owns the sidebar,
    // status bar, and command palette. Neither may render the other's chrome.
    await page.setViewportSize(VIEWPORTS.phone);
    await page.goto('/?ui=mobile');
    await waitForAppReady(page);
    await expect(page.locator('.sfd-sidebar, .sfd-statusbar, .sfd-palette, .sft-rail')).toHaveCount(0);

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/?ui=desktop');
    await waitForAppReady(page);
    await expect(page.locator('.sfm-tabbar, .sfm-sheet, .sft-rail, .sft-split')).toHaveCount(0);

    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/?ui=tablet');
    await waitForAppReady(page);
    await expect(page.locator('.sfm-tabbar, .sfd-sidebar, .sfd-statusbar')).toHaveCount(0);
  });
});
