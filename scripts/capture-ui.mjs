/**
 * Dev-only UI capture harness. Signs in with a bootstrap staff account and
 * screenshots the main signed-in surfaces at desktop and phone widths so
 * layout work can be reviewed without a device.
 *
 * Usage: node scripts/capture-ui.mjs [outDir]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.CAPTURE_BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || '/tmp/ui-capture';

// Credentials come from the environment so this harness carries no secrets.
const OWNER_EMAIL = process.env.CAPTURE_EMAIL;
const OWNER_PASSWORD = process.env.CAPTURE_PASSWORD;

if (!OWNER_EMAIL || !OWNER_PASSWORD) {
  console.error('Set CAPTURE_EMAIL and CAPTURE_PASSWORD to run the capture harness.');
  process.exit(1);
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  phone: { width: 393, height: 852 },
};

async function settle(page, ms = 1200) {
  await page.waitForTimeout(ms);
}

async function signIn(page) {
  await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
  await settle(page, 3000);
  await page.fill('input[type="email"]', OWNER_EMAIL);
  await page.fill('input[type="password"]', OWNER_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await settle(page, 4000);
}

async function shoot(page, name) {
  await settle(page, 800);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name);
}

async function run(label, viewport, theme) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();

  if (theme === 'dark') {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('guardr-theme', 'dark');
      } catch {
        /* ignore */
      }
    });
  }

  await signIn(page);
  await shoot(page, `${label}-01-signed-in`);

  // Walk the primary nav destinations that exist on this surface.
  const navTargets = await page.evaluate(() => {
    const seen = new Set();
    const out = [];
    document
      .querySelectorAll('[data-tour], nav button, .uber-rail-item, .guardr-icon-rail button')
      .forEach((el) => {
        const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24);
        if (label && !seen.has(label)) {
          seen.add(label);
          out.push(label);
        }
      });
    return out.slice(0, 10);
  });
  console.log(`${label} nav targets:`, navTargets);

  await context.close();
  await browser.close();
}

await mkdir(OUT, { recursive: true });
await run('desktop', VIEWPORTS.desktop, 'light');
await run('phone', VIEWPORTS.phone, 'light');
console.log('output dir:', OUT);
