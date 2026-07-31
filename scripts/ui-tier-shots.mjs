// Dev-only helper: capture the app shell across every platform tier.
// Usage: node scripts/ui-tier-shots.mjs <outDir> [path] [baseUrl]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outDir = process.argv[2] ?? '/tmp/tier-shots';
const path = process.argv[3] ?? '/?ui-preview=1';
const baseUrl = process.argv[4] ?? 'http://localhost:3000';

const CASES = [
  { name: 'website-desktop', width: 1440, height: 900, shell: 'browser' },
  { name: 'website-tablet', width: 900, height: 1180, shell: 'browser', touch: true },
  { name: 'website-mobile', width: 390, height: 844, shell: 'browser', touch: true, mobile: true },
  { name: 'pwa-full-mobile', width: 390, height: 844, shell: 'pwa', query: 'pwa=full', touch: true, mobile: true },
  { name: 'pwa-lite-mobile', width: 390, height: 844, shell: 'pwa', query: 'pwa=lite', touch: true, mobile: true },
  { name: 'pwa-full-tablet', width: 900, height: 1180, shell: 'pwa', query: 'pwa=full', touch: true },
  { name: 'apk-full-mobile', width: 390, height: 844, shell: 'native', query: 'apk=full', touch: true, mobile: true },
  { name: 'apk-premium-tablet', width: 900, height: 1180, shell: 'native', query: 'apk=premium', touch: true },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const testCase of CASES) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({
      viewport: { width: testCase.width, height: testCase.height },
      deviceScaleFactor: 2,
      isMobile: !!testCase.mobile,
      hasTouch: !!testCase.touch,
    });
    await ctx.addInitScript(
      ({ shell, mode }) => {
        try {
          window.localStorage.setItem('guardr_theme_mode', mode);
        } catch {
          /* ignore */
        }
        if (shell === 'pwa') {
          Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true });
        }
        if (shell === 'native') {
          window.androidBridge = { postMessage() {} };
        }
      },
      { shell: testCase.shell, mode: theme },
    );
    const page = await ctx.newPage();
    const url =
      baseUrl + path + (testCase.query ? (path.includes('?') ? '&' : '?') + testCase.query : '');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 40_000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const surface = await page.evaluate(() => ({
      viewSurface: document.body.dataset.viewSurface,
      tier: document.body.dataset.experienceTier,
    }));
    const file = `${outDir}/${testCase.name}-${theme}.png`;
    await page.screenshot({ path: file });
    console.log(testCase.name, theme, JSON.stringify(surface));
    await ctx.close();
  }
}

await browser.close();
