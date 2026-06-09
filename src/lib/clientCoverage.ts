import { SecurityGuard, SecurityRequest } from '../types';
import { formatDuration } from './dates';

export interface CoverageSummary {
  activeAssignments: number;
  guardsOnDuty: number;
  guardsArriving: number;
  arrivingTimeLabel?: string;
}

export type SiteStatusLevel = 'secured' | 'attention' | 'incident';

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  label: string;
  requestId: string;
  sortKey: number;
}

export interface GuardOnDutyRow {
  guard: SecurityGuard;
  request: SecurityRequest;
  startedAt: string;
  hoursWorkedLabel: string;
  status: 'on-duty' | 'arriving';
}

export interface ClientReportCard {
  id: string;
  requestId: string;
  title: string;
  type: 'incident' | 'activity' | 'property';
  summary: string;
  submittedAt: string;
  siteName: string;
}

const ACTIVE_STATUSES = new Set<SecurityRequest['status']>(['accepted', 'in-progress']);

export function computeCoverageSummary(requests: SecurityRequest[]): CoverageSummary {
  const active = requests.filter((r) => ACTIVE_STATUSES.has(r.status));
  const onDuty = requests.filter((r) => r.status === 'in-progress');
  const now = Date.now();
  const arriving = requests.filter(
    (r) => r.status === 'accepted' && new Date(r.startDate).getTime() > now
  );
  const nextArrival = arriving.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )[0];

  return {
    activeAssignments: active.length,
    guardsOnDuty: onDuty.length,
    guardsArriving: arriving.length,
    arrivingTimeLabel: nextArrival
      ? new Date(nextArrival.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : undefined,
  };
}

export function computeSiteStatus(requests: SecurityRequest[]): SiteStatusLevel {
  const live = requests.filter((r) => r.status === 'in-progress');
  if (live.some((r) => r.checkOutAudit?.incidentReport?.hasIncident)) return 'incident';
  if (live.some((r) => !r.checkInAudit?.readyForDuty)) return 'attention';
  return 'secured';
}

export function computeHoursWorkedLabel(startIso: string): string {
  const start = new Date(startIso).getTime();
  const hours = Math.max(0, (Date.now() - start) / 3600000);
  return formatDuration(Math.round(hours * 100) / 100);
}

export function buildGuardRows(
  requests: SecurityRequest[],
  guards: SecurityGuard[]
): GuardOnDutyRow[] {
  const rows: GuardOnDutyRow[] = [];
  for (const req of requests) {
    if (!req.assignedGuardId || !ACTIVE_STATUSES.has(req.status)) continue;
    const guard = guards.find((g) => g.id === req.assignedGuardId);
    if (!guard) continue;
    const startedAt = req.checkInAudit?.checkedAt ?? req.startDate;
    rows.push({
      guard,
      request: req,
      startedAt,
      hoursWorkedLabel: req.status === 'in-progress' ? computeHoursWorkedLabel(startedAt) : '—',
      status: req.status === 'in-progress' ? 'on-duty' : 'arriving',
    });
  }
  return rows.sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'on-duty' ? -1 : 1;
  });
}

export function buildActivityFeed(
  requests: SecurityRequest[],
  guards: SecurityGuard[]
): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];

  for (const req of requests) {
    const guardName = guards.find((g) => g.id === req.assignedGuardId)?.name ?? 'Guard';

    if (req.checkInAudit?.checkedAt) {
      items.push({
        id: `${req.id}-arrived`,
        timestamp: req.checkInAudit.checkedAt,
        label: `${guardName} arrived on site`,
        requestId: req.id,
        sortKey: new Date(req.checkInAudit.checkedAt).getTime(),
      });
    }
    if (req.checkInAudit?.readyForDuty) {
      items.push({
        id: `${req.id}-audit`,
        timestamp: req.checkInAudit.checkedAt,
        label: 'Self audit completed',
        requestId: req.id,
        sortKey: new Date(req.checkInAudit.checkedAt).getTime() + 1,
      });
    }
    if (req.checkOutAudit?.incidentReport?.hasIncident) {
      items.push({
        id: `${req.id}-incident`,
        timestamp: req.checkOutAudit.checkedAt,
        label: 'Incident report submitted',
        requestId: req.id,
        sortKey: new Date(req.checkOutAudit.checkedAt).getTime(),
      });
    }
    if (req.checkOutAudit?.dailyActivityReport) {
      items.push({
        id: `${req.id}-dar`,
        timestamp: req.checkOutAudit.checkedAt,
        label: 'Patrol report submitted',
        requestId: req.id,
        sortKey: new Date(req.checkOutAudit.checkedAt).getTime() + 2,
      });
    }
    if (req.status === 'completed' && req.checkOutAudit?.checkedAt) {
      items.push({
        id: `${req.id}-complete`,
        timestamp: req.checkOutAudit.checkedAt,
        label: 'Job completed',
        requestId: req.id,
        sortKey: new Date(req.checkOutAudit.checkedAt).getTime() + 3,
      });
    }
    for (const mid of req.midShiftAudits ?? []) {
      items.push({
        id: `${req.id}-mid-${mid.checkedAt}`,
        timestamp: mid.checkedAt,
        label: 'Mid-job verification logged',
        requestId: req.id,
        sortKey: new Date(mid.checkedAt).getTime(),
      });
    }
  }

  return items.sort((a, b) => b.sortKey - a.sortKey);
}

export function buildRecentReports(requests: SecurityRequest[]): ClientReportCard[] {
  const cards: ClientReportCard[] = [];

  for (const req of requests) {
    const site = req.siteName || req.location;
    if (req.checkOutAudit?.incidentReport?.hasIncident) {
      cards.push({
        id: `${req.id}-inc`,
        requestId: req.id,
        title: req.title,
        type: 'incident',
        summary: req.checkOutAudit.incidentReport.description || 'Incident logged during job.',
        submittedAt: req.checkOutAudit.checkedAt,
        siteName: site,
      });
    }
    if (req.checkOutAudit?.dailyActivityReport) {
      cards.push({
        id: `${req.id}-act`,
        requestId: req.id,
        title: req.title,
        type: 'activity',
        summary: req.checkOutAudit.dailyActivityReport,
        submittedAt: req.checkOutAudit.checkedAt,
        siteName: site,
      });
    }
    for (const report of req.reports ?? []) {
      cards.push({
        id: report.id,
        requestId: req.id,
        title: req.title,
        type: report.type === 'property-damage' ? 'property' : report.type === 'incident' ? 'incident' : 'activity',
        summary: report.notes,
        submittedAt: report.submittedAt,
        siteName: site,
      });
    }
  }

  return cards.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function getUpcomingCoverage(requests: SecurityRequest[]): SecurityRequest[] {
  const now = Date.now();
  return requests
    .filter((r) => {
      if (r.status === 'closed' || r.status === 'completed') return false;
      if (r.status === 'in-progress') return false;
      return new Date(r.startDate).getTime() >= now - 3600000 || ['accepted', 'open', 'pending-review'].includes(r.status);
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 8);
}

export function formatCoverageDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Tonight';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function formatShiftTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const time = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${time(start)} - ${time(end)}`;
}
