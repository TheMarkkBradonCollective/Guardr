import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatFieldtestStaffChatReport, formatFieldtestMarkdownReport } from './field-test-lib.mjs';

describe('field test reports in plain English', () => {
  const sample = {
    runId: '20260814000000',
    base: 'https://www.guardr.co',
    marketCity: 'Sacramento',
    passed: 10,
    failed: 2,
    startedAt: '2026-08-14T00:00:00.000Z',
    finishedAt: '2026-08-14T00:30:00.000Z',
    emails: { client: 'jane@guardr.test', guard: 'john@guardr.test' },
    cleanup: {
      before: { ok: true, found: { guards: 1, clients: 1, staff: 2 }, verify: { remaining: { guards: 0, clients: 0, staff: 0, testJobs: 0 } } },
      after: { ok: true, found: { guards: 1, clients: 1, staff: 5 }, verify: { remaining: { guards: 0, clients: 0, staff: 0, testJobs: 0 } } },
    },
    results: [
      { section: 'staff-signup-market-check', ok: true, detail: 'Sacramento:open' },
      { section: 'client-payment-gate', ok: false, detail: 'no stripe redirect: https://www.guardr.co/client/payments' },
      { section: 'desktop-client-login', ok: false, detail: 'https://www.guardr.co/?auth=sign-in&ar=client' },
    ],
    fixesApplied: [],
    stripe: { liveMode: true },
    reportJsonPath: '/tmp/report.json',
    screenshotsDir: '/tmp/screenshots',
  };

  it('writes staff chat report as readable sentences', () => {
    const text = formatFieldtestStaffChatReport(sample);
    assert.match(text, /Field test report \(20260814000000\)/);
    assert.match(text, /10 checks passed and 2 failed/);
    assert.match(text, /Before the run, we removed/);
    assert.match(text, /What did not work/);
    assert.match(text, /Jane pays for the job through Stripe did not work/);
    assert.doesNotMatch(text, /client-payment-gate/);
    assert.doesNotMatch(text, /g1\/c1\/s2/);
    assert.doesNotMatch(text, /JSON\.stringify/);
  });

  it('writes markdown report as readable sentences', () => {
    const text = formatFieldtestMarkdownReport(sample);
    assert.match(text, /We ran a full field test/);
    assert.match(text, /What did not work/);
    assert.doesNotMatch(text, /\| Phase \| OK \|/);
  });
});
