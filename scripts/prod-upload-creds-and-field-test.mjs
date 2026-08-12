/**
 * Upload fake activation credentials for E2E Guard, staff-verify/approve,
 * then complete field test against open jobs.
 *
 * Run: node scripts/prod-upload-creds-and-field-test.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.GUARDR_BASE_URL || 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
const IMG = '/home/ubuntu/Downloads/e2e-fake-credential.png';
fs.mkdirSync(SHOT, { recursive: true });

const report = { steps: [] };
const log = (section, ok, detail) => {
  report.steps.push({ section, ok, detail, at: new Date().toISOString() });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${section} | ${String(detail).slice(0, 240)}`);
};
const shot = async (page, name) => {
  const f = path.join(SHOT, `${name}.png`);
  await page.screenshot({ path: f, fullPage: true });
  return f;
};

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function dismiss(page) {
  for (const name of [/End tutorial/i, /Skip tour/i, /Skip for now/i, /Skip/i, /Got it/i, /Close/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 300 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
  const boxes = page.locator('input[type="checkbox"]:visible');
  for (let j = 0; j < (await boxes.count()); j++) {
    const b = boxes.nth(j);
    if (!(await b.isChecked().catch(() => true))) await b.check({ force: true }).catch(() => {});
  }
  const cont = page.getByRole('button', { name: /^(Continue|Accept|I agree|Agree)$/i }).first();
  if (await cont.isVisible({ timeout: 300 }).catch(() => false)) await cont.click({ force: true }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
}

async function hardReset(page, context) {
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
  // password change / tour
  await page.getByRole('button', { name: /Skip|Not now|Later|End tutorial/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  await dismiss(page);
}

async function setAllFiles(page) {
  const files = page.locator('input[type="file"]');
  const n = await files.count();
  for (let i = 0; i < n; i++) {
    await files.nth(i).setInputFiles(IMG).catch(() => {});
  }
  return n;
}

async function fillByAria(page, aria, value) {
  const el = page.getByLabel(aria).first();
  if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
    await el.fill(value);
    return true;
  }
  return false;
}

async function selectByAria(page, aria, optionRe) {
  const el = page.getByLabel(aria).first();
  if (!(await el.isVisible({ timeout: 800 }).catch(() => false))) return false;
  const tag = await el.evaluate((e) => e.tagName);
  if (tag === 'SELECT') {
    const value = await el.locator('option').evaluateAll((opts, reSrc) => {
      const re = new RegExp(reSrc, 'i');
      const hit = opts.find((o) => re.test(o.textContent || '') || re.test(o.value));
      return hit?.value ?? null;
    }, optionRe.source);
    if (value) {
      await el.selectOption(value);
      return true;
    }
  } else {
    await el.click({ force: true });
    await page.getByText(optionRe).first().click({ force: true }).catch(() => {});
    return true;
  }
  return false;
}

async function clickSubmit(page) {
  const btn = page
    .getByRole('button', { name: /Submit for review|Save|Add credential|Upload|Submit|Add COI|Add guard card|Done/i })
    .last();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click({ force: true });
    await page.waitForTimeout(1800);
    return true;
  }
  return false;
}

async function uploadGovId(page) {
  await page.getByRole('button', { name: /Add government ID/i }).click({ force: true });
  await page.waitForTimeout(900);
  await selectByAria(page, /Government ID document type/i, /Driver|license|State ID|ID card/i);
  await selectByAria(page, /ID issuing state/i, /^CA$|California/);
  await fillByAria(page, /Government ID number/i, 'D1234567');
  await fillByAria(page, /ID expiration date/i, '2030-08-11');
  const n = await setAllFiles(page);
  // Also click Upload photo / Take selfie helpers if needed
  const uploadBtns = page.getByRole('button', { name: /Upload photo|Upload a photo instead/i });
  for (let i = 0; i < (await uploadBtns.count()); i++) {
    // files already set via input[type=file]
  }
  await shot(page, '110-gov-id-filled');
  const ok = await clickSubmit(page);
  await shot(page, '111-gov-id-after');
  return { ok, files: n };
}

async function uploadCoi(page) {
  await page.getByRole('button', { name: /Add COI/i }).click({ force: true });
  await page.waitForTimeout(900);
  // Common COI fields
  for (const [aria, val] of [
    [/carrier|insurer|company/i, 'E2E Insurance Co'],
    [/policy/i, 'COI-E2E-0811'],
    [/limit|coverage|amount/i, '1000000'],
    [/effective/i, '2026-01-01'],
    [/expir/i, '2027-12-31'],
  ]) {
    const el = page.getByLabel(aria).first();
    if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
      const type = await el.getAttribute('type');
      if (type === 'date' && /expir/i.test(aria.source)) await el.fill('2027-12-31');
      else if (type === 'date') await el.fill('2026-01-01');
      else await el.fill(val);
    }
  }
  // placeholders fallback
  for (const el of await page.locator('input:visible, textarea:visible').all()) {
    const type = await el.getAttribute('type');
    if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
    const val = await el.inputValue().catch(() => '');
    if (val) continue;
    const tip = (
      ((await el.getAttribute('placeholder')) || '') +
      ' ' +
      ((await el.getAttribute('aria-label')) || '')
    ).toLowerCase();
    if (/carrier|insurer|company/.test(tip)) await el.fill('E2E Insurance Co');
    else if (/policy/.test(tip)) await el.fill('COI-E2E-0811');
    else if (/limit|coverage|amount|liability/.test(tip)) await el.fill('1000000');
    else if (type === 'date' && /expir/.test(tip)) await el.fill('2027-12-31');
    else if (type === 'date') await el.fill('2026-01-01');
  }
  const n = await setAllFiles(page);
  await shot(page, '112-coi-filled');
  const ok = await clickSubmit(page);
  await shot(page, '113-coi-after');
  return { ok, files: n };
}

async function uploadCatalogCert(page, openButtonName, shotPrefix, number) {
  await page.getByRole('button', { name: openButtonName }).click({ force: true });
  await page.waitForTimeout(1000);

  // Pick first catalog option / combined certificate if shown
  const option = page
    .getByRole('button', {
      name: /combined|PTA\/UOF|Power to Arrest|Guard Card|32-hour|BSIS|certificate|course/i,
    })
    .first();
  if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
    await option.click({ force: true });
    await page.waitForTimeout(500);
  }
  // Or radio/list item
  const listItem = page.getByText(/combined 8-hour|bsis-pta-uof|Guard Card|32-Hour|completed/i).first();
  if (await listItem.isVisible({ timeout: 600 }).catch(() => false)) {
    await listItem.click({ force: true }).catch(() => {});
  }

  for (const el of await page.locator('input:visible, textarea:visible, select:visible').all()) {
    const tag = await el.evaluate((e) => e.tagName);
    const type = await el.getAttribute('type');
    if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
    if (tag === 'SELECT') {
      const opts = await el.locator('option').evaluateAll((os) =>
        os.map((o) => ({ v: o.value, t: o.textContent || '' }))
      );
      const hit =
        opts.find((o) => /combined|pta|guard card|32|completed|CA|California/i.test(o.t)) ||
        opts.find((o) => o.v && o.v !== '');
      if (hit) await el.selectOption(hit.v).catch(() => {});
      continue;
    }
    const val = await el.inputValue().catch(() => '');
    if (val) continue;
    const tip = (
      ((await el.getAttribute('placeholder')) || '') +
      ' ' +
      ((await el.getAttribute('aria-label')) || '')
    ).toLowerCase();
    if (/number|license|#|cert/.test(tip)) await el.fill(number);
    else if (/issuer|school|provider/.test(tip)) await el.fill('E2E Training Academy');
    else if (type === 'date' || /expir|issue|date/.test(tip)) await el.fill('2030-08-11').catch(() => {});
    else if (/name|title/.test(tip)) await el.fill('E2E Credential');
  }

  const n = await setAllFiles(page);
  await shot(page, `${shotPrefix}-filled`);
  const ok = await clickSubmit(page);
  // 32-hour may need multiple course uploads — keep submitting while Add/Next available
  for (let i = 0; i < 12; i++) {
    const more = page.getByRole('button', { name: /Add (course|certificate)|Next course|Upload next|Continue|Submit/i }).first();
    if (!(await more.isVisible({ timeout: 600 }).catch(() => false))) break;
    await setAllFiles(page);
    for (const el of await page.locator('input:visible').all()) {
      const type = await el.getAttribute('type');
      if (type === 'file' || type === 'checkbox') continue;
      const val = await el.inputValue().catch(() => '');
      if (!val && type !== 'date') await el.fill(`${number}-${i}`).catch(() => {});
      if (!val && type === 'date') await el.fill('2030-08-11').catch(() => {});
    }
    await more.click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
  }
  await shot(page, `${shotPrefix}-after`);
  // Close sheet if still open
  await page.getByRole('button', { name: /Cancel|Close|Done/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  return { ok, files: n };
}

async function activationProgress(page) {
  const text = await page.locator('body').innerText();
  const m = text.match(/(\d)\s+of\s+5\s+requirements complete/i);
  return { complete: m ? Number(m[1]) : null, text: text.slice(0, 500) };
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

// ── 1. Guard uploads fake credentials ─────────────────────────
await hardReset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await dismiss(page);
await shot(page, '109-activation-start');
log('activation-start', true, (await activationProgress(page)).complete ?? 'unknown');

try {
  const gov = await uploadGovId(page);
  log('upload-gov-id', gov.ok, `files=${gov.files}`);
} catch (e) {
  log('upload-gov-id', false, String(e).slice(0, 300));
}
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);

try {
  const coi = await uploadCoi(page);
  log('upload-coi', coi.ok, `files=${coi.files}`);
} catch (e) {
  log('upload-coi', false, String(e).slice(0, 300));
}
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);

try {
  const gc = await uploadCatalogCert(page, /Add guard card/i, '114-guard-card', 'GC-E2E-0811');
  log('upload-guard-card', gc.ok, `files=${gc.files}`);
} catch (e) {
  log('upload-guard-card', false, String(e).slice(0, 300));
}
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);

try {
  const pta = await uploadCatalogCert(page, /Add PTA\/UOF/i, '115-pta', 'PTA-E2E-0811');
  log('upload-pta', pta.ok, `files=${pta.files}`);
} catch (e) {
  log('upload-pta', false, String(e).slice(0, 300));
}
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);

try {
  const ce = await uploadCatalogCert(page, /Add Continued Education/i, '116-ce', 'CE-E2E-0811');
  log('upload-ce', ce.ok, `files=${ce.files}`);
} catch (e) {
  log('upload-ce', false, String(e).slice(0, 300));
}

await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await dismiss(page);
await shot(page, '117-activation-after-uploads');
const progress = await activationProgress(page);
log('activation-progress', (progress.complete ?? 0) > 0, `${progress.complete} of 5 — ${progress.text.replace(/\s+/g, ' ').slice(0, 180)}`);

// ── 2. Staff verify credentials + approve guard ────────────────
await hardReset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');

// Credentials queue
await page.goto(`${BASE}/staff/credentials`);
await waitReady(page);
await dismiss(page);
await shot(page, '118-staff-credentials');

// Open pending review if tab exists
await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await page.getByText(/E2E Guard|e2e\.guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '119-staff-cred-detail');

// Verify / approve any visible credential actions
for (let i = 0; i < 15; i++) {
  const verify = page.getByRole('button', { name: /Verify(?:\s+credential)?|Approve(?:\s+credential)?|Mark verified|Confirm/i }).first();
  if (!(await verify.isVisible({ timeout: 700 }).catch(() => false))) break;
  if (await verify.isDisabled().catch(() => false)) break;
  await verify.click({ force: true });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);
}
await shot(page, '120-staff-creds-verified');

// Also check Applications / Guards for approve
await page.goto(`${BASE}/staff/applications`);
await waitReady(page);
await dismiss(page);
await page.getByText(/E2E Guard|e2e\.guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '121-staff-application');
for (const name of [/Approve application/i, /^Approve$/i, /Activate/i]) {
  const b = page.getByRole('button', { name }).first();
  if (await b.isVisible({ timeout: 700 }).catch(() => false) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
    log('staff-approve-application', true, name.toString());
    break;
  }
}
await shot(page, '122-staff-application-after');

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
const search = page.getByPlaceholder(/search/i).first();
if (await search.isVisible({ timeout: 1000 }).catch(() => false)) {
  await search.fill('E2E Guard');
  await page.waitForTimeout(700);
}
await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '123-guard-status');
const guardBody = await page.locator('body').innerText();
log(
  'guard-staff-status',
  /Active|Approved/i.test(guardBody),
  guardBody.match(/Pending approval|Pending credentials|Approved|Active|verified/gi)?.join(', ') || 'unknown'
);

// Credentials tab on guard — verify remaining
await page.getByRole('button', { name: /^Credentials$/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(700);
await shot(page, '124-guard-creds-tab');
for (let i = 0; i < 20; i++) {
  const verify = page.getByRole('button', { name: /Verify(?:\s+credential)?|Approve/i }).first();
  if (!(await verify.isVisible({ timeout: 500 }).catch(() => false))) break;
  if (await verify.isDisabled().catch(() => false)) {
    // try next match
    const all = page.getByRole('button', { name: /Verify(?:\s+credential)?|Approve/i });
    let clicked = false;
    for (let j = 0; j < (await all.count()); j++) {
      if (!(await all.nth(j).isDisabled().catch(() => true))) {
        await all.nth(j).click({ force: true });
        clicked = true;
        break;
      }
    }
    if (!clicked) break;
  } else {
    await verify.click({ force: true });
  }
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
}
await shot(page, '125-guard-creds-after-verify');
const afterVerify = await page.locator('body').innerText();
log('guard-after-verify', /Active/i.test(afterVerify), afterVerify.match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', ') || 'unknown');

// ── 3. Guard field test against open jobs ──────────────────────
await hardReset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await shot(page, '126-guard-post-login');
const guardHome = await page.locator('body').innerText();
log(
  'guard-post-login',
  !/sign in/i.test(guardHome.slice(0, 120)),
  `${page.url()} — ${guardHome.match(/Application under review|Active|Map|Jobs|Offers|Marketplace/i)?.[0] || guardHome.slice(0, 120)}`
);

// Browse jobs / map
for (const pathSeg of ['/guard/map', '/guard/jobs', '/guard/offers', '/guard/home']) {
  await page.goto(`${BASE}${pathSeg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  await shot(page, `127-${pathSeg.replace(/\W+/g, '_')}`);
}

const browseText = await page.locator('body').innerText();
const sawJob = /Corporate Event Security|Standing Guard Post|Hollywood|Open|offer|Apply|Accept/i.test(browseText);
log('guard-see-jobs', sawJob, browseText.replace(/\s+/g, ' ').slice(0, 300));

// Try accept/apply
for (const name of [/Accept(?:\s+job)?/i, /Apply/i, /Take job/i, /Claim/i, /I'm interested/i]) {
  const b = page.getByRole('button', { name }).first();
  if (await b.isVisible({ timeout: 800 }).catch(() => false)) {
    await b.click({ force: true });
    await page.waitForTimeout(800);
    // slide to confirm / confirm
    const slide = page.getByRole('button', { name: /slide to|confirm|accept/i }).first();
    if (await slide.isVisible({ timeout: 800 }).catch(() => false)) await slide.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1200);
    log('guard-accept-job', true, name.toString());
    break;
  }
}
await shot(page, '128-guard-after-accept');

// Staff jobs check final
await hardReset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await shot(page, '129-staff-jobs-final');
const jobsFinal = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 700);
log('staff-jobs-final', /Open|Accepted|Assigned|Corporate Event|Standing Guard/i.test(jobsFinal), jobsFinal);

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
if (await search.isVisible({ timeout: 800 }).catch(() => false)) {
  await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
  await page.waitForTimeout(700);
}
await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(700);
await shot(page, '130-final-guard-status');
const finalGuard = await page.locator('body').innerText();
log('final-guard-status', true, finalGuard.match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', ') || finalGuard.slice(0, 200));

await browser.close();
fs.writeFileSync(path.join(OUT, 'creds-field-report.json'), JSON.stringify(report, null, 2));
console.log('\n=== REPORT ===');
console.log(JSON.stringify(report, null, 2));
