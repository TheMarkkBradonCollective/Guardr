import { clientViolationCategoryLabel } from './clientViolations';
import { guardCanDisputeViolation } from './shiftAuditViolations';
import type { SecurityGuard, SecurityRequest, ShiftAuditViolation } from '../types';

export type GuardContractViolationKind =
  | 'shift-audit'
  | 'client-report'
  | 'no-show'
  | 'failed-audit';

export type GuardContractViolationStatusTone =
  | 'neutral'
  | 'open'
  | 'review'
  | 'accepted'
  | 'rejected';

export interface GuardContractViolationDetailRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface GuardContractViolation {
  id: string;
  kind: GuardContractViolationKind;
  title: string;
  jobTitle: string;
  requestId?: string;
  violationId?: string;
  occurredAt: string;
  description: string;
  statusLabel: string | null;
  statusTone: GuardContractViolationStatusTone;
  canDispute: boolean;
  disputeNote?: string;
  details: GuardContractViolationDetailRow[];
  avoidTips: string[];
  disputeRejected: boolean;
  disputeAccepted: boolean;
}

const ROLLING_SHIFT_WINDOW = 100;

function guardAssignedJobs(guardId: string, requests: SecurityRequest[]): SecurityRequest[] {
  return requests
    .filter(
      (r) =>
        r.assignedGuardId === guardId &&
        ['accepted', 'in-progress', 'completed', 'closed', 'cancelled'].includes(r.status)
    )
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

function isVisibleShiftAuditViolation(violation: ShiftAuditViolation): boolean {
  return !['verified', 'expired'].includes(violation.status);
}

function shiftAuditStatus(
  violation: ShiftAuditViolation
): { label: string | null; tone: GuardContractViolationStatusTone; rejected: boolean; accepted: boolean } {
  if (violation.status === 'dismissed') {
    if (violation.dispute?.guardSubmittedAt) {
      return { label: 'Dispute accepted', tone: 'accepted', rejected: false, accepted: true };
    }
    return { label: null, tone: 'neutral', rejected: false, accepted: false };
  }
  if (violation.status === 'upheld') {
    return { label: 'Dispute rejected', tone: 'rejected', rejected: true, accepted: false };
  }
  if (violation.status === 'dispute-open' && violation.dispute?.guardSubmittedAt) {
    return { label: 'Dispute under review', tone: 'review', rejected: false, accepted: false };
  }
  if (['auto-flagged', 'flagged'].includes(violation.status)) {
    return { label: 'Open', tone: 'open', rejected: false, accepted: false };
  }
  return { label: null, tone: 'neutral', rejected: false, accepted: false };
}

function shiftAuditDetails(
  request: SecurityRequest,
  violation: ShiftAuditViolation
): GuardContractViolationDetailRow[] {
  const rows: GuardContractViolationDetailRow[] = [
    { label: 'Job', value: request.title },
    { label: 'Checkpoint', value: violation.checkpoint },
    { label: 'Category', value: violation.category },
    { label: 'Reported', value: formatViolationDate(violation.createdAt) },
  ];

  if (violation.source === 'client') {
    rows.push({
      label: 'Reported by',
      value: violation.reportedByClientName ?? request.clientName,
    });
  }

  rows.push({ label: 'Issue', value: violation.description, highlight: true });
  return rows;
}

function shiftAuditAvoidTips(violation: ShiftAuditViolation): string[] {
  if (violation.checkpoint === 'briefing') {
    return [
      'Read the full site briefing before you tap Arrived on site.',
      'Acknowledge the briefing on site before clocking in.',
    ];
  }
  if (violation.checkpoint === 'start') {
    return [
      'Complete every start-of-shift self-audit item before clocking in.',
      'Take a clear location photo at your post when you arrive.',
    ];
  }
  return [
    'Complete your end-of-shift self-audit and location photo before clocking out.',
    'Submit a detailed end-of-shift report when anything notable happened on site.',
  ];
}

function buildShiftAuditViolationRows(
  guardId: string,
  requests: SecurityRequest[]
): GuardContractViolation[] {
  const rows: GuardContractViolation[] = [];

  for (const request of guardAssignedJobs(guardId, requests).slice(0, ROLLING_SHIFT_WINDOW)) {
    for (const violation of request.shiftAuditViolations ?? []) {
      if (violation.guardId !== guardId) continue;
      if (!isVisibleShiftAuditViolation(violation)) continue;

      const status = shiftAuditStatus(violation);
      rows.push({
        id: `shift-audit-${violation.id}`,
        kind: 'shift-audit',
        title: violation.label,
        jobTitle: request.title,
        requestId: request.id,
        violationId: violation.id,
        occurredAt: violation.createdAt,
        description: violation.description,
        statusLabel: status.label,
        statusTone: status.tone,
        canDispute: guardCanDisputeViolation(violation),
        disputeNote: violation.dispute?.guardNote,
        details: shiftAuditDetails(request, violation),
        avoidTips: shiftAuditAvoidTips(violation),
        disputeRejected: status.rejected,
        disputeAccepted: status.accepted,
      });
    }
  }

  return rows;
}

function buildClientReportRows(guardId: string, requests: SecurityRequest[]): GuardContractViolation[] {
  const rows: GuardContractViolation[] = [];

  for (const request of guardAssignedJobs(guardId, requests)) {
    for (const report of request.clientViolationReports ?? []) {
      if (report.target !== 'guard' || report.guardId !== guardId) continue;
      const title = clientViolationCategoryLabel('guard', report.category);
      rows.push({
        id: `client-report-${report.id}`,
        kind: 'client-report',
        title,
        jobTitle: request.title,
        requestId: request.id,
        occurredAt: report.reportedAt,
        description: report.description,
        statusLabel: 'Client reported',
        statusTone: 'open',
        canDispute: false,
        details: [
          { label: 'Job', value: request.title },
          { label: 'Category', value: title },
          { label: 'Reported', value: formatViolationDate(report.reportedAt) },
          {
            label: 'Client note',
            value: report.description,
            highlight: true,
          },
        ],
        avoidTips: [
          'Arrive on time and in full uniform for every shift.',
          'Follow post orders and communicate delays to the client through Guardr.',
        ],
        disputeRejected: false,
        disputeAccepted: false,
      });
    }
  }

  return rows;
}

function buildNoShowRows(guardId: string, requests: SecurityRequest[]): GuardContractViolation[] {
  return guardAssignedJobs(guardId, requests)
    .filter((request) => request.noShow === true)
    .map((request) => ({
      id: `no-show-${request.id}`,
      kind: 'no-show' as const,
      title: 'No-show',
      jobTitle: request.title,
      requestId: request.id,
      occurredAt: request.startDate,
      description: 'You were marked as a no-show for this scheduled shift.',
      statusLabel: 'Contract violation',
      statusTone: 'open' as const,
      canDispute: false,
      details: [
        { label: 'Job', value: request.title },
        { label: 'Scheduled start', value: formatViolationDate(request.startDate) },
        {
          label: 'Issue',
          value: 'Missed scheduled shift without approved coverage.',
          highlight: true,
        },
      ],
      avoidTips: [
        'Update your availability when you cannot work a scheduled shift.',
        'Message the client or crew lead immediately if an emergency will make you late.',
      ],
      disputeRejected: false,
      disputeAccepted: false,
    }));
}

function buildFailedAuditRows(guard: SecurityGuard): GuardContractViolation[] {
  const count = guard.failedAudits ?? 0;
  if (count <= 0) return [];

  return [
    {
      id: `failed-audit-${guard.id}`,
      kind: 'failed-audit',
      title: 'Failed uniform audit',
      jobTitle: 'Account record',
      occurredAt: new Date().toISOString(),
      description: `${count} uniform self-audit failure${count === 1 ? '' : 's'} on record.`,
      statusLabel: 'Contract violation',
      statusTone: 'open',
      canDispute: false,
      details: [
        { label: 'Failures on record', value: String(count), highlight: true },
        {
          label: 'Policy',
          value: 'Uniform and appearance must match post requirements on every shift.',
        },
      ],
      avoidTips: [
        'Complete your start-of-shift self-audit in good lighting before clocking in.',
        'Keep required uniform items ready before you leave for the site.',
      ],
      disputeRejected: false,
      disputeAccepted: false,
    },
  ];
}

export function buildGuardContractViolations(
  guard: SecurityGuard,
  requests: SecurityRequest[]
): GuardContractViolation[] {
  const rows = [
    ...buildShiftAuditViolationRows(guard.id, requests),
    ...buildClientReportRows(guard.id, requests),
    ...buildNoShowRows(guard.id, requests),
    ...buildFailedAuditRows(guard),
  ];

  return rows.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}

export function countGuardContractViolations(
  guard: SecurityGuard,
  requests: SecurityRequest[]
): number {
  return buildGuardContractViolations(guard, requests).length;
}

export function formatViolationDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatViolationListDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
}

export function formatContractViolationSummary(count: number): string {
  if (count <= 0) return '';
  if (count === 1) return '1 contract violation';
  return `${count} contract violations`;
}
