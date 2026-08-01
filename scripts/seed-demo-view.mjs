/**
 * Dev-only visual check. Seeds the local tutorial practice snapshot with a
 * spread of job states and screenshots the result. Writes nothing to the backend.
 *
 * Known limit: the tour locks navigation while it runs, and ending it drops the
 * practice rows, so this populates dashboard metrics and charts but cannot yet
 * drive the Jobs board itself. Reviewing a populated board needs either backend
 * credentials or a fixture route that mounts the panel directly.
 *
 * Usage: CAPTURE_EMAIL=… CAPTURE_PASSWORD=… node scripts/seed-demo-view.mjs [outDir]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.CAPTURE_BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || '/tmp/seeded';
const EMAIL = process.env.CAPTURE_EMAIL;
const PASSWORD = process.env.CAPTURE_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Set CAPTURE_EMAIL and CAPTURE_PASSWORD.');
  process.exit(1);
}

const STATES = [
  ['open', 'Harbor Logistics — Gate 2', 'Harbor Logistics', 28],
  ['pending-review', 'Civic Center Plaza', 'City of Portage', 31.5],
  ['accepted', 'Northgate Retail', 'Northgate Group', 29.75],
  ['in-progress', 'Portage Distribution — Dock A3', 'Bev\u2019s Beverages', 26],
  ['completed', 'Riverside Warehouse', 'Riverside Co.', 24],
  ['cancelled', 'Lakeside Events', 'Lakeside LLC', 33],
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(4500);

const seeded = await page.evaluate((states) => {
  const key = Object.keys(localStorage).find((k) => k.startsWith('guardr_tutorial_'));
  const userId = key ? key.replace('guardr_tutorial_', '') : 'staff-director';
  const now = new Date().toISOString();
  const at = (h) => new Date(Date.now() + h * 3600_000).toISOString();

  const requests = states.map(([status, title, clientName, rate], i) => ({
    id: `tutorial-demo-seed-${i}`,
    title,
    description: 'Local practice row for layout review.',
    clientId: 'tutorial-demo-client',
    clientName,
    clientLogo: '',
    location: title,
    siteName: title,
    address: '100 Review Lane',
    state: 'California',
    latitude: 34.0522,
    longitude: -118.2437,
    type: 'event',
    armedRequired: false,
    guardsNeeded: 1,
    startDate: at(24 + i * 8),
    endDate: at(32 + i * 8),
    durationHours: 8,
    hourlyRate: rate,
    estimatedPayout: rate * 8,
    status,
    assignedGuardId: null,
    applicants: [],
    requiredCertifications: [],
    paymentStatus: 'unpaid',
  }));

  localStorage.setItem(
    `guardr_tutorial_${userId}`,
    JSON.stringify({
      // `prompt` keeps the practice snapshot readable while leaving the tutorial
      // inactive, so no coach mark blocks navigation during review.
      lifecycle: 'completed',
      session: {
        tourId: 'staff',
        phase: 'prompt',
        stepIndex: 0,
        demoData: { requests, createdAt: now, updatedAt: now },
      },
    }),
  );
  return { userId, count: requests.length };
}, STATES);

console.log('seeded', seeded);

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5500);

await mkdir(OUT, { recursive: true });

// The tour locks navigation while it runs; leave it so the boards are reachable.
// Practice rows live in the same snapshot and survive the exit.
for (const label of ['End tutorial', 'Got it', 'Dismiss', 'Close']) {
  const btn = page.getByRole('button', { name: label, exact: true });
  if (await btn.count()) {
    await btn.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(900);
  }
}

const jobs = page.locator('.uber-rail-items .uber-rail-btn[aria-label="Jobs"]');
if (await jobs.count()) {
  // The practice spotlight overlays the workspace, so bypass hit-testing.
  await jobs.click({ force: true });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/jobs-desktop.png` });
  console.log('captured jobs-desktop');
}

await page.setViewportSize({ width: 393, height: 852 });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/jobs-phone.png` });
console.log('captured jobs-phone');

await browser.close();
