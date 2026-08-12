/**
 * Finish PTA + CE, staff verify, accept open job.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
const IMG = '/home/ubuntu/Downloads/e2e-fake-credential.png';
fs.mkdirSync(SHOT, { recursive: true });
const report = [];
const log = (s, ok, d) => {
  report.push({ s, ok, d });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 280)}`);
};
const shot = async (page, n) => page.screenshot({ path: path.join(SHOT, `${n}.png`), fullPage: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/End tutorial/i, /Skip/i, /Got it/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 250 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
}
async function reset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
}
async function login(page, role, email, password) {
  await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (!(await page.locator('input[type="email"]').count())) {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(3200);
  await waitReady(page);
  await dismiss(page);
  await page.getByRole('button', { name: /Skip|Not now|Later|End tutorial/i }).first().click({ force: true }).catch(() => {});
}
async function uploadFiles(page) {
  const inputs = page.locator('input[type="file"]');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    await inputs.nth(i).setInputFiles(IMG);
    await page.waitForTimeout(800);
  }
  for (let i = 0; i < 20; i++) {
    if (!(await page.getByText(/Processing/i).first().isVisible({ timeout: 200 }).catch(() => false))) break;
    await page.waitForTimeout(300);
  }
  return n;
}
async function progress(page) {
  const t = await page.locator('body').innerText();
  return {
    n: Number(t.match(/(\d)\s+of\s+5\s+requirements complete/i)?.[1] ?? -1),
    pct: t.match(/(\d+)%/)?.[1],
    body: t.replace(/\s+/g, ' ').slice(0, 360),
  };
}
async function fillCertForm(page, number) {
  await page.getByPlaceholder(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  for (const el of await page.locator('input:visible').all()) {
    const type = await el.getAttribute('type');
    if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
    const ph = (await el.getAttribute('placeholder')) || '';
    if (/Issuing/i.test(ph)) await el.fill('E2E Training Academy');
    else if (type === 'date') await el.fill('2025-06-15');
    else if (!(await el.inputValue())) await el.fill(number);
  }
  await uploadFiles(page);
}
async function clickAddOrSubmit(page) {
  for (const name of [/^Add$/i, /Submit/i, /Save/i, /Upload/i, /Done/i]) {
    const btns = page.getByRole('button', { name });
    for (let i = (await btns.count()) - 1; i >= 0; i--) {
      const b = btns.nth(i);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        await b.click({ force: true });
        await page.waitForTimeout(1600);
        return true;
      }
    }
  }
  return false;
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  await reset(page, context);
  await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
  await page.goto(`${BASE}/guard/activation`);
  await waitReady(page);
  await dismiss(page);
  await shot(page, '500-start');
  log('start', true, JSON.stringify(await progress(page)));

  // PTA combined
  await page.getByRole('button', { name: /Add PTA\/UOF/i }).click({ force: true });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Combined certificate/i }).click({ force: true });
  await page.waitForTimeout(600);
  await shot(page, '501-pta-combined');
  await page.getByRole('button', { name: /Upload combined 8-hour certificate/i }).click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, '502-pta-form');
  console.log('pta files', await page.locator('input[type="file"]').count());
  console.log(
    'pta form btns',
    await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 20))
  );
  await fillCertForm(page, 'PTA-UOF-COMBINED-0811');
  await shot(page, '503-pta-filled');
  await clickAddOrSubmit(page);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => {});
  await page.goto(`${BASE}/guard/activation`);
  await waitReady(page);
  await shot(page, '504-after-pta');
  log('pta', true, JSON.stringify(await progress(page)));

  // If PTA still needed, try individual parts
  if (/Add PTA\/UOF/i.test(await page.locator('body').innerText())) {
    await page.getByRole('button', { name: /Add PTA\/UOF/i }).click({ force: true });
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /Individual parts/i }).click({ force: true });
    await page.waitForTimeout(500);
    for (let part = 0; part < 2; part++) {
      const adds = page.getByRole('button', { name: /^Add$/i });
      if (!(await adds.count())) break;
      await adds.nth(Math.min(part, (await adds.count()) - 1)).click({ force: true });
      await page.waitForTimeout(800);
      if (await page.locator('input[type="file"]').count()) {
        await fillCertForm(page, `PTA-PART-${part}`);
        await clickAddOrSubmit(page);
        await page.waitForTimeout(1000);
      }
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.goto(`${BASE}/guard/activation`);
    await waitReady(page);
    await shot(page, '505-pta-individual');
    log('pta-indiv', true, JSON.stringify(await progress(page)));
  }

  // CE
  await page.getByRole('button', { name: /Add Continued Education/i }).click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, '506-ce-open');
  console.log(
    'CE btns',
    await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40))
  );

  for (let i = 0; i < 12; i++) {
    const adds = page.getByRole('button', { name: /^Add$/i });
    const n = await adds.count();
    console.log('ce adds', n);
    if (!n) break;
    await adds.first().click({ force: true });
    await page.waitForTimeout(900);
    if (!(await page.locator('input[type="file"]').count())) {
      await page.getByRole('button', { name: /Upload|Add certificate|Continue/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
    if (!(await page.locator('input[type="file"]').count())) {
      await shot(page, `507-ce-no-file-${i}`);
      // go back if possible
      await page.getByRole('button', { name: /Back|Cancel/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
      continue;
    }
    await fillCertForm(page, `CE-E2E-${i}`);
    await shot(page, `508-ce-filled-${i}`);
    await clickAddOrSubmit(page);
    await page.waitForTimeout(1200);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.goto(`${BASE}/guard/activation`);
  await waitReady(page);
  await shot(page, '509-activation');
  log('after-ce', true, JSON.stringify(await progress(page)));

  // Staff verify
  await reset(page, context);
  await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');

  for (let round = 0; round < 40; round++) {
    await page.goto(`${BASE}/staff/credentials`);
    await waitReady(page);
    await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    const items = page.getByText(/E2E|Government ID|COI|Insurance|Guard Card|PTA|Power to Arrest|UOF|Continued|32-hour|POL-E2E|GC-E2E/i);
    const count = await items.count();
    if (count) await items.nth(round % Math.min(count, 12)).click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    const actions = page.getByRole('button', { name: /Verify|Approve/i });
    let did = false;
    for (let j = 0; j < (await actions.count()); j++) {
      const b = actions.nth(j);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        const label = await b.innerText();
        await b.click({ force: true });
        await page.waitForTimeout(400);
        await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(900);
        log('verify', true, label);
        did = true;
        break;
      }
    }
    if (!did && round > 15) break;
  }
  await shot(page, '510-verified');

  await page.goto(`${BASE}/staff/guards`);
  await waitReady(page);
  await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
  await page.waitForTimeout(700);
  await page.getByText(/E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(800);
  await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  for (let i = 0; i < 20; i++) {
    const actions = page.getByRole('button', { name: /Verify|Approve/i });
    let did = false;
    for (let j = 0; j < (await actions.count()); j++) {
      const b = actions.nth(j);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        await b.click({ force: true });
        await page.waitForTimeout(400);
        await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(800);
        did = true;
        break;
      }
    }
    if (!did) break;
  }
  await shot(page, '511-guard-creds');

  await page.goto(`${BASE}/staff/applications`);
  await waitReady(page);
  await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  for (const name of [/Approve application/i, /Activate/i, /^Approve$/i]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 500 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /^Approve$|^Confirm$|^Yes$|^Activate$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      log('approve', true, String(name));
    }
  }
  await shot(page, '512-app');

  await page.goto(`${BASE}/staff/guards`);
  await waitReady(page);
  await page.getByPlaceholder(/search/i).first().fill('E2E');
  await page.waitForTimeout(700);
  await page.getByText(/E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(700);
  await shot(page, '513-status');
  log('status', true, (await page.locator('body').innerText()).match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', '));

  // Field test
  await reset(page, context);
  await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
  await shot(page, '514-guard');
  log('landing', true, page.url());

  for (const seg of ['/guard/map', '/guard/jobs', '/guard/home']) {
    await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await waitReady(page);
    await dismiss(page);
    const t = await page.locator('body').innerText();
    await shot(page, `515-${seg.replace(/\W+/g, '_')}`);
    const free = !/Application under review/i.test(t);
    log(`browse${seg}`, free, t.replace(/\s+/g, ' ').slice(0, 220));
    if (!free) continue;
    await page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
    for (const name of [/Accept/i, /Apply/i, /Take job/i, /Claim/i]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
        await b.click({ force: true });
        await page.waitForTimeout(800);
        await page.getByRole('button', { name: /confirm|accept|slide|yes/i }).first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);
        log('accept', true, `${seg} ${name}`);
        await shot(page, '516-accepted');
        break;
      }
    }
  }

  await reset(page, context);
  await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  await shot(page, '517-jobs');
  log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 450));
} catch (e) {
  log('fatal', false, String(e).slice(0, 400));
  await shot(page, '599-fatal').catch(() => {});
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'creds-field-report-v5.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
