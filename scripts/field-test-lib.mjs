/**
 * Shared Playwright helpers for site-only field tests.
 * No Supabase REST calls — tests must run entirely through the app UI.
 */
import fs from 'node:fs';
import path from 'node:path';

export const BASE = process.env.GUARDR_BASE_URL || 'https://www.guardr.co';
export const OUT = process.env.GUARDR_FIELD_TEST_OUT || '/opt/cursor/artifacts/field-test';
export const SHOT = path.join(OUT, 'screenshots');
export const FIELD_TEST_PASSWORD = process.env.FIELD_TEST_PASSWORD || '#FieldTest2026';
export const STAFF_EMAIL = process.env.FIELD_TEST_STAFF_EMAIL || 'staff@guardr.co';
export const STAFF_PASSWORD = process.env.FIELD_TEST_STAFF_PASSWORD || '#FieldTestStaff2026';
/** Password assigned when staff@guardr.co provisions accounts in the UI */
export const PROVISIONED_PASSWORD = '#Qwerty12345';
export const STAFF_LADDER_ROLES = ['Support', 'Moderator', 'Administrator', 'Manager', 'Director'];

fs.mkdirSync(SHOT, { recursive: true });

export function makeRunId() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

export function makeTestEmails(runId) {
  const tag = runId.slice(-8);
  const staff = {};
  for (const role of STAFF_LADDER_ROLES) {
    staff[role] = `fieldtest.staff.${role.toLowerCase()}.${tag}@guardr.test`;
  }
  return {
    client: `fieldtest.client.${tag}@guardr.test`,
    guard: `fieldtest.guard.${tag}@guardr.test`,
    staffSignup: `fieldtest.staff.apply.${tag}@guardr.test`,
    staff,
  };
}

export function attachDiagnostics(page, bag) {
  page.on('pageerror', (err) => bag.pageErrors.push(String(err).slice(0, 500)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') bag.consoleErrors.push(msg.text().slice(0, 400));
  });
}

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

/** Paths visited on every viewport after the desktop walkthrough. */
export const VIEWPORT_SWEEP_PATHS = {
  public: ['/'],
  staff: [
    '/staff/overview',
    '/staff/jobs',
    '/staff/applications',
    '/staff/violations',
    '/staff/disputes',
    '/staff/incidents',
    '/staff/payments',
    '/staff/team',
  ],
  client: ['/client/home', '/client/jobs', '/client/payments'],
  guard: ['/guard/map', '/guard/activation', '/guard/my-jobs', '/guard/payments'],
};

export async function checkLayout(page, label, findings) {
  const issues = await page.evaluate(() => {
    const out = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const doc = document.documentElement;
    const body = document.body;
    if (doc.scrollWidth > vw + 8) {
      out.push(`horizontal overflow ${doc.scrollWidth}px > ${vw}px`);
    }
    const contentH = Math.max(doc.scrollHeight, body.scrollHeight);
    const htmlY = getComputedStyle(doc).overflowY;
    const bodyY = getComputedStyle(body).overflowY;
    const windowBlocked = htmlY === 'hidden' && bodyY === 'hidden';
    let innerScrollable = false;
    const nodes = document.querySelectorAll('main, [data-scroll], [class*="overflow-y"], [class*="overflow-auto"]');
    for (const el of nodes) {
      const s = getComputedStyle(el);
      const y = s.overflowY;
      if ((y === 'auto' || y === 'scroll' || y === 'overlay') && el.scrollHeight > el.clientHeight + 8) {
        innerScrollable = true;
        break;
      }
    }
    if (contentH > vh + 40 && windowBlocked && !innerScrollable) {
      out.push(`not vertically scrollable (content ${contentH}px vs viewport ${vh}px)`);
    }
    const h1 = document.querySelector('h1, [role="heading"]');
    if (!h1) out.push('no heading');
    return out;
  });
  for (const issue of issues) findings.push({ label, issue, viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}` });
  return issues;
}

export async function tryScroll(page, label, findings) {
  const before = await page.evaluate(() => ({
    y: window.scrollY,
    main: document.querySelector('main')?.scrollTop ?? 0,
    h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    vh: window.innerHeight,
  }));
  await page.mouse.wheel(0, 600).catch(() => {});
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.scrollBy(0, 400);
    const main = document.querySelector('main');
    if (main) main.scrollTop += 400;
  }).catch(() => {});
  const after = await page.evaluate(() => ({
    y: window.scrollY,
    main: document.querySelector('main')?.scrollTop ?? 0,
  }));
  const moved = after.y > before.y || after.main > before.main;
  if (before.h > before.vh + 80 && !moved) {
    findings.push({
      label: `${label}-scroll`,
      issue: `wheel/scroll did not move (content ${before.h}px, viewport ${before.vh}px)`,
    });
  }
  return moved || before.h <= before.vh + 80;
}

export function createLogger(results) {
  return function log(section, ok, detail = '') {
    const row = { section, ok, detail: String(detail).slice(0, 2000), at: new Date().toISOString() };
    results.push(row);
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${section} | ${String(detail).slice(0, 420)}`);
    return row;
  };
}

export async function shot(page, name) {
  const safe = name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const file = path.join(SHOT, `${safe}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

export async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(600);
}

export async function dismissOverlays(page) {
  for (let round = 0; round < 6; round++) {
    let hit = false;
    for (const name of [
      /Skip for now/i,
      /Do it later/i,
      /End tutorial/i,
      /Got it/i,
      /Not now/i,
      /^Later$/i,
      /^Skip$/i,
      /^Close$/i,
      /Finish/i,
    ]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 250 }).catch(() => false)) {
        await b.click({ force: true }).catch(() => {});
        hit = true;
        await page.waitForTimeout(250);
      }
    }
    const boxes = page.locator('input[type="checkbox"]:visible');
    const n = await boxes.count();
    for (let j = 0; j < n; j++) {
      const box = boxes.nth(j);
      if (!(await box.isChecked().catch(() => true))) {
        await box.check({ force: true }).catch(() => {});
        hit = true;
      }
    }
    const cont = page
      .getByRole('button', { name: /^(Continue|Accept|I agree|Agree)$/i })
      .first();
    if (await cont.isVisible({ timeout: 300 }).catch(() => false)) {
      await cont.click({ force: true }).catch(() => {});
      hit = true;
      await page.waitForTimeout(300);
    }
    if (!hit) break;
  }
}

export async function hardReset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page
    .evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    })
    .catch(() => {});
  await context.clearCookies();
}

export async function login(page, role, email, password) {
  await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if ((await page.locator('input[type="email"]').count()) === 0) {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
  }
  await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
  await page.waitForTimeout(3500);
  await waitReady(page);
  await dismissOverlays(page);
  const body = await page.locator('body').innerText();
  const stillOnSignIn =
    /staff sign in|guard sign in|client sign in|enter your email and password/i.test(body) &&
    (await page.locator('input[type="email"]').count()) > 0;
  const failed =
    stillOnSignIn ||
    /account not found|incorrect password|invalid password|invalid credentials|sign in failed|wrong password/i.test(
      body
    );
  return { failed, body: body.slice(0, 2500), url: page.url() };
}

export async function acceptTerms(page) {
  const terms = page.locator('#auth-accept-terms');
  if (await terms.count()) await terms.check({ force: true }).catch(() => {});
  await page.locator('.legal-accept-checkbox-visual').first().click().catch(() => {});
}

export async function fillIfVisible(page, pattern, value) {
  const byLabel = page.getByLabel(pattern).first();
  if (await byLabel.isVisible({ timeout: 500 }).catch(() => false)) {
    await byLabel.fill(value);
    return true;
  }
  const byPh = page.getByPlaceholder(pattern).first();
  if (await byPh.isVisible({ timeout: 400 }).catch(() => false)) {
    await byPh.fill(value);
    return true;
  }
  return false;
}

export async function clickFirstMatching(page, patterns, timeout = 1500) {
  for (const pattern of patterns) {
    const btn = page.getByRole('button', { name: pattern }).first();
    if (await btn.isVisible({ timeout }).catch(() => false)) {
      await btn.click({ force: true });
      return pattern.toString();
    }
    const link = page.getByRole('link', { name: pattern }).first();
    if (await link.isVisible({ timeout: 200 }).catch(() => false)) {
      await link.click({ force: true });
      return pattern.toString();
    }
  }
  return null;
}

export async function visitPath(page, log, label, pathSeg) {
  await page.goto(`${BASE}${pathSeg}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  const text = await page.locator('body').innerText();
  const broken = /page could not be found|something went wrong|application error|failed to load/i.test(text);
  await shot(page, label);
  log(label, !broken, broken ? text.slice(0, 200) : page.url());
  return !broken;
}

export async function signUpClient(page, email, password) {
  await page.goto(`${BASE}/?auth=sign-up&ar=client`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await fillIfVisible(page, /first name/i, 'Field');
  await fillIfVisible(page, /last name/i, 'Client');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillIfVisible(page, /company/i, 'Field Test Properties LLC');
  await fillIfVisible(page, /phone/i, '(555) 010-1001');
  await acceptTerms(page);
  await page.getByRole('button', { name: /sign up|create account|continue|submit/i }).first().click();
  await page.waitForTimeout(3000);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok =
    !/already (exists|registered)|sign up failed|something went wrong/i.test(body) &&
    (/pending|welcome|home|jobs|account/i.test(body) || !(await page.locator('input[type="email"]').count()));
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function selectFirstMatchingOption(page, labelRe, valueRe) {
  const select = page.getByLabel(labelRe).first();
  if (await select.isVisible({ timeout: 600 }).catch(() => false)) {
    await select.selectOption({ label: valueRe }).catch(async () => {
      const opts = await select.locator('option').allTextContents();
      const match = opts.find((o) => valueRe.test(o));
      if (match) await select.selectOption({ label: match });
    });
    return true;
  }
  return false;
}

export async function signUpGuard(page, email, password) {
  await page.goto(`${BASE}/?auth=sign-up&ar=guard`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await fillIfVisible(page, /first name/i, 'Field');
  await fillIfVisible(page, /last name/i, 'Guard');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillIfVisible(page, /phone/i, '(555) 010-2002');
  await fillIfVisible(page, /hourly rate/i, '35');
  await fillIfVisible(page, /years in security|years of/i, '3');
  await page.locator('input[type="number"]').nth(1).fill('3').catch(() => {});
  await fillIfVisible(
    page,
    /bio|background|professional/i,
    'Field test guard with three years of event and site security experience in Los Angeles.'
  );
  await fillIfVisible(
    page,
    /work history|recent roles|operations experience/i,
    'Worked event security and retail loss prevention for multiple employers in Los Angeles.'
  );
  await fillIfVisible(page, /availability/i, 'Available weekdays and weekends, flexible hours.');
  await clickFirstMatching(page, [/event security/i, /site patrol/i, /retail/i], 800);
  await selectFirstMatchingOption(page, /armed work/i, /unarmed/i);
  await selectFirstMatchingOption(page, /primary service area|primary city/i, /los angeles/i);
  await selectFirstMatchingOption(page, /guard card/i, /active|yes|valid/i);
  await selectFirstMatchingOption(page, /transport/i, /yes/i);
  await clickFirstMatching(page, [/active guard card/i, /i have a guard card/i], 600);
  await clickFirstMatching(page, [/yes/i], 400);
  await acceptTerms(page);
  await page.getByRole('button', { name: /sign up|create account|continue|submit|apply/i }).first().click();
  await page.waitForTimeout(3500);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok =
    !/already (exists|registered)|sign up failed|something went wrong/i.test(body) &&
    (/pending|application|activation|welcome|map|under review/i.test(body) ||
      !(await page.locator('input[type="email"]').count()));
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function signUpStaff(page, email, password) {
  await page.goto(`${BASE}/?auth=sign-up&ar=staff`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await fillIfVisible(page, /first name/i, 'Field');
  await fillIfVisible(page, /last name/i, 'Support');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillIfVisible(page, /phone/i, '(555) 010-4004');
  await fillIfVisible(page, /years/i, '4');
  await selectFirstMatchingOption(page, /primary city|primary work city/i, /los angeles/i);
  await fillIfVisible(
    page,
    /work history|relevant work|operations/i,
    'Four years of operations and dispatch experience supporting licensed security teams in California.'
  );
  await fillIfVisible(page, /availability/i, 'Weekdays 8am–6pm Pacific.');
  await acceptTerms(page);
  await page.getByRole('button', { name: /sign up|create account|continue|submit|apply/i }).first().click();
  await page.waitForTimeout(3500);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok =
    !/already (exists|registered)|sign up failed|something went wrong/i.test(body) &&
    (/application submitted|pending|director review|sign in/i.test(body) ||
      !(await page.locator('input[type="email"]').count()));
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function addStaffViaTeam(page, { firstName, lastName, email, role }) {
  await page.goto(`${BASE}/staff/team`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  const add = page.getByRole('button', { name: /add staff/i }).first();
  if (!(await add.isVisible({ timeout: 4000 }).catch(() => false))) {
    return { ok: false, detail: 'Add staff button missing' };
  }
  await add.click();
  await page.waitForTimeout(600);
  await fillIfVisible(page, /first name/i, firstName);
  await fillIfVisible(page, /last name/i, lastName);
  await clickFirstMatching(page, [/use next/i], 800);
  const workEmail = page.getByLabel(/work email/i).first();
  if (await workEmail.isVisible({ timeout: 800 }).catch(() => false)) {
    await workEmail.fill(email);
  } else {
    await page.locator('input[type="email"]').first().fill(email);
  }
  const roleSelect = page.getByLabel(/^role$/i).first();
  if (await roleSelect.isVisible({ timeout: 800 }).catch(() => false)) {
    await roleSelect.selectOption(role).catch(() => roleSelect.selectOption({ label: role }));
  }
  const cityBox = page.locator('input[type="checkbox"]:visible').first();
  if (await cityBox.isVisible({ timeout: 500 }).catch(() => false)) {
    await cityBox.check({ force: true }).catch(() => {});
  }
  await page.getByRole('button', { name: /add staff|create|save|submit/i }).last().click();
  await page.waitForTimeout(2000);
  const body = await page.locator('body').innerText();
  const ok = new RegExp(firstName, 'i').test(body) || /added|created|pending/i.test(body);
  return { ok, detail: body.slice(0, 400) };
}

export async function clickAllFilterTabs(page) {
  const tabs = page.locator('[role="tab"]:visible, nav button:visible');
  const n = Math.min(await tabs.count(), 12);
  const labels = [];
  for (let i = 0; i < n; i++) {
    const t = tabs.nth(i);
    const text = ((await t.innerText().catch(() => '')) || '').trim();
    if (!text || text.length > 40) continue;
    await t.click({ force: true }).catch(() => {});
    await page.waitForTimeout(250);
    labels.push(text);
  }
  return labels;
}

export async function searchAndOpen(page, term) {
  const search = page.getByPlaceholder(/search/i).first();
  if (await search.isVisible({ timeout: 1500 }).catch(() => false)) {
    await search.fill(term);
    await page.waitForTimeout(800);
  }
  const row = page.getByText(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first();
  if (await row.isVisible({ timeout: 2500 }).catch(() => false)) {
    await row.click({ force: true });
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

export async function postJobThroughWizard(page) {
  let jobPosted = false;
  const postBtn = page.getByRole('button', { name: /post a job|post job/i }).first();
  if (await postBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await postBtn.click();
  } else {
    await page.getByText(/post a job|post job/i).first().click({ timeout: 3000 }).catch(() => {});
  }
  await page.waitForTimeout(1500);

  for (let step = 0; step < 14; step++) {
    const stepText = await page.locator('body').innerText();
    const serviceChoice = page
      .getByRole('button', { name: /site patrol|standing guard|corporate event|private party|event security/i })
      .first();
    if (await serviceChoice.isVisible({ timeout: 800 }).catch(() => false)) {
      await serviceChoice.click();
      await page.waitForTimeout(600);
    }

    const inputs = page.locator('input:visible, textarea:visible');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      if (type === 'checkbox' || type === 'radio' || type === 'hidden' || type === 'file') continue;
      const val = await input.inputValue().catch(() => '');
      if (val) continue;
      const name = ((await input.getAttribute('name')) || (await input.getAttribute('placeholder')) || '').toLowerCase();
      const labelish = name + ' ' + ((await input.getAttribute('aria-label')) || '').toLowerCase();
      if (/email|password/.test(labelish)) continue;
      if (/address|street|location|site/.test(labelish)) {
        await input.fill('6801 Hollywood Blvd, Los Angeles, CA 90028');
      } else if (/city/.test(labelish)) {
        await input.fill('Los Angeles');
      } else if (/zip|postal/.test(labelish)) {
        await input.fill('90028');
      } else if (/name|title|site/.test(labelish)) {
        await input.fill('Field Test Patrol Post');
      } else if (/phone/.test(labelish)) {
        await input.fill('(555) 010-3003');
      } else if (/rate|pay|hour|amount|price/.test(labelish)) {
        await input.fill('45');
      } else if (/guard|count|quantity|heads/.test(labelish)) {
        await input.fill('1');
      } else if (type === 'date' || /date/.test(labelish)) {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        await input.fill(d.toISOString().slice(0, 10));
      } else if (type === 'time' || /time|start|end/.test(labelish)) {
        await input.fill(labelish.includes('end') ? '22:00' : '18:00');
      } else if (type === 'number') {
        await input.fill('1');
      }
    }

    const optionCard = page.locator('[role="radio"]:visible, [role="option"]:visible').first();
    if (await optionCard.isVisible({ timeout: 400 }).catch(() => false)) {
      await optionCard.click().catch(() => {});
    }

    const next = page
      .getByRole('button', { name: /^(Continue|Next|Review|Post|Submit|Publish|Create|Confirm|Finish|Pay)/i })
      .first();
    if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
      const label = (await next.innerText()).trim();
      await next.click();
      await page.waitForTimeout(1400);
      if (/post|submit|publish|create|confirm|finish|pay/i.test(label) && step > 2) {
        jobPosted = true;
        break;
      }
    } else if (/job (posted|created|submitted)|pending review|open|success|checkout/i.test(stepText)) {
      jobPosted = true;
      break;
    } else {
      break;
    }
  }

  const endText = await page.locator('body').innerText();
  return {
    jobPosted: jobPosted || /pending|open|posted|created|checkout|stripe/i.test(endText),
    body: endText.slice(0, 1500),
    url: page.url(),
  };
}

export const STAFF_SECTIONS = [
  '/staff/overview',
  '/staff/map',
  '/staff/jobs',
  '/staff/locations',
  '/staff/applications',
  '/staff/credentials',
  '/staff/guards',
  '/staff/clients',
  '/staff/team',
  '/staff/messages',
  '/staff/support',
  '/staff/incidents',
  '/staff/violations',
  '/staff/disputes',
  '/staff/stats',
  '/staff/analytics',
  '/staff/payments',
  '/staff/payment-settings',
  '/staff/agreements',
  '/staff/audit-log',
  '/staff/cities',
  '/staff/permissions',
  '/staff/settings',
  '/staff/integrations',
  '/staff/guide',
  '/staff/dev-updates',
];

export const GUARD_PATHS = [
  '/guard/map',
  '/guard/activation',
  '/guard/my-jobs',
  '/guard/messages',
  '/guard/payments',
  '/guard/profile',
  '/guard/settings',
  '/guard/support',
  '/guard/guide',
  '/guard/preferences',
  '/guard/performance',
  '/guard/availability',
  '/guard/vehicle',
];

export const CLIENT_PATHS = [
  '/client/home',
  '/client/map',
  '/client/jobs',
  '/client/requests',
  '/client/request',
  '/client/messages',
  '/client/payments',
  '/client/reports',
  '/client/guards',
  '/client/locations',
  '/client/profile',
  '/client/settings',
  '/client/support',
  '/client/guide',
];

export const PUBLIC_PATHS = ['/', '/legal/terms', '/legal/privacy'];
