import { Client, SecurityGuard, SecurityRequest, SupportTicket } from '../types';
import { computeLateClockOutHours, computeOvertimeAmount } from './shiftBilling';
import { PLATFORM_FEE_PER_HOUR } from './payments';
import {
  buildIncidentReportViews,
  incidentCategoryLabel,
  listIncidentReportsForRequest,
  requestHasOpenIncident,
} from './incidentReports';
import { isClientAccountPending } from './accountStatus';
import {
  isUserSubmittedPendingCert,
} from './approvalSubmissions';
import { isJobLocationCoordsMissing, jobsMissingMapCoordinates } from './jobLocation';
import { isNoSelfAuditFlagged, selfAuditPhotosComplete } from './selfAuditPhotos';
import { getApprovedGuardsAwaitingActivation, getPendingGuardAccountReviews } from './guardAccountActivation';
import { getPendingInsuranceReviews } from './guardInsurance';
import { paymentAttentionSummary } from './paymentPipeline';
import { computeOperationalFinancials } from './operationalFinancials';
import { getPendingScheduleChangeApprovals } from './jobScheduleChange';
import { getPendingStaffAccountReviews } from './staffAccounts';

export type StaffSection =
  | 'overview'
  | 'applications'
  | 'credentials'
  | 'jobs'
  | 'map'
  | 'guards'
  | 'team'
  | 'crews'
  | 'clients'
  | 'incidents'
  | 'messages'
  | 'support'
  | 'team-chat'
  | 'job-chats'
  | 'payments'
  | 'payment-settings'
  | 'agreements'
  | 'audit-log'
  | 'disputes'
  | 'analytics'
  | 'settings'
  | 'guide'
  | 'dev-updates'
  | 'profile'
  | 'preferences';

const LEGACY_MESSAGE_SECTIONS: StaffSection[] = ['support', 'team-chat', 'job-chats'];

export function isStaffMessagesSection(section: StaffSection): boolean {
  return section === 'messages' || LEGACY_MESSAGE_SECTIONS.includes(section);
}

export function isStaffOpsMapSection(section: StaffSection): boolean {
  return section === 'map';
}

/** Accept legacy deep links that still use live-jobs or split message sections */
export function normalizeStaffSection(section?: string): StaffSection | undefined {
  if (!section) return undefined;
  if (section === 'live-jobs') return 'jobs';
  if (section === 'approvals') return 'applications';
  if (section === 'messages' || section === 'team-chat' || section === 'job-chats' || section === 'support') {
    return 'messages';
  }
  const valid: StaffSection[] = [
    'overview', 'applications', 'credentials', 'jobs', 'map', 'guards', 'team', 'crews', 'clients',
    'incidents', 'messages', 'payments', 'payment-settings', 'agreements', 'audit-log', 'disputes', 'analytics', 'settings', 'guide', 'dev-updates', 'profile', 'preferences',
  ];
  return valid.includes(section as StaffSection) ? (section as StaffSection) : undefined;
}

/** Legacy /staff/approvals?aq=… deep links → the section that now owns that work. */
export function staffSectionFromApprovalQueue(queue?: ApprovalQueueId | null): StaffSection {
  switch (queue) {
    case 'job-offers':
    case 'schedule-changes':
      return 'jobs';
    case 'credentials':
      return 'credentials';
    case 'guard-accounts':
    case 'client-accounts':
    case 'accounts':
      return 'applications';
    case 'staff-accounts':
      return 'team';
    case 'applications':
    case 'all':
    default:
      return 'applications';
  }
}

export function resolveStaffRouteSection(
  staffSection?: string,
  staffApprovalQueue?: ApprovalQueueId | null,
  staffMessageTab?: 'team' | 'jobs' | null
): StaffSection {
  if (staffApprovalQueue) {
    return staffSectionFromApprovalQueue(staffApprovalQueue);
  }
  const normalized = normalizeStaffSection(staffSection);
  const resolved = resolveStaffSection(normalized, staffMessageTab);
  return isStaffMessagesSection(resolved ?? 'overview') ? 'messages' : (resolved ?? 'overview');
}

/** Legacy /staff/messages and ?mtab= deep links */
export function staffSectionFromMessageTab(_tab?: 'team' | 'jobs' | null): StaffSection {
  return 'messages';
}

export function resolveStaffSection(
  section?: StaffSection | 'messages',
  messageTab?: 'team' | 'jobs' | null
): StaffSection | undefined {
  if (!section) return undefined;
  if (section === 'messages' || LEGACY_MESSAGE_SECTIONS.includes(section as StaffSection)) {
    return 'messages';
  }
  return section;
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
  pendingScheduleChanges: number;
  pendingCertApprovals: number;
  pendingAccountApplications: number;
  pendingClientAccounts: number;
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
  | 'all'
  | 'job-offers'
  | 'schedule-changes'
  | 'applications'
  | 'credentials'
  | 'guard-accounts'
  | 'staff-accounts'
  | 'client-accounts'
  /** @deprecated Legacy URL — use guard-accounts or client-accounts */
  | 'accounts';

export const APPROVAL_QUEUE_TAB_ORDER: ApprovalQueueId[] = [
  'all',
  'job-offers',
  'schedule-changes',
  'applications',
  'credentials',
  'guard-accounts',
  'staff-accounts',
  'client-accounts',
];

export const APPROVAL_QUEUE_TAB_LABELS: Record<
  Exclude<ApprovalQueueId, 'accounts'>,
  string
> = {
  all: 'All',
  'job-offers': 'Jobs',
  'schedule-changes': 'Schedule',
  applications: 'Applications',
  credentials: 'Credentials',
  'guard-accounts': 'Guards',
  'staff-accounts': 'Staff',
  'client-accounts': 'Clients',
};

/** Map legacy queue ids and invalid values to a concrete approvals tab. */
export function normalizeApprovalQueueId(
  queue: ApprovalQueueId | null | undefined,
  permitted: ApprovalQueueId[] = APPROVAL_QUEUE_TAB_ORDER
): ApprovalQueueId | null {
  if (!queue) {
    if (permitted.includes('all')) return 'all';
    return permitted[0] ?? null;
  }
  if (queue === 'accounts') {
    if (permitted.includes('guard-accounts')) return 'guard-accounts';
    if (permitted.includes('client-accounts')) return 'client-accounts';
    if (permitted.includes('all')) return 'all';
    return permitted[0] ?? null;
  }
  return permitted.includes(queue) ? queue : permitted.includes('all') ? 'all' : permitted[0] ?? null;
}

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
  incidentType?: string;
  location: string;
  locationOnSite?: string;
  guardName: string;
  clientName: string;
  description: string;
  partiesInvolved?: string;
  witnesses?: string;
  causeOrTrigger?: string;
  actionsTaken?: string;
  authoritiesNotified?: boolean;
  authorityDetails?: string;
  injuryInvolved?: boolean;
  propertyDamageInvolved?: boolean;
  occurredAt?: string;
  timestamp: string;
  status: 'open' | 'reviewing' | 'resolved';
}

export type DisputeResolutionAction =
  | 'approve_payout'
  | 'hold_funds'
  | 'partial_payout'
  | 'cancel_payout';

export interface OpsDispute {
  id: string;
  ticketId?: string;
  requestId?: string;
  guardId?: string;
  clientId?: string;
  type: 'payment' | 'no-show' | 'safety' | 'service' | 'overtime';
  jobTitle: string;
  guardName: string;
  clientName: string;
  guardStatement: string;
  clientStatement: string;
  status: 'open' | 'held' | 'resolved';
  openedAt: string;
  scheduledEnd?: string;
  clockOutAt?: string;
  clientClaimedClockOutAt?: string;
  clientClaimedHours?: number;
  clientClaimedAmount?: number;
  claimedHours?: number;
  claimedAmount?: number;
  hourlyRate?: number;
  guardsNeeded?: number;
}

export function getLiveJobStatus(req: SecurityRequest): LiveJobStatus {
  if (requestHasOpenIncident(req) && req.status === 'in-progress') {
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
  const pendingScheduleChanges = getPendingScheduleChangeApprovals(requests).length;
  const pendingCerts = guards.reduce(
    (n, g) => n + g.certifications.filter((c) => isUserSubmittedPendingCert(c, g)).length,
    0
  );
  const pendingInsuranceReviews = getPendingInsuranceReviews(guards).length;
  const pendingJobApprovals = pendingJobReviews;
  const pendingCertApprovals = pendingCerts + pendingInsuranceReviews;
  const pendingGuardProfileApprovals = getPendingGuardAccountReviews(guards).length;
  const approvedGuardsAwaitingActivation = getApprovedGuardsAwaitingActivation(guards).length;
  const pendingClientAccounts = getPendingClientAccounts(clients).length;
  const pendingAccountApplications =
    getPendingGuardAccounts(guards.filter((g) => !g.isStaff)).length + pendingClientAccounts;
  const pendingStaffAccounts = getPendingStaffAccountReviews(guards).length;
  const pendingApprovals =
    pendingJobApprovals +
    pendingScheduleChanges +
    pendingCertApprovals +
    pendingAccountApplications +
    pendingStaffAccounts;
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
    pendingScheduleChanges,
    pendingCertApprovals,
    pendingAccountApplications,
    pendingClientAccounts,
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
          ? 'No approvals waiting for review'
          : [
              stats.pendingJobApprovals > 0
                ? `${stats.pendingJobApprovals} job offer${stats.pendingJobApprovals === 1 ? '' : 's'}`
                : null,
              stats.pendingScheduleChanges > 0
                ? `${stats.pendingScheduleChanges} schedule change${stats.pendingScheduleChanges === 1 ? '' : 's'}`
                : null,
              stats.pendingCertApprovals > 0
                ? `${stats.pendingCertApprovals} credential${stats.pendingCertApprovals === 1 ? '' : 's'}`
                : null,
              stats.pendingAccountApplications > 0
                ? `${stats.pendingAccountApplications} account application${stats.pendingAccountApplications === 1 ? '' : 's'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') + ' across jobs, credentials, and applications',
      accent: stats.pendingApprovals > 0,
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
      label: 'Active guards',
      value: String(stats.activeGuards),
      sub:
        stats.activeGuards === 0
          ? 'No guards on accepted or in-progress assignments'
          : `${stats.activeGuards} guard${stats.activeGuards === 1 ? '' : 's'} assigned to active jobs`,
      accent: stats.activeGuards > 0,
      navigateTo: 'guards',
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
      section: 'jobs',
      tone: 'urgent',
    });
  }

  if (stats.pendingScheduleChanges > 0) {
    items.push({
      id: 'pending-schedule-changes',
      title: 'Approve client schedule changes',
      description: `${stats.pendingScheduleChanges} paid job${stats.pendingScheduleChanges === 1 ? '' : 's'} with new times awaiting review`,
      count: stats.pendingScheduleChanges,
      section: 'jobs',
      tone: 'urgent',
    });
  }

  const jobsMissingCoords = jobsMissingMapCoordinates(requests);
  if (jobsMissingCoords.length > 0) {
    items.push({
      id: 'jobs-missing-coords',
      title: 'Jobs missing map coordinates',
      description: 'Moderator or above must add latitude and longitude before the job can go live',
      count: jobsMissingCoords.length,
      section: 'jobs',
      tone: 'urgent',
    });
  }

  if (stats.pendingCertApprovals > 0) {
    items.push({
      id: 'pending-certs',
      title: 'Verify guard credentials',
      description: 'Licenses and certs uploaded — review before guards can work',
      count: stats.pendingCertApprovals,
      section: 'credentials',
      tone: 'urgent',
    });
  }

  if (stats.pendingAccountApplications > 0) {
    items.push({
      id: 'account-applications',
      title: 'Review account applications',
      description: 'New guard and client sign-ups waiting for staff approval before activation',
      count: stats.pendingAccountApplications,
      section: 'applications',
      tone: 'urgent',
    });
  }

  const pendingStaffAccounts = getPendingStaffAccountReviews(guards).length;
  if (pendingStaffAccounts > 0) {
    items.push({
      id: 'pending-staff-accounts',
      title: 'Approve staff onboarding',
      description: 'Review administrator-submitted staff accounts before they can sign in',
      count: pendingStaffAccounts,
      section: 'team',
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
        (r.status === 'completed' && isNoSelfAuditFlagged(r)))
  );
  if (activeGuardJobs.length > 0) {
    items.push({
      id: 'active-guard-jobs',
      title: 'Edit or update active guard jobs',
      description: 'Update listings or review guard check-ins on active coverage',
      count: activeGuardJobs.length,
      section: 'jobs',
      tone: activeGuardJobs.some((r) => isNoSelfAuditFlagged(r)) ? 'urgent' : 'normal',
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
      section: 'messages',
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
        (r.status === 'completed' && isNoSelfAuditFlagged(r))
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
    for (const incident of listIncidentReportsForRequest(req)) {
      items.push({
        id: `${req.id}-incident-${incident.id}`,
        timestamp: incident.submittedAt,
        message: `Client incident report filed — ${site}`,
        sortKey: new Date(incident.submittedAt).getTime(),
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
  return buildIncidentReportViews(requests, guards).map((view) => ({
    id: view.id,
    requestId: view.requestId,
    severity: (view.detail.priority as IncidentSeverity) ?? 'medium',
    incidentType: incidentCategoryLabel(view.detail.incidentType),
    location: view.jobLocation,
    locationOnSite: view.detail.locationOnSite,
    guardName: view.guardName,
    clientName: view.clientName,
    description: view.detail.description ?? 'Incident reported during job.',
    partiesInvolved: view.detail.partiesInvolved,
    witnesses: view.detail.witnesses,
    causeOrTrigger: view.detail.causeOrTrigger,
    actionsTaken: view.detail.actionsTaken,
    authoritiesNotified: view.detail.authoritiesNotified,
    authorityDetails: view.detail.authorityDetails,
    injuryInvolved: view.detail.injuryInvolved,
    propertyDamageInvolved: view.detail.propertyDamageInvolved,
    occurredAt: view.detail.occurredAt,
    timestamp: view.detail.submittedAt,
    status:
      requests.find((r) => r.id === view.requestId)?.status === 'completed' ? 'resolved' : 'open',
  }));
}

function formatDisputeWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildDisputes(
  requests: SecurityRequest[],
  guards: SecurityGuard[],
  tickets: SupportTicket[] = []
): OpsDispute[] {
  const disputes: OpsDispute[] = [];

  for (const req of requests) {
    if (req.overtimeStatus !== 'disputed') continue;

    const guardName = guards.find((g) => g.id === req.assignedGuardId)?.name ?? 'Unknown guard';
    const claimedHours = req.overtimeOriginalHours ?? req.overtimeHours ?? 0;
    const claimedAmount = req.overtimeOriginalAmount ?? req.overtimeAmount ?? 0;
    const clockOutAt = req.checkOutAudit?.checkedAt;
    const clientClaimedClockOutAt = req.overtimeDisputeClaimedClockOutAt;
    const clientClaimedHours =
      clientClaimedClockOutAt != null
        ? computeLateClockOutHours(clientClaimedClockOutAt, req.endDate)
        : undefined;
    const clientClaimedAmount =
      clientClaimedHours != null
        ? computeOvertimeAmount(clientClaimedHours, req.hourlyRate, req.guardsNeeded ?? 1)
        : undefined;
    const guardApprovedAt = req.overtimeGuardApprovedAt;

    disputes.push({
      id: `ot-dispute-${req.id}`,
      type: 'overtime',
      requestId: req.id,
      jobTitle: req.title,
      guardName,
      clientName: req.clientName,
      guardStatement: guardApprovedAt
        ? `Confirmed ${claimedHours}h late clock-out on ${formatDisputeWhen(guardApprovedAt)}.`
        : `Confirmed ${claimedHours}h late clock-out.`,
      clientStatement: req.overtimeDisputeReason?.trim() || 'No reason provided.',
      status: 'open',
      openedAt: req.overtimeDisputedAt ?? req.endDate,
      scheduledEnd: req.endDate,
      clockOutAt,
      clientClaimedClockOutAt,
      clientClaimedHours,
      clientClaimedAmount,
      claimedHours,
      claimedAmount,
      hourlyRate: req.hourlyRate,
      guardsNeeded: req.guardsNeeded ?? 1,
    });
  }

  for (const ticket of tickets) {
    if (ticket.status === 'resolved' || ticket.kind !== 'report') continue;
    if (!['payment', 'job-issue', 'safety'].includes(ticket.category)) continue;

    const relatedJob = ticket.relatedRequestId
      ? requests.find((r) => r.id === ticket.relatedRequestId)
      : undefined;
    const assignedGuard = relatedJob?.assignedGuardId
      ? guards.find((g) => g.id === relatedJob.assignedGuardId)
      : undefined;

    const type =
      ticket.category === 'payment'
        ? 'payment'
        : ticket.category === 'safety'
          ? 'safety'
          : 'service';

    disputes.push({
      id: ticket.id,
      ticketId: ticket.id,
      requestId: ticket.relatedRequestId,
      guardId: assignedGuard?.id ?? (ticket.userRole === 'guard' ? ticket.userId : undefined),
      clientId: relatedJob?.clientId ?? (ticket.userRole === 'client' ? ticket.userId : undefined),
      type,
      jobTitle: relatedJob?.title ?? ticket.subject,
      guardName:
        assignedGuard?.name ?? (ticket.userRole === 'guard' ? ticket.userName : 'Pending guard'),
      clientName: relatedJob?.clientName ?? (ticket.userRole === 'client' ? ticket.userName : 'Pending client'),
      guardStatement: ticket.userRole === 'guard' ? ticket.messages[0]?.body ?? '' : '—',
      clientStatement: ticket.userRole === 'client' ? ticket.messages[0]?.body ?? '' : '—',
      status: ticket.status === 'in-progress' ? 'held' : 'open',
      openedAt: ticket.createdAt,
    });
  }

  return disputes.sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );
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
          (completed.filter((r) => requestHasOpenIncident(r)).length / completed.length) * 100
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

export function countPendingCredentialApprovals(guards: SecurityGuard[]): number {
  return getPendingCertifications(guards).length + getPendingInsuranceReviews(guards).length;
}

export function getPendingGuardAccounts(guards: SecurityGuard[]): SecurityGuard[] {
  return [...getPendingGuardAccountReviews(guards), ...getApprovedGuardsAwaitingActivation(guards)];
}

export function getPendingClientAccounts(clients: Client[]): Client[] {
  return clients.filter((c) => isClientAccountPending(c));
}

export interface OverviewNavigationSelection {
  guardId?: string | null;
  clientId?: string | null;
  jobId?: string | null;
  credentialItemId?: string | null;
}

/** Deep-link overview action cards into the right list item when possible. */
export function resolveOverviewActionSelection(
  item: OverviewActionItem,
  ctx: { requests: SecurityRequest[]; guards: SecurityGuard[]; clients: Client[] }
): OverviewNavigationSelection {
  switch (item.id) {
    case 'account-applications': {
      const guard = getPendingGuardAccounts(ctx.guards)[0];
      if (guard) return { guardId: guard.id };
      const client = getPendingClientAccounts(ctx.clients)[0];
      return { clientId: client?.id ?? null };
    }
    default:
      return {};
  }
}
