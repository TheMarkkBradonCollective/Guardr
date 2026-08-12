import { formatOperationalMoney, OperationalFinancials } from './operationalFinancials';
import { computeAnalytics, PlatformStats } from './staffOps';
import { Client, SecurityGuard, SecurityRequest } from '../types';

export type OverviewVisualTone = 'primary' | 'success' | 'warning' | 'info' | 'muted';

export interface OverviewSegment {
  label: string;
  value: number;
  tone: OverviewVisualTone;
}

export interface OverviewMeter {
  label: string;
  value: string;
  pct: number;
  sub?: string;
  tone?: OverviewVisualTone;
}

export interface OverviewRingStat {
  label: string;
  value: string;
  pct: number;
  sub?: string;
}

export interface OverviewVisualCard {
  id: string;
  title: string;
  kind: 'segments' | 'meters' | 'ring' | 'rings';
  segments?: OverviewSegment[];
  meters?: OverviewMeter[];
  ring?: OverviewRingStat;
  rings?: OverviewRingStat[];
  footnote?: string;
}

export interface WeeklyJobPoint {
  label: string;
  count: number;
  heightPct: number;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pctOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return clampPct((part / total) * 100);
}

export function computeWeeklyJobSeries(requests: SecurityRequest[]): WeeklyJobPoint[] {
  const counts = Array(7).fill(0);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  for (const req of requests) {
    if (req.status !== 'completed') continue;
    const completedAt = req.checkOutAudit?.checkedAt ?? req.endDate;
    if (!completedAt) continue;
    const d = new Date(completedAt);
    if (Number.isNaN(d.getTime()) || d < startOfWeek) continue;
    const dayIndex = (d.getDay() + 6) % 7;
    counts[dayIndex] += 1;
  }

  const max = Math.max(...counts, 1);
  return counts.map((count, i) => ({
    label: DAY_LABELS[i],
    count,
    heightPct: Math.max(count > 0 ? 12 : 0, Math.round((count / max) * 100)),
  }));
}

export function buildJobPipelineSegments(requests: SecurityRequest[]): OverviewSegment[] {
  const pendingReview = requests.filter((r) => r.status === 'pending-review').length;
  const open = requests.filter((r) => r.status === 'open').length;
  const accepted = requests.filter((r) => r.status === 'accepted').length;
  const inProgress = requests.filter((r) => r.status === 'in-progress').length;
  const completed = requests.filter((r) => r.status === 'completed' || r.status === 'closed').length;

  return [
    { label: 'Completed', value: completed, tone: 'muted' as const },
    { label: 'On site', value: inProgress, tone: 'primary' as const },
    { label: 'Picked up', value: accepted, tone: 'info' as const },
    { label: 'Open offers', value: open, tone: 'success' as const },
    { label: 'Awaiting approval', value: pendingReview, tone: 'warning' as const },
  ].filter((segment) => segment.value > 0);
}

export function buildPeopleSegments(guards: SecurityGuard[], clients: Client[]): OverviewSegment[] {
  const fieldGuards = guards.filter((g) => !g.isStaff).length;
  const staffCount = guards.filter((g) => g.isStaff).length;

  return [
    { label: 'Clients', value: clients.length, tone: 'primary' as const },
    { label: 'Field guards', value: fieldGuards, tone: 'success' as const },
    { label: 'Staff', value: staffCount, tone: 'info' as const },
  ].filter((segment) => segment.value > 0);
}

export function buildRevenueMixSegments(financials: OperationalFinancials): OverviewSegment[] {
  const segments: OverviewSegment[] = [];
  if (financials.grossIncomeCard > 0 || financials.grossIncome > 0) {
    segments.push({
      label: 'Card via Stripe',
      value: financials.grossIncomeCard || financials.grossIncome,
      tone: 'primary',
    });
  }
  return segments;
}

export function buildOperationsSnapshotCards(
  stats: PlatformStats,
  financials: OperationalFinancials,
  guards: SecurityGuard[],
  clients: Client[],
  requests: SecurityRequest[]
): OverviewVisualCard[] {
  const pipeline = buildJobPipelineSegments(requests);
  const people = buildPeopleSegments(guards, clients);
  const revenueMix = buildRevenueMixSegments(financials);
  const pendingReview = requests.filter((r) => r.status === 'pending-review').length;
  const outstandingTotal = financials.clientOwed + financials.guardPayoutsDue + financials.stripeDepositPending;
  const feeCollectionPct = pctOf(financials.platformFeesCollected, financials.platformFeesTotal);
  const settlementPct = pctOf(financials.settledJobCount, financials.paidJobCount);

  const cards: OverviewVisualCard[] = [
    {
      id: 'job-pipeline',
      title: 'Job pipeline',
      kind: 'segments',
      segments: pipeline.length > 0 ? pipeline : [{ label: 'No jobs yet', value: 1, tone: 'muted' }],
      footnote: `${requests.length} total · ${stats.completedJobs} completed · ${financials.jobsInProgress} on site`,
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      kind: 'meters',
      meters: [
        {
          label: 'Open offers',
          value: String(financials.openMarketplaceJobs),
          pct: pctOf(financials.openMarketplaceJobs, Math.max(stats.activeJobs, 1)),
          sub: `${pendingReview} awaiting approval`,
          tone: 'success',
        },
        {
          label: 'Active pipeline',
          value: String(stats.activeJobs),
          pct: pctOf(stats.activeJobs, Math.max(requests.length, 1)),
          tone: 'primary',
        },
      ],
    },
    {
      id: 'people',
      title: 'People',
      kind: 'segments',
      segments: people.length > 0 ? people : [{ label: 'No accounts', value: 1, tone: 'muted' }],
      footnote: `${clients.length} clients · ${guards.filter((g) => !g.isStaff).length} field guards · ${guards.filter((g) => g.isStaff).length} staff`,
    },
    {
      id: 'settlements',
      title: 'Guard settlements',
      kind: 'ring',
      ring: {
        label: 'Fully settled',
        value: `${settlementPct}%`,
        pct: settlementPct,
        sub: `${financials.settledJobCount} of ${financials.paidJobCount || 0} paid jobs · ${formatOperationalMoney(financials.guardPayoutsPaid)} paid`,
      },
    },
    {
      id: 'collections',
      title: 'Client collections',
      kind: revenueMix.length > 0 ? 'segments' : 'meters',
      segments: revenueMix.length > 0 ? revenueMix : undefined,
      meters:
        revenueMix.length === 0
          ? [
              {
                label: 'Recorded income',
                value: formatOperationalMoney(0),
                pct: 0,
                sub: 'No client payments recorded yet',
                tone: 'muted',
              },
            ]
          : undefined,
      footnote: `${formatOperationalMoney(financials.grossIncomeCard)} via Stripe`,
    },
    {
      id: 'risk',
      title: 'Approvals & risk',
      kind: 'meters',
      meters: [
        {
          label: 'Approvals queue',
          value: String(stats.pendingApprovals),
          pct: pctOf(stats.pendingApprovals, 20),
          sub: stats.pendingApprovals === 0 ? 'Queue clear' : 'Items waiting for review',
          tone: stats.pendingApprovals > 0 ? 'warning' : 'success',
        },
        {
          label: 'Open incidents',
          value: String(stats.activeIncidents),
          pct: pctOf(stats.activeIncidents, 10),
          sub: stats.activeIncidents === 0 ? 'No open incidents' : 'Checkout reports need follow-up',
          tone: stats.activeIncidents > 0 ? 'warning' : 'success',
        },
        {
          label: 'Outstanding payments',
          value: formatOperationalMoney(outstandingTotal),
          pct: pctOf(outstandingTotal, Math.max(financials.grossIncome, 1)),
          sub: outstandingTotal > 0 ? 'Client, guard, or Stripe action needed' : 'All payments current',
          tone: outstandingTotal > 0 ? 'warning' : 'success',
        },
        {
          label: 'Company payout',
          value: `${feeCollectionPct}%`,
          pct: feeCollectionPct,
          sub: `${formatOperationalMoney(financials.platformFeesCollected)} of ${formatOperationalMoney(financials.platformFeesTotal)}`,
          tone: 'primary',
        },
      ],
    },
  ];

  return cards;
}

export function buildPlatformPulseCards(
  stats: PlatformStats,
  requests: SecurityRequest[],
  guards: SecurityGuard[],
  clients: Client[],
  showFull: boolean
): OverviewVisualCard[] {
  const analytics = computeAnalytics(guards, clients, requests);
  const fieldGuards = guards.filter((g) => !g.isStaff).length;
  const onDutyPct = pctOf(stats.onDutyGuards, Math.max(fieldGuards, 1));
  const activeGuardPct = pctOf(stats.assignedGuardsOnJobs, Math.max(fieldGuards, 1));

  const cards: OverviewVisualCard[] = [
    {
      id: 'completion',
      title: 'Job completion',
      kind: 'ring',
      ring: {
        label: 'Completion rate',
        value: `${analytics.jobCompletionRate}%`,
        pct: analytics.jobCompletionRate,
        sub: `${analytics.completedJobs} of ${requests.length} jobs finished`,
      },
    },
    {
      id: 'coverage',
      title: 'Field coverage',
      kind: 'meters',
      meters: [
        {
          label: 'Guards on site',
          value: String(stats.onDutyGuards),
          pct: onDutyPct,
          sub: `${stats.onDutyGuards} in-progress job${stats.onDutyGuards === 1 ? '' : 's'} right now`,
          tone: 'primary',
        },
        {
          label: 'Assigned & active',
          value: String(stats.assignedGuardsOnJobs),
          pct: activeGuardPct,
          sub: `${stats.assignedGuardsOnJobs} guard${stats.assignedGuardsOnJobs === 1 ? '' : 's'} on picked-up or live jobs`,
          tone: 'info',
        },
      ],
    },
    {
      id: 'quality',
      title: 'Quality signals',
      kind: 'rings',
      rings: [
        {
          label: 'Incident rate',
          value: `${analytics.incidentRate}%`,
          pct: analytics.incidentRate,
          sub: 'Of completed jobs',
        },
        {
          label: 'Repeat clients',
          value: String(analytics.repeatClients),
          pct: pctOf(analytics.repeatClients, Math.max(analytics.clientGrowth, 1)),
          sub: 'Returned for more work',
        },
      ],
    },
  ];

  if (showFull) {
    cards.push({
      id: 'queue-health',
      title: 'Queue pressure',
      kind: 'meters',
      meters: [
        {
          label: 'Approvals backlog',
          value: String(stats.pendingApprovals),
          pct: pctOf(stats.pendingApprovals, 20),
          tone: stats.pendingApprovals > 5 ? 'warning' : 'primary',
        },
        {
          label: 'Payments needing action',
          value: String(stats.paymentsNeedingAction),
          pct: pctOf(stats.paymentsNeedingAction, 15),
          tone: stats.paymentsNeedingAction > 0 ? 'warning' : 'success',
        },
      ],
    });
  }

  return cards;
}

export function buildQueuePieSegments(stats: PlatformStats): OverviewSegment[] {
  const segments: OverviewSegment[] = [
    { label: 'Job offers', value: stats.pendingJobApprovals, tone: 'warning' },
    { label: 'Schedule changes', value: stats.pendingScheduleChanges, tone: 'info' },
    { label: 'Credentials', value: stats.pendingCertApprovals, tone: 'primary' },
    { label: 'Applications', value: stats.pendingAccountApplications, tone: 'success' },
    { label: 'Payments', value: stats.paymentsNeedingAction, tone: 'muted' },
  ];
  return segments.filter((segment) => segment.value > 0);
}

export function buildPlatformHealthPieSegments(stats: PlatformStats): OverviewSegment[] {
  const healthy = stats.platformHealthy ? 1 : 0;
  const segments: OverviewSegment[] = [
    { label: 'Healthy', value: healthy, tone: 'success' },
    { label: 'Review queue', value: stats.pendingReviews, tone: 'warning' },
    { label: 'Incidents', value: stats.activeIncidents, tone: 'primary' },
    { label: 'Payments', value: stats.paymentsNeedingAction, tone: 'info' },
  ];
  return segments.filter((segment) => segment.value > 0);
}

export function buildClientCoveragePieSegments(
  active: number,
  onDuty: number,
  arriving: number,
  open: number,
  scheduled: number,
  completed: number,
): OverviewSegment[] {
  const segments: OverviewSegment[] = [
    { label: 'Live', value: active, tone: 'success' },
    { label: 'On duty', value: onDuty, tone: 'primary' },
    { label: 'Arriving', value: arriving, tone: 'info' },
    { label: 'Open', value: open, tone: 'warning' },
    { label: 'Scheduled', value: scheduled, tone: 'muted' },
    { label: 'Completed', value: completed, tone: 'muted' },
  ];
  return segments.filter((segment) => segment.value > 0);
}
