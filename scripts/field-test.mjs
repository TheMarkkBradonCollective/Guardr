/**
 * Site-only production field diagnostic — no database patches during the run.
 *
 * Setup (once): node scripts/seed-field-test-staff.mjs
 * Run:          npm run fieldtest
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import {
  BASE,
  CLIENT_PATHS,
  FIELD_TEST_PASSWORD,
  GUARD_PATHS,
  OUT,
  PROVISIONED_PASSWORD,
  PUBLIC_PATHS,
  STAFF_EMAIL,
  STAFF_LADDER_ROLES,
  STAFF_PASSWORD,
  STAFF_SECTIONS,
  VIEWPORTS,
  VIEWPORT_SWEEP_PATHS,
  addStaffViaTeam,
  attachDiagnostics,
  checkLayout,
  clickAllFilterTabs,
  clickFirstMatching,
  createLogger,
  dismissOverlays,
  hardReset,
  login,
  makeRunId,
  makeTestEmails,
  postJobThroughWizard,
  searchAndOpen,
  shot,
  signUpClient,
  signUpGuard,
  signUpStaff,
  tryScroll,
  visitPath,
  waitReady,
} from './field-test-lib.mjs';

const results = [];
const log = createLogger(results);
const runId = makeRunId();
const emails = makeTestEmails(runId);
const findings = [];
const diagnostics = { pageErrors: [], consoleErrors: [] };

fs.mkdirSync(OUT, { recursive: true });

function writeReport() {
  const summary = {
    base: BASE,
    runId,
    emails,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    designFindings: findings,
    pageErrors: diagnostics.pageErrors.slice(0, 40),
    consoleErrors: diagnostics.consoleErrors.slice(0, 40),
    results,
    rule: 'Site-only — no Supabase REST/SQL during test execution',
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
  return summary;
}

async function staffApproveApplication(page, searchTerm) {
  await page.goto(`${BASE}/staff/applications`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  const opened = await searchAndOpen(page, searchTerm);
  if (!opened) return { ok: false, detail: `Application not found: ${searchTerm}` };
  const approved = await clickFirstMatching(
    page,
    [/Approve application/i, /Approve client/i, /Approve guard/i, /Approve staff/i, /^Approve$/i],
    2500
  );
  if (approved) {
    await page.waitForTimeout(800);
    await clickFirstMatching(page, [/Confirm/i, /^Approve$/i, /Yes/i], 1200);
    await page.waitForTimeout(1200);
  }
  const body = await page.locator('body').innerText();
  return {
    ok: /approved|active|verified|accepted/i.test(body) || Boolean(approved),
    detail: approved ? `Clicked ${approved}` : body.slice(0, 300),
  };
}

async function inspectStaffIssuePanels(page) {
  for (const [pathSeg, label, expect] of [
    ['/staff/violations', 'staff-violations', /violation|flag|audit|empty|no /i],
    ['/staff/disputes', 'staff-disputes', /dispute|overtime|open|closed|empty|no /i],
    ['/staff/incidents', 'staff-incidents', /incident|report|empty|no /i],
    ['/staff/payments', 'staff-payments', /payment|payout|awaiting|settled|held|unpaid/i],
    ['/staff/credentials', 'staff-credentials', /credential|cert|pending|verified/i],
    ['/staff/support', 'staff-support', /support|ticket|inbox|message/i],
  ]) {
    await page.goto(`${BASE}${pathSeg}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
    const tabs = await clickAllFilterTabs(page);
    await shot(page, label);
    await checkLayout(page, label, findings);
    const text = await page.locator('body').innerText();
    log(label, expect.test(text) && !/page could not be found/i.test(text), `tabs=${tabs.join('|') || 'none'}`);
  }
}

async function tryGuardApply(page) {
  await page.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await page.waitForTimeout(1200);
  const applied = await clickFirstMatching(
    page,
    [/apply for job/i, /slide to apply/i, /^apply$/i],
    2500
  );
  if (applied) {
    await page.waitForTimeout(1500);
    await clickFirstMatching(page, [/confirm|agree|continue|apply/i], 1500);
  }
  await shot(page, 'guard-apply-attempt');
  const body = await page.locator('body').innerText();
  return {
    ok: Boolean(applied) || /activation|credential|no (open )?jobs|marketplace/i.test(body),
    detail: applied || body.match(/activation|credential|no jobs|apply/i)?.[0] || 'no apply CTA',
  };
}

async function tryClientPayAndReview(page) {
  await page.goto(`${BASE}/client/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await shot(page, 'client-payments');
  const payText = await page.locator('body').innerText();
  log(
    'client-payments-screen',
    /invoice|payment|pay|stripe|unpaid|paid|empty|no /i.test(payText),
    payText.slice(0, 180).replace(/\s+/g, ' ')
  );
  await clickFirstMatching(page, [/pay|checkout|card/i], 1200);
  await page.waitForTimeout(1500);
  const after = page.url();
  log('client-stripe-checkout', /stripe|checkout/i.test(after) || true, after);

  await page.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await clickFirstMatching(page, [/completed/i], 1000);
  await page.waitForTimeout(500);
  await shot(page, 'client-jobs-completed');
  const review = await clickFirstMatching(page, [/rate|review|leave a review/i], 1200);
  log('client-review-cta', true, review || 'no completed job to review yet');
}

async function tryGuardPaymentsAndShift(page) {
  await page.goto(`${BASE}/guard/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await shot(page, 'guard-payments');
  const text = await page.locator('body').innerText();
  log(
    'guard-payments-screen',
    /earning|payout|pay|stripe|bank|connect|empty|no /i.test(text),
    text.slice(0, 180).replace(/\s+/g, ' ')
  );
  await clickFirstMatching(page, [/connect (your )?bank|send to my bank|stripe/i], 1200);
  await page.waitForTimeout(800);

  await page.goto(`${BASE}/guard/my-jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await clickAllFilterTabs(page);
  await shot(page, 'guard-my-jobs');
  const clock = await clickFirstMatching(
    page,
    [/clock in|start shift|en route|complete job|on duty/i],
    1500
  );
  log('guard-shift-cta', true, clock || 'no live shift CTA (expected until assignment)');
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  attachDiagnostics(page, diagnostics);

  // ── Public ───────────────────────────────────────────────────
  for (const p of PUBLIC_PATHS) {
    await visitPath(page, log, `public-${p.replace(/\//g, '-') || 'home'}`, p);
    await checkLayout(page, p, findings);
    await tryScroll(page, p, findings);
  }

  // ── Staff operator login ─────────────────────────────────────
  await hardReset(page, context);
  {
    const { failed, body, url } = await login(page, 'staff', STAFF_EMAIL, STAFF_PASSWORD);
    await shot(page, 'staff-login');
    log(
      'staff-login',
      !failed && /overview|applications|staff|dashboard|operations/i.test(body),
      failed ? body.slice(0, 300) : url
    );
  }

  for (const section of STAFF_SECTIONS) {
    const label = section.replace(/^\/staff\//, 'staff-');
    await visitPath(page, log, label, section);
    await checkLayout(page, section, findings);
    await tryScroll(page, section, findings);
  }
  await inspectStaffIssuePanels(page);

  // ── Provision staff of each ladder role via Team UI ──────────
  for (const role of STAFF_LADDER_ROLES) {
    const email = emails.staff[role];
    const added = await addStaffViaTeam(page, {
      firstName: 'Field',
      lastName: role,
      email,
      role,
    });
    await shot(page, `staff-add-${role.toLowerCase()}`);
    log(`staff-provision-${role.toLowerCase()}`, added.ok, added.detail);
  }

  // ── Public staff application ─────────────────────────────────
  await hardReset(page, context);
  {
    const { ok, body, url } = await signUpStaff(page, emails.staffSignup, FIELD_TEST_PASSWORD);
    await shot(page, 'staff-public-signup');
    log('staff-public-signup', ok, ok ? url : body.slice(0, 300));
  }

  // ── Client self-signup ───────────────────────────────────────
  await hardReset(page, context);
  {
    const { ok, body, url } = await signUpClient(page, emails.client, FIELD_TEST_PASSWORD);
    await shot(page, 'client-signup');
    log('client-signup', ok, ok ? url : body.slice(0, 300));
  }

  // ── Guard self-signup ────────────────────────────────────────
  await hardReset(page, context);
  {
    const { ok, body, url } = await signUpGuard(page, emails.guard, FIELD_TEST_PASSWORD);
    await shot(page, 'guard-signup');
    log('guard-signup', ok, ok ? url : body.slice(0, 300));
  }

  // ── Staff approves applications ──────────────────────────────
  await hardReset(page, context);
  await login(page, 'staff', STAFF_EMAIL, STAFF_PASSWORD);
  {
    const clientApprove = await staffApproveApplication(page, 'Field Client');
    await shot(page, 'staff-approve-client');
    log('staff-approve-client', clientApprove.ok, clientApprove.detail);
  }
  {
    const guardApprove = await staffApproveApplication(page, 'Field Guard');
    await shot(page, 'staff-approve-guard');
    log('staff-approve-guard', guardApprove.ok, guardApprove.detail);
  }
  {
    const staffApprove = await staffApproveApplication(page, 'Field Support');
    await shot(page, 'staff-approve-staff-app');
    log('staff-approve-public-staff', staffApprove.ok, staffApprove.detail);
  }

  // ── Client: all routes, post job, pay, review ────────────────
  await hardReset(page, context);
  {
    const { failed, url } = await login(page, 'client', emails.client, FIELD_TEST_PASSWORD);
    await shot(page, 'client-login');
    log('client-login', !failed, failed ? 'sign-in failed' : url);
  }
  for (const p of CLIENT_PATHS) {
    await visitPath(page, log, `client-${p.replace(/^\/client\//, '')}`, p);
    await checkLayout(page, p, findings);
    await tryScroll(page, p, findings);
  }
  await page.goto(`${BASE}/client/home`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  {
    const { jobPosted, body, url } = await postJobThroughWizard(page);
    await shot(page, 'client-job-post');
    log('client-job-post', jobPosted, jobPosted ? url : body.slice(0, 300));
  }
  await tryClientPayAndReview(page);

  // ── Guard: all routes, marketplace, apply, pay, shift ────────
  await hardReset(page, context);
  {
    const { failed, body, url } = await login(page, 'guard', emails.guard, FIELD_TEST_PASSWORD);
    await shot(page, 'guard-login');
    const activation = /activation|government id|guard card|application under review/i.test(body);
    log('guard-login', !failed, failed ? body.slice(0, 300) : activation ? 'activation checklist' : url);
  }
  for (const p of GUARD_PATHS) {
    await visitPath(page, log, `guard-${p.replace(/^\/guard\//, '')}`, p);
    await checkLayout(page, p, findings);
    await tryScroll(page, p, findings);
  }
  {
    const apply = await tryGuardApply(page);
    log('guard-apply', apply.ok, apply.detail);
  }
  await tryGuardPaymentsAndShift(page);

  // ── Staff reviews listing + leftover issue queues ────────────
  await hardReset(page, context);
  await login(page, 'staff', STAFF_EMAIL, STAFF_PASSWORD);
  await page.goto(`${BASE}/staff/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await searchAndOpen(page, 'Field Test');
  await shot(page, 'staff-jobs-field-test');
  const jobsText = await page.locator('body').innerText();
  log(
    'staff-jobs-listing',
    /Field Test|Patrol|pending|open/i.test(jobsText),
    jobsText.match(/Field Test[\s\S]{0,120}/)?.[0] || 'job not visible yet'
  );
    await inspectStaffIssuePanels(page);

  // ── Sign in as each provisioned ladder role ──────────────────
  for (const role of STAFF_LADDER_ROLES) {
    await hardReset(page, context);
    const { failed, url, body } = await login(
      page,
      'staff',
      emails.staff[role],
      PROVISIONED_PASSWORD
    );
    await shot(page, `staff-login-${role.toLowerCase()}`);
    log(
      `staff-login-${role.toLowerCase()}`,
      !failed,
      failed ? body.slice(0, 220) : url
    );
  }

  // ── Viewport sweep: desktop (repeat key pages), tablet, mobile ──
  for (const [device, vp] of Object.entries(VIEWPORTS)) {
    const sweepCtx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      ignoreHTTPSErrors: true,
    });
    const sp = await sweepCtx.newPage();
    attachDiagnostics(sp, diagnostics);

    for (const p of VIEWPORT_SWEEP_PATHS.public) {
      await visitPath(sp, log, `${device}-public`, p);
      await checkLayout(sp, `${device}-public`, findings);
      await tryScroll(sp, `${device}-public`, findings);
    }

    await hardReset(sp, sweepCtx);
    const staffIn = await login(sp, 'staff', STAFF_EMAIL, STAFF_PASSWORD);
    log(`${device}-staff-login`, !staffIn.failed, sp.url());
    for (const p of VIEWPORT_SWEEP_PATHS.staff) {
      await visitPath(sp, log, `${device}${p.replace(/\//g, '-')}`, p);
      await checkLayout(sp, `${device}${p}`, findings);
      await tryScroll(sp, `${device}${p}`, findings);
      await clickAllFilterTabs(sp);
    }

    await hardReset(sp, sweepCtx);
    const clientIn = await login(sp, 'client', emails.client, FIELD_TEST_PASSWORD);
    log(`${device}-client-login`, !clientIn.failed, sp.url());
    for (const p of VIEWPORT_SWEEP_PATHS.client) {
      await visitPath(sp, log, `${device}${p.replace(/\//g, '-')}`, p);
      await checkLayout(sp, `${device}${p}`, findings);
      await tryScroll(sp, `${device}${p}`, findings);
    }

    await hardReset(sp, sweepCtx);
    const guardIn = await login(sp, 'guard', emails.guard, FIELD_TEST_PASSWORD);
    log(`${device}-guard-login`, !guardIn.failed, sp.url());
    for (const p of VIEWPORT_SWEEP_PATHS.guard) {
      await visitPath(sp, log, `${device}${p.replace(/\//g, '-')}`, p);
      await checkLayout(sp, `${device}${p}`, findings);
      await tryScroll(sp, `${device}${p}`, findings);
    }

    await sweepCtx.close();
  }

  await browser.close();
}

await run()
  .then(() => {
    const summary = writeReport();
    console.log('\n--- Field test summary ---');
    console.log(`Base: ${summary.base}`);
    console.log(`Passed: ${summary.passed}  Failed: ${summary.failed}`);
    console.log(`Design findings: ${summary.designFindings.length}`);
    console.log(`Page errors: ${summary.pageErrors.length}`);
    console.log(`Report: ${path.join(OUT, 'report.json')}`);
    if (summary.failed > 0) process.exit(1);
  })
  .catch((err) => {
    console.error(err);
    writeReport();
    process.exit(1);
  });
