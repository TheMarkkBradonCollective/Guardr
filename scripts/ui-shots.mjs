// Dev-only helper: capture UI screenshots across viewports/themes.
// Usage: node scripts/ui-shots.mjs <outDir> [baseUrl]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outDir = process.argv[2] ?? '/tmp/shots';
const baseUrl = process.argv[3] ?? 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 900, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];

const ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'signin', path: '/?auth=sign-in&ar=guard' },
  { name: 'rolepick', path: '/?auth=sign-in&pick=role' },
  { name: 'terms', path: '/legal/terms' },
  { name: 'download', path: '/download' },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.name === 'mobile',
      hasTouch: vp.name !== 'desktop',
    });
    await ctx.addInitScript((mode) => {
      try {
        window.localStorage.setItem('guardr_theme_mode', mode);
      } catch {
        /* ignore */
      }
    }, theme);
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      try {
        await page.goto(baseUrl + route.path, { waitUntil: 'networkidle', timeout: 30_000 });
      } catch {
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(1200);
      const file = `${outDir}/${vp.name}-${theme}-${route.name}.png`;
      await page.screenshot({ path: file });
      console.log('shot', file);
    }
    await ctx.close();
  }
}

await browser.close();
