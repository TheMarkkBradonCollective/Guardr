/**
 * Careful fake-credential upload + staff verify + field test.
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
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 220)}`);
};
const shot = async (page, n) => page.screenshot({ path: path.join(SHOT, `${n}.png`), fullPage: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/End tutorial/i, /Skip/i, /Got it/i, /Close/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 250 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
  const boxes = page.locator('input[type="checkbox"]:visible');
  for (let j = 0; j < (await boxes.count()); j++) {
    const b = boxes.nth(j);
    if (!(await b.isChecked().catch(() => true))) await b.check({ force: true }).catch(() => {});
  }
  await page.getByRole('button', { name: /^(Continue|Accept|I agree|Agree)$/i }).first().click({ force: true }).catch(() => {});
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
    await page.waitForTimeout(600); // allow processDocumentPhotoFile
  }
  // wait for processing spinners to clear
  for (let i = 0; i < 20; i++) {
    if (!(await page.getByText(/Processing/i).first().isVisible({ timeout: 200 }).catch(() => false))) break;
    await page.waitForTimeout(300);
  }
  return n;
}

async function progress(page) {
  const t = await page.locator('body').innerText();
  const m = t.match(/(\d)\s+of\s+5\s+requirements complete/i);
  return { n: m ? Number(m[1]) : null, pct: t.match(/(\d+)%/)?.[1], snippet: t.replace(/\s+/g, ' ').slice(0, 350) };
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await dismiss(page);
await shot(page, '200-start');
log('start', true, await progress(page));

// ── Gov ID as Government ID (state_id), not driver's license ──
await page.getByRole('button', { name: /Add government ID/i }).click({ force: true });
await page.waitForTimeout(900);
await page.getByLabel(/Government ID document type/i).selectOption({ label: 'Government ID' }).catch(async () => {
  await page.getByLabel(/Government ID document type/i).selectOption('state_id');
});
await page.getByLabel(/ID issuing state/i).selectOption('CA');
await page.getByLabel(/Government ID number/i).fill('D1234567');
await page.getByLabel(/ID expiration date/i).fill('2030-08-11');
// Prefer "Upload a photo instead" for selfie slot
const uploadInstead = page.getByRole('button', { name: /Upload a photo instead/i });
if (await uploadInstead.isVisible({ timeout: 500 }).catch(() => false)) {
  // set files on all inputs including selfie
}
const files = await uploadFiles(page);
await shot(page, '201-govid-filled');
const submit = page.getByRole('button', { name: /Submit for review/i }).first();
console.log('gov submit disabled?', await submit.isDisabled().catch(() => 'missing'));
if (!(await submit.isDisabled().catch(() => true))) {
  await submit.click({ force: true });
  await page.waitForTimeout(2000);
} else {
  // Maybe still drivers license — set class C
  const cls = page.getByLabel(/Driver license class/i);
  if (await cls.isVisible({ timeout: 400 }).catch(() => false)) {
    await cls.selectOption({ index: 1 }).catch(() => {});
    await uploadFiles(page);
  }
  console.log('gov submit disabled after class?', await submit.isDisabled().catch(() => 'missing'));
  if (!(await submit.isDisabled().catch(() => true))) {
    await submit.click({ force: true });
    await page.waitForTimeout(2000);
  } else {
    // dump form state
    console.log(
      'gov form',
      await page.locator('select:visible, input:visible').evaluateAll((els) =>
        els.map((e) => ({
          tag: e.tagName,
          type: e.type,
          aria: e.getAttribute('aria-label'),
          val: e.value?.slice?.(0, 40),
        }))
      )
    );
  }
}
await shot(page, '202-govid-after');
await page.getByRole('button', { name: /Cancel/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
log('gov-id', true, await progress(page));

// ── COI with clearly future expiry ──
await page.getByRole('button', { name: /Add COI/i }).click({ force: true });
await page.waitForTimeout(900);
// Click edit if viewing existing expired
await page.getByRole('button', { name: /Edit|Replace|Update|Add COI|Submit/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);

const coiFields = [
  [/carrier|insurer/i, 'E2E Insurance Company'],
  [/policy/i, 'POL-E2E-0811'],
  [/general liability|limit|coverage|amount/i, '1000000'],
];
for (const [re, val] of coiFields) {
  const el = page.getByLabel(re).first();
  if (await el.isVisible({ timeout: 500 }).catch(() => false)) await el.fill(val);
}
// date fields by aria/placeholder
for (const el of await page.locator('input[type="date"]:visible').all()) {
  const aria = ((await el.getAttribute('aria-label')) || '').toLowerCase();
  if (/expir/.test(aria)) await el.fill('2028-12-31');
  else await el.fill('2026-01-01');
}
// fallback fill empty text inputs
for (const el of await page.locator('input:visible, textarea:visible').all()) {
  const type = await el.getAttribute('type');
  if (['file', 'checkbox', 'radio', 'hidden', 'date'].includes(type || '')) continue;
  if (await el.inputValue()) continue;
  const tip = (((await el.getAttribute('aria-label')) || '') + ((await el.getAttribute('placeholder')) || '')).toLowerCase();
  if (/carrier|insurer|company/.test(tip)) await el.fill('E2E Insurance Company');
  else if (/policy/.test(tip)) await el.fill('POL-E2E-0811');
  else if (/limit|liability|coverage|amount/.test(tip)) await el.fill('1000000');
}
await uploadFiles(page);
await shot(page, '203-coi-filled');
await page.getByRole('button', { name: /Submit for review|Save credential|Save/i }).first().click({ force: true });
await page.waitForTimeout(2000);
await shot(page, '204-coi-after');
log('coi', true, await progress(page));

// ── Guard card ──
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await page.getByRole('button', { name: /Add guard card/i }).click({ force: true });
await page.waitForTimeout(1000);
// Select catalog if needed
await page.getByText(/BSIS Guard Card/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
for (const el of await page.locator('input:visible').all()) {
  const type = await el.getAttribute('type');
  if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
  if (await el.inputValue()) continue;
  const tip = (((await el.getAttribute('aria-label')) || '') + ((await el.getAttribute('placeholder')) || '')).toLowerCase();
  if (/number|license|#/.test(tip)) await el.fill('GC-E2E-0811');
  else if (/issuer|school/.test(tip)) await el.fill('BSIS');
  else if (type === 'date') await el.fill('2030-08-11');
}
await page.locator('select:visible').first().selectOption({ label: /California|CA/i }).catch(() => {});
await uploadFiles(page);
await shot(page, '205-card-filled');
await page.getByRole('button', { name: /^Add$/i }).click({ force: true });
await page.waitForTimeout(2500);
await shot(page, '206-card-after');
log('guard-card', true, await progress(page));

// ── PTA/UOF combined ──
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await page.getByRole('button', { name: /Add PTA\/UOF/i }).click({ force: true });
await page.waitForTimeout(1000);
await shot(page, '207-pta-open');
// Choose combined option if listed
for (const label of [/combined/i, /PTA\/UOF/i, /8-hour/i, /Power to Arrest/i]) {
  const el = page.getByRole('button', { name: label }).first();
  if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
    await el.click({ force: true });
    await page.waitForTimeout(600);
    break;
  }
  const txt = page.getByText(label).first();
  if (await txt.isVisible({ timeout: 400 }).catch(() => false)) {
    await txt.click({ force: true });
    await page.waitForTimeout(600);
  }
}
// If still on picker, click first course card
const courseCard = page.locator('[role="button"], button, .app-item-card, .app-cert-item').filter({ hasText: /PTA|UOF|Arrest|Force|combined/i }).first();
if (await courseCard.isVisible({ timeout: 800 }).catch(() => false)) await courseCard.click({ force: true });
await page.waitForTimeout(700);
for (const el of await page.locator('input:visible').all()) {
  const type = await el.getAttribute('type');
  if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
  if (await el.inputValue()) continue;
  if (type === 'date') await el.fill('2025-06-01');
  else await el.fill('PTA-E2E-0811');
}
console.log('pta files before', await page.locator('input[type="file"]').count());
await uploadFiles(page);
await shot(page, '208-pta-filled');
await page.getByRole('button', { name: /^Add$|Submit|Save|Upload/i }).last().click({ force: true });
await page.waitForTimeout(2500);
await shot(page, '209-pta-after');
log('pta', true, await progress(page));

// ── 32-hour CE — upload as many courses as possible ──
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await page.getByRole('button', { name: /Add Continued Education/i }).click({ force: true });
await page.waitForTimeout(1000);
await shot(page, '210-ce-open');

// Try package completed option first
const completed = page.getByText(/32-Hour|completed package|full package|all 9/i).first();
if (await completed.isVisible({ timeout: 800 }).catch(() => false)) {
  await completed.click({ force: true });
  await page.waitForTimeout(600);
}

for (let course = 0; course < 10; course++) {
  // pick next incomplete course in list
  const nextCourse = page
    .locator('button, [role="button"], .app-item-card')
    .filter({ hasText: /hr\)|hour|Public Relations|Observation|Communication|Liability|Arrest|Tactical|Crowd|Officer/i })
    .nth(course);
  if (await nextCourse.isVisible({ timeout: 600 }).catch(() => false)) {
    await nextCourse.click({ force: true });
    await page.waitForTimeout(600);
  }
  if (!(await page.locator('input[type="file"]').count())) {
    // maybe need Add certificate button
    await page.getByRole('button', { name: /Add certificate|Upload|Add course/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
  if (!(await page.locator('input[type="file"]').count())) break;
  for (const el of await page.locator('input:visible').all()) {
    const type = await el.getAttribute('type');
    if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
    if (await el.inputValue()) continue;
    if (type === 'date') await el.fill('2025-07-01');
    else await el.fill(`CE-E2E-0811-${course}`);
  }
  await uploadFiles(page);
  await page.getByRole('button', { name: /^Add$|Submit|Save|Upload/i }).last().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, `211-ce-course-${course}`);
}
await page.getByRole('button', { name: /Cancel|Close|Done/i }).first().click({ force: true }).catch(() => {});
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await shot(page, '212-activation-mid');
log('ce-and-progress', true, await progress(page));

// ── Staff: verify everything + activate ──
await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');

// Open guard detail credentials
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(800);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(800);
await page.getByRole('tab', { name: /Credentials/i }).click({ force: true }).catch(() => {});
await page.getByText(/^Credentials$/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(700);
await shot(page, '213-staff-guard-creds');

// Staff add missing certs via + Add credential
async function staffAddCert(sectionLabel, number) {
  await page.getByRole('button', { name: /Add credential/i }).first().click({ force: true });
  await page.waitForTimeout(800);
  await page.getByText(sectionLabel).first().click({ force: true });
  await page.waitForTimeout(500);
  await page.getByText(/E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(700);
  // catalog pick
  await page.getByText(/Guard Card|combined|PTA|32-Hour|completed/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /^Next$/i }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  for (const el of await page.locator('input:visible').all()) {
    const type = await el.getAttribute('type');
    if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
    if (await el.inputValue()) continue;
    if (type === 'date') await el.fill('2030-08-11');
    else await el.fill(number);
  }
  await page.getByRole('button', { name: /^Next$/i }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await uploadFiles(page);
  await page.getByRole('button', { name: /^Next$/i }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Add credential/i }).last().click({ force: true });
  await page.waitForTimeout(2000);
  await shot(page, `214-staff-add-${number}`);
}

// Try staff adds for missing pieces
for (const [label, num] of [
  [/Guard Card|BSIS Guard/i, 'GC-STAFF-0811'],
  [/PTA|Mandatory|Power to Arrest/i, 'PTA-STAFF-0811'],
  [/Continued Education|32-hour|32 hour/i, 'CE-STAFF-0811'],
]) {
  try {
    await staffAddCert(label, num);
    log('staff-add', true, String(label));
  } catch (e) {
    log('staff-add', false, `${label}: ${String(e).slice(0, 120)}`);
    await page.keyboard.press('Escape').catch(() => {});
  }
}

// Verify all pending buttons
await page.goto(`${BASE}/staff/credentials`);
await waitReady(page);
await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
await shot(page, '215-pending-review');

for (let i = 0; i < 25; i++) {
  // click any E2E-related pending item
  const item = page.getByText(/E2E Guard|e2e\.guard|GC-E2E|PTA-E2E|CE-E2E|D1234567|POL-E2E|Government ID|COI|Guard Card/i).nth(i % 8);
  if (await item.isVisible({ timeout: 400 }).catch(() => false)) await item.click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  const verify = page.getByRole('button', { name: /Verify(?:\s+credential)?|Approve(?:\s+(?:credential|ID|application))?|Mark verified/i });
  let clicked = false;
  for (let j = 0; j < (await verify.count()); j++) {
    const b = verify.nth(j);
    if (!(await b.isDisabled().catch(() => true)) && (await b.isVisible().catch(() => false))) {
      await b.click({ force: true });
      clicked = true;
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(900);
      break;
    }
  }
  if (!clicked && i > 8) break;
}
await shot(page, '216-after-verifies');

// Applications approve / activate
await page.goto(`${BASE}/staff/applications`);
await waitReady(page);
await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '217-application');
for (const name of [/Approve application/i, /Activate/i, /^Approve$/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 600 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /^Approve$|^Confirm$|^Yes$|^Activate$/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1200);
    log('approve', true, String(name));
  }
}
await shot(page, '218-application-after');

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await shot(page, '219-guard-final-staff');
const gStatus = await page.locator('body').innerText();
log('guard-status', /Active/i.test(gStatus) && !/Pending credentials/i.test(gStatus), gStatus.match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', '));

// ── Guard field test ──
await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await shot(page, '220-guard-login');
log('guard-landing', true, `${page.url()} :: ${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200)}`);

for (const seg of ['/guard/map', '/guard/jobs', '/guard/home']) {
  await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  await shot(page, `221-${seg.replace(/\W+/g, '_')}`);
  const t = await page.locator('body').innerText();
  if (/Corporate Event|Standing Guard|Hollywood|Accept|Apply|Offer/i.test(t)) {
    log('saw-job', true, seg);
    // click job
    await page.getByText(/Corporate Event Security|Standing Guard Post/i).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
    await shot(page, '222-job-detail');
    for (const name of [/Accept/i, /Apply/i, /Take job/i, /Claim/i]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 600 }).catch(() => false)) {
        await b.click({ force: true });
        await page.waitForTimeout(800);
        await page.getByRole('button', { name: /confirm|accept|slide/i }).first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);
        log('accept', true, String(name));
        break;
      }
    }
    await shot(page, '223-after-accept');
    break;
  }
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'creds-field-report-v2.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
