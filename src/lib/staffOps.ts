import { Client, SecurityGuard, SecurityRequest } from '../types';
import { PLATFORM_FEE_PER_HOUR } from './payments';

export type StaffSection =
  | 'overview'
  | 'approvals'
  | 'live-jobs'
  | 'map'
  | 'my-jobs'
  | 'my-pay'
  | 'my-help'
  | 'guards'
  | 'clients'
  | 'reports'
  | 'incidents'
  | 'support'
  | 'payments'
  | 'disputes'
  | 'analytics'
  | 'settings'
  | 'profile';

export type StaffShiftSection = 'map' | 'my-jobs' | 'my-pay' | 'my-help';

const SHIFT_SECTIONS: StaffShiftSection[] = ['map', 'my-jobs', 'my-pay', 'my-help'];

export function isStaffShiftSection(section: StaffSection): section is StaffShiftSection {
  return SHIFT_SECTIONS.includes(section as StaffShiftSection);
}

export type GuardShiftTab = 'map' | 'opportunities' | 'earnings' | 'support'; // subset of GuardDashboard tabs

export function staffSectionToShiftTab(section: StaffShiftSection): GuardShiftTab {
  switch (section) {
    case 'map':
      return 'map';
    case 'my-jobs':
      return 'opportunities';
    case 'my-pay':
      return 'earnings';
    case 'my-help':
      return 'support';
  }
}

export type DispatchJobStatus =
  | 'pending-assignment'
  | 'active'
  | 'in-progress'
  | 'completed'
  | 'incident-flagged';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PlatformStats {
  platformHealthy: boolean;
  pendingReviews: number;
  activeIncidents: number;
  paymentHolds: number;
  activeJobs: number;
  onDutyGuards: number;
  activeClients: number;
  pendingApprovals: number;
  completedShiftsToday: number;
}

export interface OpsActivityItem {
  id: string;
  timestamp: string;
  message: string;
  sortKey: number;
}

export interface OpsIncident {
  id: string;
  requestId: string;
  severity: IncidentSeverity;
  location: string;
  guardName: string;
  clientName: string;
  description: string;
  timestamp: string;
  status: 'open' | 'reviewing' | 'resolved';
}

export interface OpsDispute {
  id: string;
  type: 'payment' | 'no-show' | 'safety' | 'service';
  jobTitle: string;
  guardName: string;
  clientName: string;
  guardStatement: string;
  clientStatement: string;
  status: 'open' | 'held' | 'resolved';
  openedAt: string;
}

export function getDispatchStatus(req: SecurityRequest): DispatchJobStatus {
  if (req.checkOutAudit?.incidentReport?.hasIncident && req.status === 'in-progress') {
    return 'incident-flagged';
  }
  if (req.status === 'completed' || req.status === 'closed') return 'completed';
  if (req.status === 'in-progress') return 'in-progress';
  if (req.status === 'accepted') return 'active';
  return 'pending-assignment';
}

export const DISPATCH_STATUS_LABEL: Record<DispatchJobStatus, { emoji: string; label: string; className: string }> = {
  'pending-assignment': { emoji: '🟡', label: 'Pending Assignment', className: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  active: { emoji: '🟢', label: 'Active', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  'in-progress': { emoji: '🔵', label: 'In Progress', className: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  completed: { emoji: '⚫', label: 'Completed', className: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  'incident-flagged': { emoji: '🔴', label: 'Incident Flagged', className: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

export function computePlatformStats(
  guards: SecurityGuard[],
  clients: Client[],
  requests: SecurityRequest[]
): PlatformStats {
  const pendingGuardApprovals = guards.filter((g) => !g.verified && !g.isStaff).length;
  const pendingClientApprovals = clients.filter((c) => c.approved === false).length;
  const pendingJobReviews = requests.filter((r) => r.status === 'pending-review').length;
  const pendingCerts = guards.reduce(
    (n, g) => n + g.certifications.filter((c) => c.status === 'pending').length,
    0
  );
  const pendingApprovals = pendingGuardApprovals + pendingClientApprovals + pendingCerts;
  const pendingReviews = pendingJobReviews + pendingApprovals;
  const activeIncidents = buildIncidents(requests, guards).filter((i) => i.status === 'open').length;
  const paymentHolds = requests.filter(
    (r) => r.status === 'completed' && !r.ratingGiven
  ).length + clients.filter((c) => !c.approved).length;

  const activeJobs = requests.filter((r) =>
    ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
  ).length;
  const onDutyGuards = requests.filter((r) => r.status === 'in-progress').length;
  const activeClients = clients.filter((c) => c.approved !== false).length;
  const today = new Date().toDateString();
  const completedShiftsToday = requests.filter(
    (r) => r.status === 'completed' && r.checkOutAudit?.checkedAt &&
      new Date(r.checkOutAudit.checkedAt).toDateString() === today
  ).length;

  return {
    platformHealthy: activeIncidents === 0 && pendingReviews < 20,
    pendingReviews,
    activeIncidents,
    paymentHolds,
    activeJobs,
    onDutyGuards,
    activeClients,
    pendingApprovals,
    completedShiftsToday: completedShiftsToday || requests.filter((r) => r.status === 'completed').length,
  };
}

export function buildPlatformActivityFeed(
  guards: SecurityGuard[],
  _clients: Client[],
  requests: SecurityRequest[]
): OpsActivityItem[] {
  const items: OpsActivityItem[] = [];

  for (const req of requests) {
    const guard = guards.find((g) => g.id === req.assignedGuardId);
    const site = req.siteName || req.location;

    if (req.checkInAudit?.checkedAt) {
      items.push({
        id: `${req.id}-checkin`,
        timestamp: req.checkInAudit.checkedAt,
        message: `${guard?.name ?? 'Guard'} checked in at ${site}`,
        sortKey: new Date(req.checkInAudit.checkedAt).getTime(),
      });
    }
    if (req.checkInAudit?.readyForDuty) {
      items.push({
        id: `${req.id}-audit`,
        timestamp: req.checkInAudit.checkedAt,
        message: `${guard?.name ?? 'Guard'} completed self-audit`,
        sortKey: new Date(req.checkInAudit.checkedAt).getTime() + 1,
      });
    }
    if (req.checkOutAudit?.incidentReport?.hasIncident) {
      items.push({
        id: `${req.id}-incident`,
        timestamp: req.checkOutAudit.checkedAt,
        message: `Incident report submitted — ${site}`,
        sortKey: new Date(req.checkOutAudit.checkedAt).getTime(),
      });
    }
    if (req.checkOutAudit?.dailyActivityReport) {
      items.push({
        id: `${req.id}-report`,
        timestamp: req.checkOutAudit.checkedAt,
        message: `Patrol report submitted — ${site}`,
        sortKey: new Date(req.checkOutAudit.checkedAt).getTime() + 2,
      });
    }
    if (req.status === 'open') {
      items.push({
        id: `${req.id}-open`,
        timestamp: req.startDate,
        message: `Job opened on marketplace — ${req.clientName}`,
        sortKey: new Date(req.startDate).getTime() - 1000,
      });
    }
  }

  return items.sort((a, b) => b.sortKey - a.sortKey).slice(0, 30);
}

export function buildIncidents(
  requests: SecurityRequest[],
  guards: SecurityGuard[]
): OpsIncident[] {
  const incidents: OpsIncident[] = [];

  for (const req of requests) {
    const ir = req.checkOutAudit?.incidentReport;
    if (!ir?.hasIncident) continue;
    incidents.push({
      id: `inc-${req.id}`,
      requestId: req.id,
      severity: (ir.priority as IncidentSeverity) ?? 'medium',
      location: req.location,
      guardName: guards.find((g) => g.id === req.assignedGuardId)?.name ?? 'Unknown',
      clientName: req.clientName,
      description: ir.description ?? 'Incident reported during shift.',
      timestamp: req.checkOutAudit?.checkedAt ?? req.endDate,
      status: req.status === 'completed' ? 'resolved' : 'open',
    });
  }

  return incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function buildDisputes(
  _requests: SecurityRequest[],
  _guards: SecurityGuard[]
): OpsDispute[] {
  return [];
}

export function computeWeeklyCompletedJobs(requests: SecurityRequest[]): number[] {
  const dayLabels = 7;
  const counts = Array(dayLabels).fill(0);
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
  return counts.map((n) => Math.round((n / max) * 100));
}

export function computeAnalytics(
  guards: SecurityGuard[],
  clients: Client[],
  requests: SecurityRequest[]
) {
  const completed = requests.filter((r) => r.status === 'completed');
  const platformRevenue = completed.reduce(
    (s, r) => s + (r.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * r.durationHours,
    0
  );
  const repeatClients = clients.filter((c) => c.totalRequests > 1).length;
  const incidentRate =
    completed.length > 0
      ? Math.round(
          (completed.filter((r) => r.checkOutAudit?.incidentReport?.hasIncident).length / completed.length) * 100
        )
      : 0;
  const avgGuardEarnings =
    guards.filter((g) => g.jobsCompleted > 0).length > 0
      ? Math.round(
          guards.reduce((s, g) => s + g.jobsCompleted * 200, 0) /
            guards.filter((g) => g.jobsCompleted > 0).length
        )
      : 0;

  return {
    totalRevenue: Math.round(platformRevenue * 100) / 100,
    activeGuards: guards.filter((g) => g.verified && !g.isStaff).length,
    clientGrowth: clients.length,
    repeatClients,
    jobCompletionRate: requests.length
      ? Math.round((completed.length / requests.length) * 100)
      : 0,
    incidentRate,
    avgGuardEarnings,
    completedJobs: completed.length,
  };
}

export function getPendingCertifications(guards: SecurityGuard[]) {
  const list: { guard: SecurityGuard; cert: SecurityGuard['certifications'][0] }[] = [];
  guards.forEach((g) => {
    g.certifications.forEach((c) => {
      if (c.status === 'pending') list.push({ guard: g, cert: c });
    });
  });
  return list;
}
