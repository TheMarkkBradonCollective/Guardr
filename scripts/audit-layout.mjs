/**
 * Responsive layout audit. Walks the signed-in surfaces at every breakpoint and
 * reports elements that overflow the viewport, clip their own text, or collide
 * with a neighbour — the "cut off / overlapping" class of bugs.
 *
 * Usage: CAPTURE_EMAIL=… CAPTURE_PASSWORD=… node scripts/audit-layout.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.CAPTURE_BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || '/tmp/layout-audit';
const EMAIL = process.env.CAPTURE_EMAIL;
const PASSWORD = process.env.CAPTURE_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Set CAPTURE_EMAIL and CAPTURE_PASSWORD.');
  process.exit(1);
}

const BREAKPOINTS = [
  { name: 'phone', width: 393, height: 852 },
  { name: 'phone-lg', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-lg', width: 1024, height: 1366 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-xl', width: 1920, height: 1080 },
];

/** Runs in the page: collect layout defects for the current viewport. */
function collectDefects() {
  const problems = [];
  const vw = window.innerWidth;
  const seen = new Set();

  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className
        ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const push = (kind, el, detail) => {
    const key = `${kind}|${describe(el)}|${detail}`;
    if (seen.has(key)) return;
    seen.add(key);
    problems.push({ kind, selector: describe(el), detail });
  };

  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

    // Collapsed drawers keep their content for the width transition, and map
    // tiles are meant to extend past their clipping frame. Neither is a defect.
    if (el.closest('[inert]') || el.closest('[aria-hidden="true"]')) continue;
    if (el.closest('.leaflet-container') || el.classList.contains('leaflet-container')) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // Horizontal overflow past the viewport edge.
    if (rect.right > vw + 1) {
      push('overflow-right', el, `right=${Math.round(rect.right)} vw=${vw}`);
    }
    if (rect.left < -1) {
      push('overflow-left', el, `left=${Math.round(rect.left)}`);
    }

    // Text clipped by a fixed height with hidden overflow.
    const clipsY = style.overflowY === 'hidden' || style.overflow === 'hidden';
    if (clipsY && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
      const textish = el.childElementCount === 0 && (el.textContent || '').trim().length > 0;
      if (textish) {
        push('text-clipped', el, `scrollH=${el.scrollHeight} clientH=${el.clientHeight}`);
      }
    }

    // Unscrollable horizontal content (a table that can't be reached). Text that
    // deliberately truncates shows an ellipsis and carries a title, so the value
    // is still available — that is a design choice, not a defect.
    const clipsX = style.overflowX === 'hidden' || style.overflow === 'hidden';
    const truncatesOnPurpose =
      style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none';
    if (clipsX && !truncatesOnPurpose && el.scrollWidth > el.clientWidth + 2) {
      push('content-unreachable', el, `scrollW=${el.scrollWidth} clientW=${el.clientWidth}`);
    }
  }

  // Tap targets that are too small on touch surfaces.
  if (vw < 900) {
    for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.height < 40 || rect.width < 24) {
        push('tap-target', el, `${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    }
  }

  return {
    problems,
    docScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: vw,
  };
}

async function signIn(page) {
  await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
}

const report = [];

for (const bp of BREAKPOINTS) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    hasTouch: bp.width < 900,
    isMobile: bp.width < 900,
  });
  const page = await context.newPage();

  try {
    await signIn(page);

    const nav = page.locator('.uber-rail-items .uber-rail-btn, .guardr-bottom-nav button');
    const count = Math.min(await nav.count(), 6);
    const screens = [{ label: 'home', click: null }];
    for (let i = 0; i < count; i += 1) screens.push({ label: `dest-${i}`, click: i });

    for (const screen of screens) {
      if (screen.click != null) {
        try {
          await nav.nth(screen.click).click({ timeout: 4000 });
        } catch {
          continue;
        }
      }
      await page.waitForTimeout(1200);
      const label =
        screen.click == null
          ? 'home'
          : ((await nav.nth(screen.click).getAttribute('aria-label')) || screen.label);
      const result = await page.evaluate(collectDefects);
      if (result.problems.length || result.docScrollWidth > result.viewportWidth + 1) {
        report.push({
          breakpoint: bp.name,
          width: bp.width,
          screen: label,
          docScrollWidth: result.docScrollWidth,
          problems: result.problems.slice(0, 25),
        });
      }
    }
  } catch (error) {
    report.push({ breakpoint: bp.name, width: bp.width, screen: 'ERROR', error: String(error) });
  }

  await context.close();
  await browser.close();
  console.log('audited', bp.name);
}

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));

const counts = {};
for (const entry of report) {
  for (const p of entry.problems ?? []) {
    counts[p.kind] = (counts[p.kind] || 0) + 1;
  }
}
console.log('\n=== defect counts ===');
console.log(counts);
console.log('\nreport:', `${OUT}/report.json`);
