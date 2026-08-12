import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test/screenshots';
const LAT = '34.1016';
const LNG = '-118.3416';

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/End tutorial/i, /Skip/i, /Got it/i, /Close/i, /Not now/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 300 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
  await page.keyboard.press('Escape').catch(() => {});
}
async function reset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
}
async function login(page) {
  await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (!(await page.locator('input[type="email"]').count())) {
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
    await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
  }
  await page.locator('input[type="email"]').fill('m.white@signaturesecurityspecialist.com');
  await page.locator('input[type="password"]').fill('#FuckinDstorm11');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(3000);
  await waitReady(page);
  await dismiss(page);
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();
const results = [];

await reset(page, context);
await login(page);

await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await dismiss(page);

// Process both job cards from the list
const jobCards = page.locator('button, [role="button"], .cursor-pointer').filter({ hasText: /Pending review/i });
const count = await page.getByText(/Pending review/i).count();
console.log('pending badges', count);

for (const title of ['Corporate Event Security', 'Standing Guard Post']) {
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  // Click the card containing the title
  const card = page.locator('div, button, li, article').filter({ hasText: title }).filter({ hasText: /Pending review|E2E Test Properties/i }).first();
  await page.getByText(title, { exact: true }).first().click({ force: true });
  await page.waitForTimeout(900);

  const edit = page.getByRole('button', { name: /Edit job listing/i }).first();
  if (!(await edit.isVisible({ timeout: 3000 }).catch(() => false))) {
    results.push({ title, ok: false, detail: 'no edit button' });
    continue;
  }
  await edit.click({ force: true });
  await page.waitForTimeout(1000);

  // Fix city to Los Angeles if dropdown present
  const city = page.getByLabel(/city/i).first();
  if (await city.isVisible({ timeout: 800 }).catch(() => false)) {
    await city.click({ force: true }).catch(() => {});
    await page.getByText('Los Angeles', { exact: true }).first().click({ force: true }).catch(() => {});
  } else {
    // try select / combobox
    const combo = page.locator('select, [role="combobox"]').filter({ hasText: /Sacramento|Los Angeles|City/i }).first();
    if (await combo.isVisible({ timeout: 500 }).catch(() => false)) {
      await combo.click({ force: true });
      await page.getByText('Los Angeles', { exact: true }).first().click({ force: true }).catch(() => {});
    }
  }

  // Fill lat/lng by placeholder
  const lat = page.getByPlaceholder(/34\.05223|latitude|lat/i).first();
  const lng = page.getByPlaceholder(/-118\.24368|longitude|lng/i).first();
  if (await lat.isVisible({ timeout: 1000 }).catch(() => false)) await lat.fill(LAT);
  if (await lng.isVisible({ timeout: 1000 }).catch(() => false)) await lng.fill(LNG);

  // Fallback: two number-ish empty inputs under Map Coordinates
  if (!(await lat.isVisible().catch(() => false))) {
    const inputs = page.locator('input:visible');
    for (let i = 0; i < (await inputs.count()); i++) {
      const el = inputs.nth(i);
      const ph = (await el.getAttribute('placeholder')) || '';
      if (/34\.|lat/i.test(ph)) await el.fill(LAT);
      if (/-118|long/i.test(ph)) await el.fill(LNG);
    }
  }

  await page.getByRole('button', { name: /Apply coordinates/i }).click({ force: true });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Save changes/i }).click({ force: true });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/94-after-save-${title.replace(/\s+/g, '-')}.png`, fullPage: true });

  // Detail should refresh; approve
  const approve = page.getByRole('button', { name: /Approve Job/i }).first();
  // If still in modal, close it
  if (!(await approve.isVisible({ timeout: 1500 }).catch(() => false))) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
    await page.getByText(title, { exact: true }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
  }
  const body = await page.locator('body').innerText();
  const coordsMissing = /No map coordinates/i.test(body);
  const disabled = await page.getByRole('button', { name: /Approve Job/i }).first().isDisabled().catch(() => true);
  console.log(title, { coordsMissing, disabled });
  if (!disabled) {
    await page.getByRole('button', { name: /Approve Job/i }).first().click({ force: true });
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: `${OUT}/95-after-approve-${title.replace(/\s+/g, '-')}.png`, fullPage: true });
  const after = await page.locator('body').innerText();
  results.push({
    title,
    coordsMissing,
    disabled,
    status: after.match(/Pending review|Open|Approved|Active/i)?.[0],
    noCoords: /No map coordinates/i.test(after),
  });
}

await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await page.screenshot({ path: `${OUT}/96-jobs-final.png`, fullPage: true });
const finalJobs = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 900);
await browser.close();
fs.writeFileSync('/opt/cursor/artifacts/prod-field-test/coords-approve-report.json', JSON.stringify({ results, finalJobs }, null, 2));
console.log(JSON.stringify({ results, finalJobs }, null, 2));
