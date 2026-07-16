import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appendBriefingAck, guardAcknowledgedBriefing, jobHasBriefingContent } from './briefingAck.ts';
import {
  createNotReadyBriefingViolation,
  createStartSkipViolations,
  guardCanDisputeViolation,
  mergeShiftAuditViolations,
  processAutoUpholdDisputes,
} from './shiftAuditViolations.ts';
import { canClientReviewEndCheckpoint, summarizeStartCheckpointSkips } from './shiftCheckpointReview.ts';
import type { SecurityRequest } from '../types.ts';

describe('briefingAck', () => {
  it('detects briefing content from site instructions', () => {
    assert.equal(jobHasBriefingContent({ siteInstructions: 'Use north gate' }), true);
    assert.equal(jobHasBriefingContent({}), false);
  });

  it('tracks acknowledgments per guard', () => {
    const acks = appendBriefingAck(undefined, 'g1');
    assert.equal(guardAcknowledgedBriefing({ briefingAcknowledgments: acks }, 'g1'), true);
  });
});

describe('shiftAuditViolations', () => {
  it('creates skip violations for start checkpoint', () => {
    const rows = createStartSkipViolations('g1', {
      selfAuditSkipped: true,
      locationPhotoSkipped: true,
    });
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.status, 'auto-flagged');
  });

  it('auto-upholds open disputes after deadline', () => {
    const violation = createNotReadyBriefingViolation('g1');
    violation.dispute!.disputeDeadlineAt = new Date(Date.now() - 1000).toISOString();
    const next = processAutoUpholdDisputes([violation], Date.now());
    assert.equal(next[0]?.status, 'upheld');
  });

  it('allows guard dispute before deadline', () => {
    const violation = createNotReadyBriefingViolation('g1');
    assert.equal(guardCanDisputeViolation(violation), true);
  });
});

describe('shiftCheckpointReview', () => {
  it('summarizes skipped start checkpoint items', () => {
    const req = {
      status: 'in-progress',
      checkInAudit: {
        checkedAt: new Date().toISOString(),
        selfAuditSkipped: true,
        locationPhotoSkipped: true,
      },
    } as SecurityRequest;
    const summary = summarizeStartCheckpointSkips(req);
    assert.ok(summary.labels.includes('Guard skipped self-audit'));
    assert.ok(summary.labels.includes('Guard skipped location photo'));
  });

  it('allows end review within 48h window', () => {
    const req = {
      status: 'completed',
      checkOutAudit: { checkedAt: new Date().toISOString() },
    } as SecurityRequest;
    assert.equal(canClientReviewEndCheckpoint(req), true);
  });
});
