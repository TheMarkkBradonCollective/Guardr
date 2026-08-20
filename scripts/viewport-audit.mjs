#!/usr/bin/env node
/**
 * Full viewport audit — mobile, tablet, desktop across all role paths.
 *
 * Staff: uses field-test operator (staff@guardr.co) by default.
 * Client/guard: set VIEWPORT_AUDIT_CLIENT_EMAIL / VIEWPORT_AUDIT_GUARD_EMAIL,
 * or run `supabase/investor_demo_accounts.sql` and use testc@test.com / testg@test.com.
 *
 * Run: npm run viewport:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  BASE,
  CLIENT_PATHS,
  GUARD_PATHS,
  PUBLIC_PATHS,
  STAFF_SECTIONS,
  STAFF_EMAIL,
  STAFF_PASSWORD,
  VIEWPORTS,
  attachDiagnostics,
  checkLayout,
  createLogger,
  dismissOverlays,
  hardReset,
  launchFieldTestBrowser,
  login,
  shot,
  tryScroll,
  visitPath,
} from './field-test-lib.mjs';

const OUT = process.env.GUARDR_VIEWPORT_AUDIT_OUT || '/opt/cursor/artifacts/viewport-audit';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '#Qwerty12345';
const ACCOUNTS = {
  staff: process.env.VIEWPORT_AUDIT_STAFF_EMAIL || STAFF_EMAIL,
  staffPassword: process.env.VIEWPORT_AUDIT_STAFF_PASSWORD || STAFF_PASSWORD,
  client: process.env.VIEWPORT_AUDIT_CLIENT_EMAIL || process.env.DEMO_CLIENT_EMAIL || 'testc@test.com',
  clientPassword: process.env.VIEWPORT_AUDIT_CLIENT_PASSWORD || DEMO_PASSWORD,
  guard: process.env.VIEWPORT_AUDIT_GUARD_EMAIL || process.env.DEMO_GUARD_EMAIL || 'testg@test.com',
  guardPassword: process.env.VIEWPORT_AUDIT_GUARD_PASSWORD || DEMO_PASSWORD,
};

/** Map / full-bleed pages may omit a document heading — not a layout defect. */
const HEADING_OPTIONAL_PATHS = ['/staff/map', '/client/map', '/guard/map'];

fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });

const results = [];
const findings = [];
const log = createLogger(results);
const diagnostics = { pageErrors: [], consoleErrors: [] };

async function checkButtons(page, pathLabel) {
  const viewport = `${page.viewportSize()?.width}x${page.viewportSize()?.height}`;
  const issues = await page.evaluate(() => {
    const out = [];
    const vw = window.innerWidth;

    function isExcluded(el) {
      let node = el;
      while (node && node !== document.body) {
        const tag = node.tagName?.toLowerCase() ?? '';
        const role = node.getAttribute?.('role') ?? '';
        const cls = typeof node.className === 'string' ? node.className : '';

        if (tag === 'nav' || tag === 'aside' || role === 'navigation') return true;
        if (/drawer|rail|sidebar|shell-nav|quick-switch|sfd-rail|sft-rail|sfm-drawer/i.test(cls)) {
          return true;
        }

        const style = getComputedStyle(node);
        const ox = style.overflowX;
        if (
          (ox === 'auto' || ox === 'scroll' || ox === 'overlay') &&
          node.scrollWidth > node.clientWidth + 4
        ) {
          return true;
        }

        if (node.classList?.contains('adm-table-wrap') || node.classList?.contains('overflow-x-auto')) {
          return true;
        }

        node = node.parentElement;
      }
      return false;
    }

    const buttons = document.querySelectorAll('button, a[role="button"], [role="tab"]');
    for (const el of buttons) {
      if (isExcluded(el)) continue;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number.parseFloat(s.opacity) < 0.05) {
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      if (r.left < -2) continue;
      if (r.top > window.innerHeight + 2) continue;
      if (r.right > vw + 2) {
        const text = (el.textContent || '').trim().slice(0, 40);
        out.push(`control clipped right: "${text}" (${Math.round(r.right)}px > ${vw}px)`);
      }
    }
    return out.slice(0, 8);
  });

  for (const issue of issues) findings.push({ label: pathLabel, issue, viewport });
  return issues;
}

async function auditLayout(page, pathLabel) {
  const before = findings.length;
  await checkLayout(page, pathLabel, findings);
  if (HEADING_OPTIONAL_PATHS.some((p) => pathLabel === p || pathLabel.endsWith(p))) {
    for (let i = findings.length - 1; i >= before; i--) {
      if (findings[i]?.issue === 'no heading') findings.splice(i, 1);
    }
  }
}

async function auditRolePaths(page, device, roleLabel, paths) {
  for (const p of paths) {
    const label = `${device}-${roleLabel}${p.replace(/\//g, '-')}`;
    await visitPath(page, log, label, p);
    await dismissOverlays(page);
    await auditLayout(page, p);
    await tryScroll(page, p, findings);
    const buttonIssues = await checkButtons(page, p);
    if (buttonIssues.length > 0) await shot(page, `${label}-layout`);
  }
}

async function run() {
  const browser = await launchFieldTestBrowser();

  for (const [device, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    attachDiagnostics(page, diagnostics);

    for (const p of PUBLIC_PATHS) {
      await visitPath(page, log, `${device}-public${p.replace(/\//g, '-')}`, p);
      await auditLayout(page, p);
      await tryScroll(page, p, findings);
      await checkButtons(page, p);
    }

    await hardReset(page, ctx);
    const staffIn = await login(page, 'staff', ACCOUNTS.staff, ACCOUNTS.staffPassword);
    log(`${device}-staff-login`, !staffIn.failed, staffIn.failed ? staffIn.body.slice(0, 200) : page.url());
    if (!staffIn.failed) {
      await auditRolePaths(page, device, 'staff', STAFF_SECTIONS);
      for (const [path, buttonPattern] of [
        ['/staff/management', /add staff/i],
        ['/staff/credentials', /add credential/i],
        ['/staff/clients', /add customer/i],
      ]) {
        await visitPath(page, log, `${device}-buttons${path.replace(/\//g, '-')}`, path);
        const hasBtn = await page
          .getByRole('button', { name: buttonPattern })
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        log(`${device}-button${path.replace(/\//g, '-')}`, hasBtn, hasBtn ? 'visible' : `missing: ${buttonPattern}`);
      }
    }

    await hardReset(page, ctx);
    const clientIn = await login(page, 'client', ACCOUNTS.client, ACCOUNTS.clientPassword);
    if (clientIn.failed) {
      log(`${device}-client-login`, false, `skipped — set VIEWPORT_AUDIT_CLIENT_EMAIL or run investor_demo_accounts.sql`);
    } else {
      log(`${device}-client-login`, true, page.url());
      await auditRolePaths(page, device, 'client', CLIENT_PATHS);
    }

    await hardReset(page, ctx);
    const guardIn = await login(page, 'guard', ACCOUNTS.guard, ACCOUNTS.guardPassword);
    if (guardIn.failed) {
      log(`${device}-guard-login`, false, `skipped — set VIEWPORT_AUDIT_GUARD_EMAIL or run investor_demo_accounts.sql`);
    } else {
      log(`${device}-guard-login`, true, page.url());
      await auditRolePaths(page, device, 'guard', GUARD_PATHS);
    }

    await ctx.close();
  }

  await browser.close();

  const report = {
    at: new Date().toISOString(),
    base: BASE,
    accounts: ACCOUNTS,
    results,
    findings,
    diagnostics,
    summary: {
      pass: results.filter((r) => r.ok).length,
      fail: results.filter((r) => !r.ok).length,
      layoutIssues: findings.length,
    },
  };

  const reportPath = path.join(OUT, 'viewport-audit-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    '# Viewport audit report',
    '',
    `**Base:** ${BASE}`,
    `**At:** ${report.at}`,
    '',
    `**Pass:** ${report.summary.pass} | **Fail:** ${report.summary.fail} | **Layout issues:** ${report.summary.layoutIssues}`,
    '',
    'Client/guard paths require demo accounts — see `supabase/investor_demo_accounts.sql` or env overrides.',
    '',
  ];

  if (findings.length) {
    md.push('## Layout / button findings', '');
    for (const f of findings) {
      md.push(`- **${f.label}**${f.viewport ? ` (${f.viewport})` : ''}: ${f.issue}`);
    }
    md.push('');
  }

  const fails = results.filter((r) => !r.ok);
  if (fails.length) {
    md.push('## Failed visits / skips', '');
    for (const f of fails) {
      md.push(`- **${f.section}**: ${f.detail.slice(0, 200)}`);
    }
  }

  fs.writeFileSync(path.join(OUT, 'viewport-audit-report.md'), md.join('\n'));
  console.log(`\nReport: ${reportPath}`);
  console.log(`Findings: ${findings.length}, Failed visits: ${fails.length}`);

  return report;
}

run()
  .then((report) => {
    const staffLoginFailed = report.results.some((r) => r.section.endsWith('-staff-login') && !r.ok);
    const layoutIssues = report.summary.layoutIssues;
    process.exit(staffLoginFailed || layoutIssues > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(2);
  });
