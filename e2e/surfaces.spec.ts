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

/** SurfaceProvider publishes `data-surface` on first paint — wait for it explicitly. */
async function waitForSurface(page: Page, expected?: string) {
  await waitForAppReady(page);
  await page.waitForFunction(
    (surface) => {
      const current = document.body.dataset.surface;
      return surface ? current === surface : Boolean(current);
    },
    expected,
    { timeout: 30_000 },
  );
}

async function surfaceOf(page: Page): Promise<string | undefined> {
  return page.evaluate(() => document.body.dataset.surface);
}

test.describe('surface resolution', () => {
  test('a phone viewport loads the mobile application', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await page.goto('/');
    await waitForSurface(page, 'mobile');
    expect(await surfaceOf(page)).toBe('mobile');
    await expect(page.locator('body.sf-mobile')).toHaveCount(1);
    await expect(page.locator('body.sf-tablet, body.sf-desktop')).toHaveCount(0);
  });

  test('a tablet viewport loads the tablet application', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/');
    await waitForSurface(page, 'tablet');
    expect(await surfaceOf(page)).toBe('tablet');
    await expect(page.locator('body.sf-tablet')).toHaveCount(1);
  });

  test('a wide pointer viewport loads the desktop operations centre', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/');
    await waitForSurface(page, 'desktop');
    expect(await surfaceOf(page)).toBe('desktop');
    await expect(page.locator('body.sf-desktop')).toHaveCount(1);
  });

  test('the ?ui= override forces a surface and is marked as forced', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/?ui=mobile');
    await waitForSurface(page, 'mobile');
    expect(await surfaceOf(page)).toBe('mobile');
    expect(await page.evaluate(() => document.body.dataset.surfaceMode)).toBe('forced');

    await page.goto('/');
    await waitForSurface(page, 'desktop');
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
    await waitForSurface(page, 'mobile');
    const mobile = await read();

    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/');
    await waitForSurface(page, 'tablet');
    const tablet = await read();

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/');
    await waitForSurface(page, 'desktop');
    const desktop = await read();

    // Each application authors its own control scale. If tablet ever matches
    // mobile or desktop, one surface is being stretched instead of designed.
    expect(mobile.target).toBe('48px');
    expect(tablet.target).toBe('44px');
    expect(desktop.target).toBe('32px');
    expect(mobile.navWidth).toBe('0px');
    expect(tablet.navWidth).not.toBe('0px');
    expect(tablet.navWidth).not.toBe(desktop.navWidth);
    expect(mobile.bottomBar).not.toBe('0px');
    expect(tablet.bottomBar).toBe('0px');
    expect(desktop.navWidth).not.toBe('0px');
  });

  test('surface chrome never leaks across device types', async ({ page }) => {
    // Mobile keeps the classic drawer + bottom nav; tablet owns the rail;
    // desktop owns the sidebar, status bar, and command palette.
    await page.setViewportSize(VIEWPORTS.phone);
    await page.goto('/?ui=mobile');
    await waitForSurface(page, 'mobile');
    await expect(page.locator('.sfd-sidebar, .sfd-statusbar, .sfd-palette, .sft-rail')).toHaveCount(0);

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/?ui=desktop');
    await waitForSurface(page, 'desktop');
    await expect(
      page.locator('.sfm-tabbar, .sfm-sheet, .sft-rail, .sft-split, .uber-bottom-nav, .mobility-drawer'),
    ).toHaveCount(0);

    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/?ui=tablet');
    await waitForSurface(page, 'tablet');
    await expect(page.locator('.sfm-tabbar, .sfd-sidebar, .sfd-statusbar, .uber-bottom-nav')).toHaveCount(0);
  });

  test('tablet landing is its own page, not scaled desktop or mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/');
    await waitForSurface(page, 'tablet');
    await expect(page.locator('.uber-style-landing--tablet')).toHaveCount(1);
    await expect(page.locator('.uber-style-landing--mobile')).toHaveCount(0);
    await expect(page.locator('.dsk-landing-nav')).toHaveCount(0);
  });

  test('a 1100px landscape width stays on the tablet app, not desktop', async ({ page }) => {
    // Tailwind's lg floor is 1024px, so formFactor would be desktop here. The
    // tablet application owns 744–1179px and must keep its own landing + tokens.
    await page.setViewportSize({ width: 1100, height: 820 });
    await page.goto('/');
    await waitForSurface(page, 'tablet');
    expect(await surfaceOf(page)).toBe('tablet');
    await expect(page.locator('body.sf-tablet')).toHaveCount(1);
    await expect(page.locator('.uber-style-landing--tablet')).toHaveCount(1);
    await expect(page.locator('.dsk-landing-nav, body.sf-desktop')).toHaveCount(0);
    const target = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--sf-target').trim(),
    );
    expect(target).toBe('44px');
  });

  test('shell canvases are scrollable when content overflows', async ({ page }) => {
    // The remaster initially set overflow:hidden on every canvas and forgot to
    // wrap feature pages — nothing scrolled. Inject the canvas class under the
    // active surface and assert CSS restores overflow scrolling.
    const measure = (className: string) =>
      page.evaluate((cls) => {
        const el = document.createElement('main');
        el.className = cls;
        el.setAttribute('data-bleed', 'false');
        document.body.appendChild(el);
        const overflowY = getComputedStyle(el).overflowY;
        el.remove();
        return overflowY;
      }, className);

    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/?ui=tablet');
    await waitForSurface(page, 'tablet');
    expect(await measure('sft-shell-canvas')).toMatch(/auto|scroll/);

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/?ui=desktop');
    await waitForSurface(page, 'desktop');
    expect(await measure('sfd-shell-canvas')).toMatch(/auto|scroll/);

    await page.setViewportSize(VIEWPORTS.phone);
    await page.goto('/?ui=mobile');
    await waitForSurface(page, 'mobile');
    // Preview/mobile kit path; classic GuardrDrawerShell uses inline overflow:auto
    // on .mobility-content-inner once a signed-in role shell mounts.
    expect(await measure('sfm-shell-canvas')).toMatch(/auto|scroll/);
  });
});
