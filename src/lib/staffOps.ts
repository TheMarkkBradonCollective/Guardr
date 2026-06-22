import { Client, SecurityGuard, SecurityRequest } from '../types';
import {
  isSelfSubmittedClientAccount,
  isUserSubmittedPendingCert,
} from './approvalSubmissions';
import { isNoSelfAuditFlagged, selfAuditPhotosComplete } from './selfAuditPhotos';
import { hasSpotChecks, isNoSpotCheckFlagged, isSpotCheckClientConfirmed, sortedSpotChecks } from './spotChecks';
import { getPendingGuardAccountReviews } from './guardAccountActivation';
import { countPendingGuardApplications, getOpenJobsWithApplications } from './jobApplications';
import { paymentAttentionSummary } from './paymentPipeline';
import { computeOperationalFinancials } from './operationalFinancials';
import { PLATFORM_FEE_PER_HOUR } from './payments';

export type StaffSection =
  | 'overview'
  | 'approvals'
  | 'jobs'
  | 'map'
  | 'guards'
  | 'team'
  | 'clients'
  | 'incidents'
  | 'support'
  | 'messages'
  | 'payments'
  | 'disputes'
  | 'analytics'
  | 'settings'
  | 'profile';

export function isStaffOpsMapSection(section: StaffSection): boolean {
  return section === 'map';
}

/** Accept legacy deep links that still use live-jobs */
export function normalizeStaffSection(section?: string): StaffSection | undefined {
  if (!section) return undefined;
  if (section === 'live-jobs') return 'jobs';
  const valid: StaffSection[] = [
    'overview', 'approvals', 'jobs', 'map', 'guards', 'team', 'clients',
    'incidents', 'support', 'messages', 'payments', 'disputes', 'analytics', 'settings', 'profile',
  ];
  return valid.includes(section as StaffSection) ? (section as StaffSection) : undefined;
}

export type LiveJobStatus =
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
  /** Guards assigned to picked-up or in-progress jobs */
  activeGuards: number;
  /** Jobs where client, guard, or Stripe deposit still needs money action */
  paymentsNeedingAction: number;
  activeJobs: number;
  onDutyGuards: number;
  activeClients: number;
  /** Job offers + guard credentials waiting in Approvals */
  pendingApprovals: number;
  pendingJobApprovals: number;
  pendingCertApprovals: number;
  pendingGuardApplicationJobs: number;
  pendingGuardApplications: number;
  completedJobs: number;
}

export interface OpsActivityItem {
  id: string;
  timestamp: string;
  message: string;
  sortKey: number;
}

export type OverviewActionTone = 'urgent' | 'normal' | 'muted';

export type ApprovalQueueId =
  | 'accounts'
  | 'job-offers'
  | 'applications'
  | 'credentials';

export interface OverviewActionItem {
  id: string;
  title: string;
  description: string;
  count: number;
  section: StaffSection;
  tone: OverviewActionTone;
  approvalQueue?: ApprovalQueueId;
}

export interface OverviewLiveJob {
  id: string;
  title: string;
  site: string;
  guardName: string;
  clientName: string;
  status: LiveJobStatus;
  startedAt?: string;
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

export function getLiveJobStatus(req: SecurityRequest): LiveJobStatus {
  if (req.checkOutAudit?.incidentReport?.hasIncident && req.status === 'in-progress') {
    return 'incident-flagged';
  }
  if (req.status === 'completed' || req.status === 'closed') return 'completed';
  if (req.status === 'in-progress') return 'in-progress';
  if (req.status === 'accepted') return 'active';
  return 'pending-assignment';
}

export const LIVE_JOB_STATUS_LABEL: Record<LiveJobStatus, { emoji: string; label: string; className: string }> = {
  'pending-assignment': { emoji: '🟡', label: 'Awaiting guard', className: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  active: { emoji: '🟢', label: 'Active', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  'in-progress': { emoji: '🔵', label: 'In Progress', className: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  completed: { emoji: '⚫', label: 'Completed', className: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  'incident-flagged': { emoji: '📋', label: 'Client incident reported', className: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
};

export function computePlatformStats(
  guards: SecurityGuard[],
  clients: Client[],
  requests: SecurityRequest[]
): PlatformStats {
  const pendingJobReviews = requests.filter((r) => r.status === 'pending-review').length;
  const pendingCerts = guards.reduce(
    (n, g) => n + g.certifications.filter((c) => isUserSubmittedPendingCert(c, g)).length,
    0
  );
  const pendingJobApprovals = pendingJobReviews;
  const pendingCertApprovals = pendingCerts;
  const pendingGuardAccounts = getPendingGuardAccountReviews(guards).length;
  const pendingGuardApplicationJobs = getOpenJobsWithApplications(requests).length;
  const pendingGuardApplications = countPendingGuardApplications(requests);
  const pendingApprovals =
    pendingJobApprovals + pendingCertApprovals + pendingGuardApplicationJobs + pendingGuardAccounts;
  const pendingReviews = pendingApprovals;
  const activeIncidents = buildIncidents(requests, guards).filter((i) => i.status === 'open').length;
  const activeGuardIds = new Set(
    requests
      .filter((r) => (r.status === 'accepted' || r.status === 'in-progress') && r.assignedGuardId)
      .map((r) => r.assignedGuardId as string)
  );
  const activeGuards = activeGuardIds.size;
  const paymentsNeedingAction = paymentAttentionSummary(requests).count;

  const activeJobs = requests.filter((r) =>
    ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
  ).length;
  const onDutyGuards = requests.filter((r) => r.status === 'in-progress').length;
  const activeClients = clients.length;
  const completedJobs = requests.filter((r) =>
    r.status === 'completed' || r.status === 'closed'
  ).length;

  return {
    platformHealthy: pendingReviews < 20,
    pendingReviews,
    activeIncidents,
    activeGuards,
    paymentsNeedingAction,
    activeJobs,
    onDutyGuards,
    activeClients,
    pendingApprovals,
    pendingJobApprovals,
    pendingCertApprovals,
    pendingGuardApplicationJobs,
    pendingGuardApplications,
    completedJobs,
  };
}

export interface OverviewMetricCell {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  /** Staff section to open when the metric is tapped */
  navigateTo?: StaffSection;
}

export function buildOverviewMetricCells(
  stats: PlatformStats,
  requests: SecurityRequest[]
): OverviewMetricCell[] {
  const pendingJobs = requests.filter((r) => r.status === 'pending-review').length;
  const openJobs = requests.filter((r) => r.status === 'open').length;
  const acceptedJobs = requests.filter((r) => r.status === 'accepted').length;
  const inProgress = requests.filter((r) => r.status === 'in-progress').length;

  return [
    {
      label: 'Active jobs',
      value: String(stats.activeJobs),
      sub:
        stats.activeJobs === 0
          ? 'No jobs in the pipeline right now'
          : [
              pendingJobs > 0 ? `${pendingJobs} awaiting approval` : null,
              openJobs > 0 ? `${openJobs} open offer${openJobs === 1 ? '' : 's'}` : null,
              acceptedJobs > 0 ? `${acceptedJobs} picked up` : null,
              inProgress > 0 ? `${inProgress} in progress` : null,
            ]
              .filter(Boolean)
              .join(' · ') || `${stats.activeJobs} job${stats.activeJobs === 1 ? '' : 's'} in the pipeline`,
      accent: stats.activeJobs > 0,
      navigateTo: 'jobs',
    },
    {
      label: 'On site now',
      value: String(stats.onDutyGuards),
      sub:
        stats.onDutyGuards === 0
          ? 'No guards clocked in on site'
          : `${stats.onDutyGuards} job${stats.onDutyGuards === 1 ? '' : 's'} in progress with a guard on site`,
      accent: stats.onDutyGuards > 0,
      navigateTo: 'map',
    },
    {
      label: 'To verify',
      value: String(stats.pendingApprovals),
      sub:
        stats.pendingApprovals === 0
          ? 'No job offers or credentials waiting for review'
          : [
              stats.pendingJobApprovals > 0
                ? `${stats.pendingJobApprovals} job offer${stats.pendingJobApprovals === 1 ? '' : 's'}`
                : null,
              stats.pendingCertApprovals > 0
                ? `${stats.pendingCertApprovals} credential${stats.pendingCertApprovals === 1 ? '' : 's'}`
                : null,
              stats.pendingGuardApplicationJobs > 0
                ? `${stats.pendingGuardApplications} guard application${stats.pendingGuardApplications === 1 ? '' : 's'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') + ' in Approvals',
      accent: stats.pendingApprovals > 0,
      navigateTo: 'approvals',
    },
    {
      label: 'Completed jobs',
      value: String(stats.completedJobs),
      sub:
        stats.completedJobs === 0
          ? 'No finished jobs yet'
          : `${stats.completedJobs} total finished or closed job${stats.completedJobs === 1 ? '' : 's'}`,
      accent: false,
    },
    {
      label: 'Active clients',
      value: String(stats.activeClients),
      sub:
        stats.activeClients === 0
          ? 'No client accounts on the platform'
          : `${stats.activeClients} client account${stats.activeClients === 1 ? '' : 's'} posting and managing jobs`,
      accent: false,
    },
    {
      label: 'Open incidents',
      value: String(stats.activeIncidents),
      sub:
        stats.activeIncidents === 0
          ? 'No open incident reports from job checkout'
          : `${stats.activeIncidents} checkout report${stats.activeIncidents === 1 ? '' : 's'} need follow-up`,
      accent: stats.activeIncidents > 0,
      navigateTo: 'incidents',
    },
  ];
}

export function buildOverviewSummaryLine(
  actionCount: number,
  liveJobCount: number
): string {
  if (actionCount === 0 && liveJobCount === 0) {
    return 'Nothing urgent right now — check live jobs or browse open offers.';
  }
  const parts: string[] = [];
  if (actionCount > 0) {
    parts.push(`${actionCount} item${actionCount === 1 ? '' : 's'} need your attention`);
  }
  if (liveJobCount > 0) {
    parts.push(`${liveJobCount} guard${liveJobCount === 1 ? '' : 's'} on site`);
  }
  return parts.join(' · ');
}

export function buildOverviewActionQueue(
  stats: PlatformStats,
  requests: SecurityRequest[],
  incidents: OpsIncident[],
  supportCount: number,
  guards: SecurityGuard[] = [],
  clients: Client[] = []
): OverviewActionItem[] {
  const items: OverviewActionItem[] = [];

  if (stats.pendingJobApprovals > 0) {
    items.push({
      id: 'pending-jobs',
      title: 'Approve job offers before payment',
      description: `${stats.pendingJobApprovals} client job offer${stats.pendingJobApprovals === 1 ? '' : 's'} waiting — client cannot pay until approved`,
      count: stats.pendingJobApprovals,
      section: 'approvals',
      approvalQueue: 'job-offers',
      tone: 'urgent',
    });
  }

  if (stats.pendingCertApprovals > 0) {
    items.push({
      id: 'pending-certs',
      title: 'Verify guard credentials',
      description: 'Licenses and certs uploaded — review before guards can work',
      count: stats.pendingCertApprovals,
      section: 'approvals',
      approvalQueue: 'credentials',
      tone: 'urgent',
    });
  }

  if (stats.pendingGuardApplicationJobs > 0) {
    items.push({
      id: 'guard-applications',
      title: 'Review guard applications',
      description: `${stats.pendingGuardApplications} application${stats.pendingGuardApplications === 1 ? '' : 's'} on ${stats.pendingGuardApplicationJobs} open job${stats.pendingGuardApplicationJobs === 1 ? '' : 's'} — pick the best fit`,
      count: stats.pendingGuardApplications,
      section: 'approvals',
      approvalQueue: 'applications',
      tone: 'urgent',
    });
  }

  const pendingGuardAccounts = getPendingGuardAccountReviews(guards).length;
  const pendingClientAccounts = clients.filter((c) => isSelfSubmittedClientAccount(c)).length;
  const accountQueueCount = pendingGuardAccounts + pendingClientAccounts;
  if (accountQueueCount > 0) {
    items.push({
      id: 'pending-accounts',
      title: 'Approve guard and client profiles',
      description: 'Review sign-ups after required-to-work items are complete',
      count: accountQueueCount,
      section: 'approvals',
      approvalQueue: 'accounts',
      tone: 'urgent',
    });
  }

  const openJobsWithoutApplicants = requests.filter(
    (r) => r.status === 'open' && !r.assignedGuardId && r.applicants.length === 0
  ).length;
  if (openJobsWithoutApplicants > 0) {
    items.push({
      id: 'open-marketplace',
      title: 'Open job offers waiting for guards',
      description: 'Posted offers with no guard applications yet',
      count: openJobsWithoutApplicants,
      section: 'jobs',
      tone: 'normal',
    });
  }

  const activeGuardJobs = requests.filter(
    (r) =>
      r.assignedGuardId &&
      (r.status === 'accepted' ||
        r.status === 'in-progress' ||
        (r.status === 'completed' && (isNoSelfAuditFlagged(r) || isNoSpotCheckFlagged(r))))
  );
  if (activeGuardJobs.length > 0) {
    items.push({
      id: 'active-guard-jobs',
      title: 'Edit or update active guard jobs',
      description: 'Update listings, self-audit photos, or staff spot checks for guards on coverage',
      count: activeGuardJobs.length,
      section: 'jobs',
      tone: activeGuardJobs.some((r) => isNoSelfAuditFlagged(r) || isNoSpotCheckFlagged(r)) ? 'urgent' : 'normal',
    });
  }

  const openIncidents = incidents.filter((i) => i.status !== 'resolved').length;
  if (openIncidents > 0) {
    items.push({
      id: 'incidents',
      title: 'Review client incident reports',
      description: 'Filed during job checkout — see what happened on site',
      count: openIncidents,
      section: 'incidents',
      tone: 'urgent',
    });
  }

  const paymentAttention = paymentAttentionSummary(requests);
  if (paymentAttention.count > 0) {
    items.push({
      id: 'payments',
      title: 'Money still owed on jobs',
      description: paymentAttention.lines.filter((l) => !l.includes('settled')).join(' · '),
      count: paymentAttention.count,
      section: 'payments',
      tone: 'urgent',
    });
  }

  if (supportCount > 0) {
    items.push({
      id: 'support',
      title: 'Reply to support tickets',
      description: 'Clients or guards are waiting on staff',
      count: supportCount,
      section: 'support',
      tone: 'normal',
    });
  }

  const inProgress = requests.filter((r) => r.status === 'in-progress').length;
  if (inProgress > 0) {
    items.push({
      id: 'live-jobs',
      title: 'Watch live operations',
      description: 'Guards checked in — view them on the ops map',
      count: inProgress,
      section: 'map',
      tone: 'normal',
    });
  }

  return items;
}

export function buildOverviewLiveJobs(
  guards: SecurityGuard[],
  requests: SecurityRequest[]
): OverviewLiveJob[] {
  return requests
    .filter(
      (r) =>
        ['accepted', 'in-progress'].includes(r.status) ||
        (r.status === 'completed' && (isNoSelfAuditFlagged(r) || isNoSpotCheckFlagged(r)))
    )
    .map((r) => ({
      id: r.id,
      title: r.title,
      site: r.siteName || r.location,
      guardName: guards.find((g) => g.id === r.assignedGuardId)?.name ?? 'No guard yet',
      clientName: r.clientName,
      status: getLiveJobStatus(r),
      startedAt: r.checkInAudit?.checkedAt ?? r.startDate,
    }))
    .sort((a, b) => {
      const priority: Record<LiveJobStatus, number> = {
        'incident-flagged': 0,
        'in-progress': 1,
        active: 2,
        'pending-assignment': 3,
        completed: 4,
      };
      return priority[a.status] - priority[b.status];
    })
    .slice(0, 8);
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
    if (isNoSelfAuditFlagged(req)) {
      items.push({
        id: `${req.id}-audit-skipped`,
        timestamp: req.checkInAudit!.checkedAt,
        message: `${guard?.name ?? 'Guard'} skipped self-audit — ${site}`,
        sortKey: new Date(req.checkInAudit!.checkedAt).getTime() + 1,
      });
    } else if (req.checkInAudit?.readyForDuty && selfAuditPhotosComplete(req.checkInAudit)) {
      items.push({
        id: `${req.id}-audit`,
        timestamp: req.checkInAudit.checkedAt,
        message: `${guard?.name ?? 'Guard'} completed self-audit`,
        sortKey: new Date(req.checkInAudit.checkedAt).getTime() + 1,
      });
    }
    if (req.checkInAudit?.clientConfirmedAt) {
      items.push({
        id: `${req.id}-audit-client`,
        timestamp: req.checkInAudit.clientConfirmedAt,
        message: `${req.clientName} confirmed self-audit photos — ${site}`,
        sortKey: new Date(req.checkInAudit.clientConfirmedAt).getTime() + 2,
      });
    }
    if (isNoSpotCheckFlagged(req)) {
      const ts = req.checkInAudit?.checkedAt ?? req.startDate;
      items.push({
        id: `${req.id}-no-spot-check`,
        timestamp: ts,
        message: `No staff spot check on file — ${guard?.name ?? 'Guard'} at ${site}`,
        sortKey: new Date(ts).getTime() + 3,
      });
    } else if (hasSpotChecks(req)) {
      const latest = sortedSpotChecks(req)[0];
      items.push({
        id: `${req.id}-spot-check`,
        timestamp: latest.uploadedAt,
        message: `Staff spot check saved — ${guard?.name ?? 'Guard'} at ${site}`,
        sortKey: new Date(latest.uploadedAt).getTime() + 3,
      });
      for (const check of sortedSpotChecks(req)) {
        if (isSpotCheckClientConfirmed(check)) {
          items.push({
            id: `${req.id}-spot-check-client-${check.id}`,
            timestamp: check.clientConfirmedAt!,
            message: `${req.clientName} confirmed staff spot check — ${site}`,
            sortKey: new Date(check.clientConfirmedAt!).getTime() + 4,
          });
        }
      }
    }
    if (req.checkOutAudit?.incidentReport?.hasIncident) {
      items.push({
        id: `${req.id}-incident`,
        timestamp: req.checkOutAudit.checkedAt,
        message: `Client incident report filed — ${site}`,
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
      description: ir.description ?? 'Incident reported during job.',
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
    (() => {
      const financials = computeOperationalFinancials(requests);
      if (financials.settledJobCount === 0) return 0;
      return Math.round((financials.guardPayoutsPaid / financials.settledJobCount) * 100) / 100;
    })();

  return {
    totalRevenue: Math.round(platformRevenue * 100) / 100,
    activeGuards: guards.filter((g) => !g.isStaff && g.certifications.some((c) => c.status !== 'rejected')).length,
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

export function getPendingJobApprovals(requests: SecurityRequest[]): SecurityRequest[] {
  return [...requests]
    .filter((r) => r.status === 'pending-review')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function getPendingCertifications(guards: SecurityGuard[]) {
  const list: { guard: SecurityGuard; cert: SecurityGuard['certifications'][0] }[] = [];
  guards.forEach((g) => {
    g.certifications.forEach((c) => {
      if (isUserSubmittedPendingCert(c, g)) list.push({ guard: g, cert: c });
    });
  });
  return list;
}

export function getPendingGuardAccounts(guards: SecurityGuard[]): SecurityGuard[] {
  return getPendingGuardAccountReviews(guards);
}

export function getPendingClientAccounts(clients: Client[]): Client[] {
  return clients.filter((c) => isSelfSubmittedClientAccount(c));
}
