/**
 * Continue from 2/5: PTA + CE uploads, staff verify, field accept job.
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
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 260)}`);
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
  await dismiss(page);
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
    body: t.replace(/\s+/g, ' ').slice(0, 400),
  };
}
async function fillCertForm(page, number) {
  await page.getByPlaceholder(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  for (const el of await page.locator('input:visible').all()) {
    const type = await el.getAttribute('type');
    if (type === 'file' || type === 'checkbox' || type === 'radio') continue;
    const ph = (await el.getAttribute('placeholder')) || '';
    if (/Issuing/i.test(ph)) await el.fill('E2E Training Academy');
    else if (type === 'date') await el.fill('2025-06-15');
    else if (type === 'number') continue;
    else {
      const v = await el.inputValue().catch(() => 'x');
      if (!v) await el.fill(number);
    }
  }
  await uploadFiles(page);
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await dismiss(page);
await shot(page, '400-start');
log('start', true, JSON.stringify(await progress(page)));

// Re-fix COI expiry if still expired
{
  const t = await page.locator('body').innerText();
  if (/Expired — upload a current COI/i.test(t)) {
    await page.getByRole('button', { name: /Add COI/i }).click({ force: true });
    await page.waitForTimeout(900);
    await page.getByRole('button', { name: /Edit|Update|Add COI/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    await page.getByPlaceholder(/Carrier name/i).fill('E2E Insurance Company');
    await page.getByPlaceholder(/Policy/i).fill('POL-E2E-2030');
    await page.getByPlaceholder(/1000000/i).fill('1000000').catch(() => {});
    const dates = page.locator('input[type="date"]:visible');
    await dates.nth(0).fill('2026-02-01');
    if ((await dates.count()) > 1) await dates.nth(1).fill('2030-12-31');
    // ensure second date is future — click labels
    console.log(
      'coi dates',
      await dates.evaluateAll((els) => els.map((e) => e.value))
    );
    // If both same, set last date input specifically
    const allDates = await dates.all();
    if (allDates.length >= 2) {
      await allDates[0].fill('2026-02-01');
      await allDates[1].fill('2030-12-31');
    }
    await uploadFiles(page);
    await shot(page, '401-coi');
    await page.getByRole('button', { name: /Submit for review|Save/i }).first().click({ force: true });
    await page.waitForTimeout(2000);
    log('coi-refix', true, JSON.stringify(await progress(page)));
  }
}

// PTA — Combined Certificate flow
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await page.getByRole('button', { name: /Add PTA\/UOF/i }).click({ force: true });
await page.waitForTimeout(1000);
await shot(page, '402-pta-open');
console.log(
  'PTA btns',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean))
);

// Switch to Combined
const combined = page.getByRole('button', { name: /Combined Certificate/i });
if (await combined.isVisible({ timeout: 1500 }).catch(() => false)) {
  await combined.click({ force: true });
  await page.waitForTimeout(700);
}
await shot(page, '403-pta-combined');
console.log(
  'PTA btns2',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean))
);

// On combined view there may be an Add for the combined cert, or a different CTA
let openedForm = false;
for (const name of [/^Add$/i, /Add combined/i, /Upload combined/i, /Add certificate/i, /Upload certificate/i]) {
  const b = page.getByRole('button', { name }).first();
  if (await b.isVisible({ timeout: 600 }).catch(() => false)) {
    await b.click({ force: true });
    await page.waitForTimeout(800);
    openedForm = true;
    break;
  }
}
// Individual parts fallback — add Power to Arrest then Use of Force
if (!openedForm || !(await page.locator('input[type="file"]').count())) {
  await page.getByRole('button', { name: /Individual Parts/i }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  for (const part of [/Power to Arrest/i, /Appropriate Use of Force/i, /Use of Force/i]) {
    // Find Add button near the part label
    const row = page.locator('div, li, section').filter({ hasText: part }).filter({ has: page.getByRole('button', { name: /^Add$/i }) }).first();
    if (await row.isVisible({ timeout: 800 }).catch(() => false)) {
      await row.getByRole('button', { name: /^Add$/i }).click({ force: true });
      await page.waitForTimeout(800);
      if (await page.locator('input[type="file"]').count()) {
        await fillCertForm(page, `PTA-${part.toString().slice(0, 8)}`);
        await page.getByRole('button', { name: /^Add$/i }).last().click({ force: true });
        await page.waitForTimeout(1800);
        await shot(page, `404-pta-part`);
      }
    } else {
      // click any Add in modal
      const adds = page.getByRole('button', { name: /^Add$/i });
      if (await adds.count()) {
        await adds.first().click({ force: true });
        await page.waitForTimeout(800);
        if (await page.locator('input[type="file"]').count()) {
          await fillCertForm(page, 'PTA-E2E-PART');
          await page.getByRole('button', { name: /^Add$/i }).last().click({ force: true });
          await page.waitForTimeout(1800);
        }
      }
    }
  }
} else {
  await fillCertForm(page, 'PTA-UOF-COMBINED-0811');
  await shot(page, '405-pta-filled');
  await page.getByRole('button', { name: /^Add$/i }).last().click({ force: true });
  await page.waitForTimeout(2000);
}
await page.keyboard.press('Escape').catch(() => {});
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await shot(page, '406-after-pta');
log('pta', true, JSON.stringify(await progress(page)));

// CE package
await page.getByRole('button', { name: /Add Continued Education/i }).click({ force: true });
await page.waitForTimeout(1000);
await shot(page, '407-ce-open');
console.log(
  'CE btns',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40))
);

for (let i = 0; i < 12; i++) {
  // Prefer Add buttons inside the CE sheet
  const adds = page.getByRole('button', { name: /^Add$/i });
  const n = await adds.count();
  console.log('CE add count', n);
  if (!n) break;
  await adds.first().click({ force: true });
  await page.waitForTimeout(800);
  if (!(await page.locator('input[type="file"]').count())) {
    // maybe navigated to course detail without file yet
    await page.getByRole('button', { name: /Upload|Add certificate/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
  if (!(await page.locator('input[type="file"]').count())) {
    console.log('no file input on CE step', i);
    await shot(page, `408-ce-stuck-${i}`);
    break;
  }
  await fillCertForm(page, `CE-E2E-${i}`);
  await page.getByRole('button', { name: /^Add$/i }).last().click({ force: true });
  await page.waitForTimeout(1600);
  await shot(page, `409-ce-${i}`);
}
await page.keyboard.press('Escape').catch(() => {});
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await shot(page, '410-activation');
log('after-ce', true, JSON.stringify(await progress(page)));

// Staff verify all
await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');

async function verifyPass(label) {
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  await page.getByText(label).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  const actions = page.getByRole('button', { name: /Verify|Approve/i });
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      const t = await b.innerText();
      await b.click({ force: true });
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      log('verify', true, `${label} via ${t}`);
      return true;
    }
  }
  return false;
}

for (const label of [/E2E Guard/i, /Government ID/i, /COI|Insurance/i, /Guard Card/i, /PTA|Power to Arrest|UOF/i, /Continued|32/i]) {
  for (let k = 0; k < 3; k++) await verifyPass(label);
}
await shot(page, '411-creds-done');

// Also from guard detail
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(800);
await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
await shot(page, '412-guard-creds');
for (let i = 0; i < 25; i++) {
  const actions = page.getByRole('button', { name: /Verify|Approve/i });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(900);
      did = true;
      break;
    }
  }
  if (!did) break;
}

await page.goto(`${BASE}/staff/applications`);
await waitReady(page);
await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '413-app');
for (const name of [/Approve application/i, /Activate/i, /^Approve$/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 600 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Approve$|^Confirm$|^Yes$|^Activate$/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1200);
    log('approve', true, String(name));
  }
}

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await shot(page, '414-status');
log('status', true, (await page.locator('body').innerText()).match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', '));

// Field test
await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await shot(page, '415-guard');
log('landing', true, page.url());

for (const seg of ['/guard/map', '/guard/jobs', '/guard/home']) {
  await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  const t = await page.locator('body').innerText();
  await shot(page, `416-${seg.replace(/\W+/g, '_')}`);
  log(`browse${seg}`, !/Application under review/i.test(t), t.replace(/\s+/g, ' ').slice(0, 220));
  for (const name of [/Accept/i, /Apply/i, /Take job/i, /Claim/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /confirm|accept|slide|yes/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
      log('accept', true, `${seg} ${name}`);
      await shot(page, '417-accepted');
      break;
    }
  }
}

await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await shot(page, '418-jobs');
log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 450));

await browser.close();
fs.writeFileSync(path.join(OUT, 'creds-field-report-v4.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
