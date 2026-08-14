/**
 * Site-only production field diagnostic — no database patches during the run.
 *
 * Setup (once): node scripts/seed-field-test-staff.mjs
 * Run:          npm run fieldtest
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { clearTestData } from './clear-test-data-lib.mjs';
import {
  AD,
  BASE,
  CLIENT_PATHS,
  FAKE_CRED,
  FIELD_TEST_PASSWORD,
  FIELD_TEST_SITE,
  GUARD_PATHS,
  OUT,
  PUBLIC_PATHS,
  STAFF_EMAIL,
  STAFF_LADDER_PATHS,
  STAFF_LADDER_ROLES,
  STAFF_PASSWORD,
  STAFF_SECTIONS,
  PROMO_AD_BY_PATH,
  VIEWPORTS,
  VIEWPORT_SWEEP_PATHS,
  adShot,
  approvePendingGuard,
  applyFieldTestGeolocation,
  assertJaneJohn,
  attachDiagnostics,
  checkLayout,
  clickAllFilterTabs,
  clickFirstMatching,
  clientApproveGuardOnJob,
  clientPayJobWithStripe,
  completeGuardShiftOnMap,
  confirmAppDialog,
  createLogger,
  dismissOverlays,
  ensureSignedOut,
  fetchStripeHealth,
  goToAuthSignup,
  hardReset,
  injectGuardAvailability,
  login,
  makeRunId,
  makeTestEmails,
  postJobThroughWizard,
  searchAndOpen,
  shot,
  signUpClient,
  signUpGuard,
  signUpStaff,
  staffApproveJobListing,
  staffAssertSignupMarketReady,
  staffVerifyOpenCredentials,
  postFieldtestReportToStaffChat,
  tryScroll,
  uploadFakeCredentials,
  visitPath,
  waitReady,
} from './field-test-lib.mjs';

const results = [];
const log = createLogger(results);
const runId = makeRunId();
const emails = makeTestEmails(runId);
const findings = [];
const fixesApplied = [];
const diagnostics = { pageErrors: [], consoleErrors: [] };
let stripeHealth = { configured: false, testMode: false, liveMode: false };
let cleanupBefore = null;
let cleanupAfter = null;
const SKIP_CLEANUP = process.env.FIELDTEST_SKIP_CLEANUP === '1';

fs.mkdirSync(OUT, { recursive: true });

function recordFix(phase, description) {
  fixesApplied.push({ phase, description, at: new Date().toISOString() });
}

async function runCleanup(phase) {
  if (SKIP_CLEANUP) {
    const skipped = { ok: true, label: phase, skipped: true };
    log(`cleanup-${phase}`, true, 'skipped (FIELDTEST_SKIP_CLEANUP=1)');
    return skipped;
  }
  try {
    const result = await clearTestData({ label: phase });
    log(
      `cleanup-${phase}`,
      result.ok,
      `found g${result.found.guards}/c${result.found.clients}/s${result.found.staff} → verify ${JSON.stringify(result.verify.remaining)}`
    );
    return result;
  } catch (err) {
    log(`cleanup-${phase}`, false, String(err).slice(0, 300));
    return { ok: false, label: phase, error: String(err) };
  }
}

function writeReportMarkdown(summary) {
  const lines = [
    `# Fieldtest report — ${summary.runId}`,
    '',
    `- **Base:** ${summary.base}`,
    `- **Started:** ${summary.startedAt}`,
    `- **Finished:** ${summary.finishedAt}`,
    `- **Passed:** ${summary.passed} · **Failed:** ${summary.failed}`,
    `- **Market:** ${summary.marketCity}`,
    '',
    '## Cleanup',
    '',
    `| Phase | OK | Guards | Clients | Staff | Remaining |`,
    `|-------|----|--------|---------|-------|-----------|`,
  ];

  for (const phase of ['before', 'after']) {
    const c = summary.cleanup[phase];
    if (!c) continue;
    if (c.skipped) {
      lines.push(`| ${phase} | skipped | — | — | — | — |`);
      continue;
    }
    lines.push(
      `| ${phase} | ${c.ok ? 'yes' : 'no'} | ${c.found?.guards ?? '—'} | ${c.found?.clients ?? '—'} | ${c.found?.staff ?? '—'} | ${JSON.stringify(c.verify?.remaining ?? {})} |`
    );
  }

  lines.push('', '## Fixes applied during run', '');
  if (summary.fixesApplied.length === 0) {
    lines.push('_None — no runner or product fixes were needed during this run._');
  } else {
    for (const fix of summary.fixesApplied) {
      lines.push(`- **${fix.phase}:** ${fix.description}`);
    }
  }

  lines.push('', '## Failed steps', '');
  const failed = summary.results.filter((r) => !r.ok);
  if (failed.length === 0) {
    lines.push('_All steps passed._');
  } else {
    for (const step of failed) {
      lines.push(`- **${step.section}:** ${step.detail}`);
    }
  }

  lines.push('', '## Passed workflow (high level)', '');
  const keySteps = [
    'staff-signup-market-check',
    'public-signup-jane-doe',
    'public-signup-john-doe',
    'staff-approve-jane-doe',
    'staff-approve-john-doe',
    'client-job-post',
    'staff-approve-job-listing',
    'client-payment-gate',
    'staff-verify-john-creds',
    'guard-apply',
    'jane-approve-john',
    'guard-shift-workflow',
  ];
  for (const key of keySteps) {
    const row = summary.results.find((r) => r.section === key);
    if (row) lines.push(`- ${row.ok ? '✓' : '✗'} ${key}: ${row.detail?.slice(0, 120) || ''}`);
  }

  lines.push('', '## Stripe', '', `\`${JSON.stringify(summary.stripe)}\``, '');
  lines.push('## Artifacts', '', `- JSON: \`${summary.reportJsonPath}\``, `- Screenshots: \`${summary.screenshotsDir}\``);

  fs.writeFileSync(path.join(OUT, 'report.md'), lines.join('\n'));
}

function writeReport(startedAt) {
  const finishedAt = new Date().toISOString();
  const summary = {
    base: BASE,
    runId,
    startedAt,
    finishedAt,
    emails,
    marketCity: FIELD_TEST_SITE.city,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    designFindings: findings,
    pageErrors: diagnostics.pageErrors.slice(0, 40),
    consoleErrors: diagnostics.consoleErrors.slice(0, 40),
    results,
    fixesApplied,
    cleanup: { before: cleanupBefore, after: cleanupAfter },
    rule: 'Every action while signed in as that role — no cross-role shortcuts',
    names: { client: AD.client.name, guard: AD.guard.name, company: AD.client.company },
    fakeCredential: FAKE_CRED || null,
    screenshotsDir: path.join(OUT, 'screenshots'),
    adScreenshotsDir: path.join(OUT, 'ad-screenshots'),
    reportJsonPath: path.join(OUT, 'report.json'),
    promoNote:
      'screenshots/ = every step (full diagnostic). ad-screenshots/{desktop,tablet,mobile}/ = promo-ready Jane/John Doe shots.',
    stripe: stripeHealth,
    workflowNote:
      'Jane pays while job is open (marketplace requires paid). John completes shift on /guard/map after client approves guard. Pre/post cleanup removes *@guardr.test accounts.',
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
  writeReportMarkdown(summary);
  return summary;
}

async function tryClientCompletePendingProfile(page) {
  const pending = await page.getByText(/Account pending approval/i).isVisible({ timeout: 2000 }).catch(() => false);
  if (!pending) return { ok: true, detail: 'already active' };
  const review = await clickFirstMatching(page, [/Review profile/i], 2000);
  await page.waitForTimeout(1500);
  await shot(page, 'client-review-profile');
  return { ok: Boolean(review), detail: review || 'pending — waiting on staff approval' };
}

async function loginAsStaffOperator(page, context) {
  await hardReset(page, context);
  const { failed, body, url } = await login(page, 'staff', STAFF_EMAIL, STAFF_PASSWORD);
  await shot(page, 'staff-login');
  log(
    'staff-login',
    !failed && /overview|applications|staff|dashboard|operations/i.test(body),
    failed ? body.slice(0, 300) : url
  );
  return !failed;
}

async function loginAsClientJane(page, context) {
  await hardReset(page, context);
  const { failed, url, body } = await login(page, 'client', emails.client, FIELD_TEST_PASSWORD);
  await shot(page, 'client-login-jane');
  log('client-login-jane', !failed, failed ? 'sign-in failed' : url);
  if (!failed) {
    const profile = await tryClientCompletePendingProfile(page);
    log('client-complete-profile', profile.ok, profile.detail);
  }
  return { failed, body };
}

async function loginAsGuardJohn(page, context) {
  await hardReset(page, context);
  const { failed, body, url } = await login(page, 'guard', emails.guard, FIELD_TEST_PASSWORD);
  await shot(page, 'guard-login-john');
  const activation = /activation|government id|guard card|application under review/i.test(body);
  log('guard-login-john', !failed, failed ? body.slice(0, 300) : activation ? 'activation checklist' : url);
  return !failed;
}

async function tourRolePaths(page, rolePrefix, paths) {
  for (const p of paths) {
    const slug = p.replace(/^\/(staff|client|guard)\//, '');
    await visitPath(page, log, `${rolePrefix}-${slug}`, p);
    await checkLayout(page, p, findings);
    await tryScroll(page, p, findings);
  }
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
    await confirmAppDialog(page, [
      /^Approve account$/i,
      /^Approve profile$/i,
      /^Approve application$/i,
      /^Confirm$/i,
      /^Yes$/i,
    ]);
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
  await injectGuardAvailability(page);
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
    ok: Boolean(applied) || /awaiting client|application sent|pending/i.test(body),
    detail: applied || body.match(/activation|credential|no jobs|apply/i)?.[0] || 'no apply CTA',
  };
}

async function tryClientReviewAfterShift(page) {
  await page.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await clickFirstMatching(page, [/completed/i], 1000);
  await page.waitForTimeout(500);
  await shot(page, 'client-jobs-completed');
  const review = await clickFirstMatching(page, [/rate|review|leave a review/i], 1200);
  log('client-review-cta', true, review || 'no completed job to review yet');
}

async function run() {
  const startedAt = new Date().toISOString();
  cleanupBefore = await runCleanup('before');

  stripeHealth = await fetchStripeHealth();
  log('stripe-health', stripeHealth.configured, JSON.stringify(stripeHealth));

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    geolocation: { latitude: FIELD_TEST_SITE.lat, longitude: FIELD_TEST_SITE.lng, accuracy: 5 },
    permissions: ['geolocation'],
  });
  await applyFieldTestGeolocation(context);
  const page = await context.newPage();
  attachDiagnostics(page, diagnostics);

  // ══════════════════════════════════════════════════════════════
  // PHASE 1 — Public visitor (no account)
  // ══════════════════════════════════════════════════════════════
  for (const p of PUBLIC_PATHS) {
    await visitPath(page, log, `public-${p.replace(/\//g, '-') || 'home'}`, p);
    await checkLayout(page, p, findings);
    await tryScroll(page, p, findings);
  }
  await adShot(page, 'desktop', '01-landing-hero');

  // ══════════════════════════════════════════════════════════════
  // PHASE 1b — Staff operator: confirm Sacramento is open for guard/client signups
  // (never force-open closed cities like Los Angeles during fieldtest)
  // ══════════════════════════════════════════════════════════════
  await loginAsStaffOperator(page, context);
  {
    const cities = await staffAssertSignupMarketReady(page, 'Sacramento');
    await shot(page, 'staff-signup-market-check');
    log('staff-signup-market-check', cities.ok, cities.detail);
  }
  await hardReset(page, context);

  // ══════════════════════════════════════════════════════════════
  // PHASE 2 — Each applicant signs up from the main page (as themselves)
  // ══════════════════════════════════════════════════════════════
  await ensureSignedOut(page, context);
  {
    const { ok, body, url } = await signUpClient(page, emails.client, FIELD_TEST_PASSWORD, {
      firstName: AD.client.first,
      lastName: AD.client.last,
      company: AD.client.company,
    });
    await shot(page, 'public-signup-jane-doe');
    log('public-signup-jane-doe', ok, ok ? url : body.slice(0, 300));
  }

  await ensureSignedOut(page, context);
  {
    const { ok, body, url } = await signUpGuard(page, emails.guard, FIELD_TEST_PASSWORD, {
      firstName: AD.guard.first,
      lastName: AD.guard.last,
    });
    await shot(page, 'public-signup-john-doe');
    log('public-signup-john-doe', ok, ok ? url : body.slice(0, 300));
  }

  for (const role of STAFF_LADDER_ROLES) {
    await ensureSignedOut(page, context);
    try {
      const { ok, body, url } = await signUpStaff(page, emails.staff[role], FIELD_TEST_PASSWORD, {
        firstName: 'Field',
        lastName: role,
      });
      await shot(page, `public-signup-staff-${role.toLowerCase()}`);
      log(`public-signup-staff-${role.toLowerCase()}`, ok, ok ? url : body.slice(0, 300));
    } catch (err) {
      log(`public-signup-staff-${role.toLowerCase()}`, false, String(err).slice(0, 300));
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 3 — Staff operator: approve applicants (staff-only gate)
  // ══════════════════════════════════════════════════════════════
  await loginAsStaffOperator(page, context);
  {
    const janeApprove = await staffApproveApplication(page, emails.client);
    await shot(page, 'staff-approve-jane-doe');
    log('staff-approve-jane-doe', janeApprove.ok, janeApprove.detail);
  }
  {
    const johnApprove = await staffApproveApplication(page, emails.guard);
    await shot(page, 'staff-approve-john-doe');
    log('staff-approve-john-doe', johnApprove.ok, johnApprove.detail);
  }
  for (const role of STAFF_LADDER_ROLES) {
    const approved = await staffApproveApplication(page, emails.staff[role]);
    await shot(page, `staff-approve-${role.toLowerCase()}`);
    log(`staff-approve-${role.toLowerCase()}`, approved.ok, approved.detail);
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 4 — Client Jane: her workspace, profile, post job
  // ══════════════════════════════════════════════════════════════
  await loginAsClientJane(page, context);
  await tourRolePaths(page, 'client', CLIENT_PATHS);
  await page.goto(`${BASE}/client/home`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  {
    const { jobPosted, body, url } = await postJobThroughWizard(page, { shiftPreset: 'immediate-complete' });
    await shot(page, 'client-job-post');
    log('client-job-post', jobPosted, jobPosted ? url : body.slice(0, 300));
    if (jobPosted) await adShot(page, 'desktop', '07-client-job-posted');
  }
  await adShot(page, 'desktop', '04-client-home');
  await assertJaneJohn(page, log, 'client-home');
  await page.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await adShot(page, 'desktop', '05-client-jobs');

  // ══════════════════════════════════════════════════════════════
  // PHASE 4b — Staff operator: approve job listing (open + coords)
  // ══════════════════════════════════════════════════════════════
  await loginAsStaffOperator(page, context);
  {
    const approved = await staffApproveJobListing(page, 'Field Test');
    await shot(page, 'staff-approve-job-listing');
    log('staff-approve-job-listing', approved.ok, approved.detail);
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 4c — Client Jane: pay job (required before guard marketplace apply)
  // ══════════════════════════════════════════════════════════════
  await loginAsClientJane(page, context);
  {
    const pay = await clientPayJobWithStripe(page, log, stripeHealth, (n) => shot(page, n));
    await shot(page, 'client-payments');
    await adShot(page, 'desktop', '06-client-payments');
    log('client-payment-gate', pay.paid || pay.ok, pay.detail);
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 5 — Guard John: his workspace + upload fake credentials
  // ══════════════════════════════════════════════════════════════
  await loginAsGuardJohn(page, context);
  await tourRolePaths(page, 'guard', GUARD_PATHS);
  {
    const uploads = await uploadFakeCredentials(page, (n) => shot(page, n));
    for (const u of uploads) log(`john-cred-${u.step}`, u.ok, u.detail);
  }

  await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await adShot(page, 'desktop', '03-guard-activation');

  // ══════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════
  await loginAsStaffOperator(page, context);
  {
    const { verified, activate } = await staffVerifyOpenCredentials(page);
    await shot(page, 'staff-verify-john-creds');
    log('staff-verify-john-creds', verified > 0 || Boolean(activate), `verified=${verified} activate=${activate || 'none'}`);
    await page.goto(`${BASE}/staff/guards`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await searchAndOpen(page, 'John Doe');
    const johnApprove = await approvePendingGuard(page);
    log('staff-activate-john-profile', johnApprove.ok, johnApprove.detail);
    await clickFirstMatching(page, [/Activate/i, /Approve application/i, /Restore access/i], 1500);
    await confirmAppDialog(page).catch(() => {});
    await shot(page, 'staff-activate-john');
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 7 — Guard John: marketplace apply
  // ══════════════════════════════════════════════════════════════
  await loginAsGuardJohn(page, context);
  {
    const apply = await tryGuardApply(page);
    log('guard-apply', apply.ok, apply.detail);
    await adShot(page, 'desktop', '02-guard-marketplace-map');
    await assertJaneJohn(page, log, 'marketplace');
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 8 — Client Jane: approve guard on her job
  // ══════════════════════════════════════════════════════════════
  await loginAsClientJane(page, context);
  {
    const approved = await clientApproveGuardOnJob(page, 'Field Test');
    await shot(page, 'jane-approve-john');
    log('jane-approve-john', approved.ok, approved.detail);
    await adShot(page, 'desktop', '11-client-approve-guard');
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 9 — Guard John: clock in + complete shift on map
  // ══════════════════════════════════════════════════════════════
  await loginAsGuardJohn(page, context);
  {
    const shift = await completeGuardShiftOnMap(page, log, (n) => shot(page, n));
    log('guard-shift-workflow', shift.ok, shift.detail);
    await page.goto(`${BASE}/guard/payments`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await shot(page, 'guard-payments');
    await adShot(page, 'desktop', '16-guard-earnings');
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 10 — Client Jane: review after completed shift
  // ══════════════════════════════════════════════════════════════
  await loginAsClientJane(page, context);
  await tryClientReviewAfterShift(page);

  // ══════════════════════════════════════════════════════════════
  // PHASE 11 — Staff operator: full ops tour + issue panels + ads
  // ══════════════════════════════════════════════════════════════
  await loginAsStaffOperator(page, context);
  for (const section of STAFF_SECTIONS) {
    const label = section.replace(/^\/staff\//, 'staff-');
    await visitPath(page, log, label, section);
    await checkLayout(page, section, findings);
    await tryScroll(page, section, findings);
  }
  await page.goto(`${BASE}/staff/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await searchAndOpen(page, 'Field Test');
  await shot(page, 'staff-jobs-jane-john');
  const jobsText = await page.locator('body').innerText();
  log(
    'staff-jobs-listing',
    /Jane Doe|Field Test|Patrol|pending|open/i.test(jobsText),
    jobsText.match(/Jane Doe|Field Test[\s\S]{0,120}/)?.[0] || 'job not visible yet'
  );
  await inspectStaffIssuePanels(page);
  await page.goto(`${BASE}/staff/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await adShot(page, 'desktop', '14-staff-payments');
  await assertJaneJohn(page, log, 'staff-payments');
  await page.goto(`${BASE}/staff/violations`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await adShot(page, 'desktop', '23-staff-violations');
  await page.goto(`${BASE}/staff/disputes`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await adShot(page, 'desktop', '24-staff-disputes');

  // ══════════════════════════════════════════════════════════════
  // PHASE 12 — Each ladder staff: sign in as themselves + tour
  // ══════════════════════════════════════════════════════════════
  for (const role of STAFF_LADDER_ROLES) {
    await hardReset(page, context);
    const { failed, url, body } = await login(page, 'staff', emails.staff[role], FIELD_TEST_PASSWORD);
    await shot(page, `staff-login-${role.toLowerCase()}`);
    log(`staff-login-${role.toLowerCase()}`, !failed, failed ? body.slice(0, 220) : url);
    if (!failed) {
      await tourRolePaths(page, `staff-${role.toLowerCase()}`, STAFF_LADDER_PATHS);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 13 — Viewport sweep (each role signs in on each device)
  // ══════════════════════════════════════════════════════════════
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
      await adShot(sp, device, '01-landing-hero');
    }

    await hardReset(sp, sweepCtx);
    const staffIn = await login(sp, 'staff', STAFF_EMAIL, STAFF_PASSWORD);
    log(`${device}-staff-login`, !staffIn.failed, sp.url());
    for (const p of VIEWPORT_SWEEP_PATHS.staff) {
      await visitPath(sp, log, `${device}${p.replace(/\//g, '-')}`, p);
      await checkLayout(sp, `${device}${p}`, findings);
      await tryScroll(sp, `${device}${p}`, findings);
      await clickAllFilterTabs(sp);
      const promoName = PROMO_AD_BY_PATH[p];
      if (promoName) {
        await adShot(sp, device, promoName);
        await assertJaneJohn(sp, log, `${device}${p}`);
      }
    }

    await hardReset(sp, sweepCtx);
    const clientIn = await login(sp, 'client', emails.client, FIELD_TEST_PASSWORD);
    log(`${device}-client-login`, !clientIn.failed, sp.url());
    for (const p of VIEWPORT_SWEEP_PATHS.client) {
      await visitPath(sp, log, `${device}${p.replace(/\//g, '-')}`, p);
      await checkLayout(sp, `${device}${p}`, findings);
      await tryScroll(sp, `${device}${p}`, findings);
      const promoName = PROMO_AD_BY_PATH[p];
      if (promoName) {
        await adShot(sp, device, promoName);
        await assertJaneJohn(sp, log, `${device}${p}`);
      }
    }

    await hardReset(sp, sweepCtx);
    const guardIn = await login(sp, 'guard', emails.guard, FIELD_TEST_PASSWORD);
    log(`${device}-guard-login`, !guardIn.failed, sp.url());
    for (const p of VIEWPORT_SWEEP_PATHS.guard) {
      await visitPath(sp, log, `${device}${p.replace(/\//g, '-')}`, p);
      await checkLayout(sp, `${device}${p}`, findings);
      await tryScroll(sp, `${device}${p}`, findings);
      const promoName = PROMO_AD_BY_PATH[p];
      if (promoName) {
        await adShot(sp, device, promoName);
        await assertJaneJohn(sp, log, `${device}${p}`);
      }
    }

    await sweepCtx.close();
  }

  await browser.close();
  cleanupAfter = await runCleanup('after');
  return startedAt;
}

const startedAt = await run()
  .then((started) => started)
  .catch(async (err) => {
    console.error(err);
    cleanupAfter = await runCleanup('after');
    throw err;
  })
  .then(async (started) => {
    const summary = writeReport(started);
    console.log('\n--- Field test summary ---');
    console.log(`Base: ${summary.base}`);
    console.log(`Passed: ${summary.passed}  Failed: ${summary.failed}`);
    console.log(`Design findings: ${summary.designFindings.length}`);
    console.log(`Fixes applied: ${summary.fixesApplied.length}`);
    console.log(`Page errors: ${summary.pageErrors.length}`);
    console.log(`Report JSON: ${summary.reportJsonPath}`);
    console.log(`Report MD:   ${path.join(OUT, 'report.md')}`);

    try {
      const chat = await postFieldtestReportToStaffChat(summary);
      log('staff-chat-report', chat.ok, chat.detail);
      summary.staffChatReport = chat;
      fs.writeFileSync(summary.reportJsonPath, JSON.stringify(summary, null, 2));
    } catch (err) {
      log('staff-chat-report', false, String(err).slice(0, 300));
    }

    if (summary.failed > 0) process.exit(1);
  })
  .catch(async (err) => {
    console.error(err);
    const summary = writeReport(new Date().toISOString());
    try {
      const chat = await postFieldtestReportToStaffChat(summary);
      log('staff-chat-report', chat.ok, chat.detail);
    } catch (chatErr) {
      log('staff-chat-report', false, String(chatErr).slice(0, 300));
    }
    process.exit(1);
  });
