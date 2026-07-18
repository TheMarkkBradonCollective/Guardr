import { PlatformRole } from '../types';
import { canApproveStaffAccounts, canHandleDisputes, canManageClients, canManageGuards, canReviewCertifications, canReviewJobRequests, ROLE_LABELS } from './permissions';
import type { OverviewActionItem, OverviewMetricCell, StaffSection } from './staffOps';

export type StaffOverviewLayout = 'compact' | 'standard' | 'executive';

export interface StaffOverviewConfig {
  roleLabel: string;
  workspaceKicker: string;
  focusLine: string;
  layout: StaffOverviewLayout;
  /** Metric cell labels to show, or all six platform metrics */
  metricLabels: string[] | 'all';
  showPaymentsInQueue: boolean;
  showDirectorFinancials: boolean;
  showOperationsSnapshot: boolean;
  showPlatformPulse: boolean;
  pulseFullDetail: boolean;
  showPipelineInsight: boolean;
  showWeeklyInsight: boolean;
  showActivityFeed: boolean;
  emptyAttentionCopy: string;
  quickLinkSections: StaffSection[];
}

const ALL_METRICS = [
  'Active jobs',
  'On site now',
  'To verify',
  'Completed jobs',
  'Active clients',
  'Active guards',
] as const;

const MODERATOR_METRICS = ['Active jobs', 'On site now', 'To verify', 'Active guards'];

const ADMIN_METRICS = [
  'Active jobs',
  'On site now',
  'To verify',
  'Completed jobs',
  'Active clients',
  'Active guards',
];

const EXECUTIVE_OVERVIEW_FIELDS = {
  layout: 'executive' as const,
  metricLabels: 'all' as const,
  showPaymentsInQueue: true,
  showDirectorFinancials: true,
  showOperationsSnapshot: true,
  showPlatformPulse: true,
  pulseFullDetail: true,
  showPipelineInsight: true,
  showWeeklyInsight: true,
  showActivityFeed: true,
};

const EXECUTIVE_QUICK_LINKS: StaffSection[] = [
  'map',
  'payments',
  'payment-settings',
  'agreements',
  'audit-log',
  'team',
  'analytics',
  'jobs',
  'applications',
  'clients',
  'cities',
  'permissions',
  'guards',
  'messages',
];

const STAFF_OVERVIEW_CONFIG: Record<
  Extract<PlatformRole, 'moderator' | 'administrator' | 'manager' | 'director' | 'owner'>,
  StaffOverviewConfig
> = {
  moderator: {
    roleLabel: ROLE_LABELS.moderator,
    workspaceKicker: 'Moderator workspace',
    focusLine: 'Credential review, live coverage, and incident follow-up — no account or job approvals.',
    layout: 'compact',
    metricLabels: [...MODERATOR_METRICS],
    showPaymentsInQueue: false,
    showDirectorFinancials: false,
    showOperationsSnapshot: false,
    showPlatformPulse: true,
    pulseFullDetail: false,
    showPipelineInsight: false,
    showWeeklyInsight: true,
    showActivityFeed: true,
    emptyAttentionCopy:
      'No credentials or incidents waiting. Open the map to watch live coverage.',
    quickLinkSections: ['map', 'credentials', 'guards', 'incidents', 'messages'],
  },
  administrator: {
    roleLabel: ROLE_LABELS.administrator,
    workspaceKicker: 'Administrator workspace',
    focusLine: 'Daily platform operations — users, analytics, and job pipeline. No financial controls.',
    layout: 'standard',
    metricLabels: [...ADMIN_METRICS],
    showPaymentsInQueue: false,
    showDirectorFinancials: false,
    showOperationsSnapshot: false,
    showPlatformPulse: true,
    pulseFullDetail: true,
    showPipelineInsight: true,
    showWeeklyInsight: true,
    showActivityFeed: true,
    emptyAttentionCopy:
      'No approvals or incidents waiting. Review analytics or open the ops map.',
    quickLinkSections: ['applications', 'jobs', 'clients', 'analytics', 'messages'],
  },
  manager: {
    roleLabel: ROLE_LABELS.manager,
    workspaceKicker: 'Manager workspace',
    focusLine:
      'Executive operations — same command center as Director for payouts, jobs, financials, and live coverage. City actions follow your assigned markets.',
    ...EXECUTIVE_OVERVIEW_FIELDS,
    emptyAttentionCopy:
      'Nothing urgent in the queue. Review payouts, live coverage, or operations in your assigned cities.',
    quickLinkSections: EXECUTIVE_QUICK_LINKS,
  },
  director: {
    roleLabel: ROLE_LABELS.director,
    workspaceKicker: 'Director workspace',
    focusLine:
      'Executive operations with global city markets and governance-adjacent controls shared with Founder.',
    ...EXECUTIVE_OVERVIEW_FIELDS,
    emptyAttentionCopy:
      'Nothing urgent in the queue. Review financials, city markets, team activity, or live jobs on the map.',
    quickLinkSections: EXECUTIVE_QUICK_LINKS,
  },
  owner: {
    roleLabel: ROLE_LABELS.owner,
    workspaceKicker: 'Founder workspace',
    focusLine: 'Platform governance — full visibility, staff management, and company health.',
    layout: 'executive',
    metricLabels: 'all',
    showPaymentsInQueue: true,
    showDirectorFinancials: true,
    showOperationsSnapshot: true,
    showPlatformPulse: true,
    pulseFullDetail: true,
    showPipelineInsight: true,
    showWeeklyInsight: true,
    showActivityFeed: true,
    emptyAttentionCopy:
      'Platform is clear. Review governance settings, financials, or staff activity.',
    quickLinkSections: ['settings', 'payment-settings', 'agreements', 'audit-log', 'team', 'payments', 'analytics', 'map', 'applications'],
  },
};

export function getStaffOverviewConfig(role: PlatformRole): StaffOverviewConfig {
  if (
    role === 'moderator' ||
    role === 'administrator' ||
    role === 'manager' ||
    role === 'director' ||
    role === 'owner'
  ) {
    return STAFF_OVERVIEW_CONFIG[role];
  }
  return STAFF_OVERVIEW_CONFIG.moderator;
}

export function filterOverviewMetrics(
  cells: OverviewMetricCell[],
  role: PlatformRole
): OverviewMetricCell[] {
  const config = getStaffOverviewConfig(role);
  if (config.metricLabels === 'all') return cells;
  const allowed = new Set(config.metricLabels);
  return cells.filter((cell) => allowed.has(cell.label));
}

function canActOnOverviewAction(role: PlatformRole, item: OverviewActionItem): boolean {
  switch (item.id) {
    case 'pending-certs':
      return canReviewCertifications({ role });
    case 'pending-jobs':
    case 'pending-schedule-changes':
      return canReviewJobRequests({ role });
    case 'account-applications':
      return canManageGuards({ role }) || canManageClients({ role });
    case 'pending-staff-accounts':
      return canApproveStaffAccounts({ role });
    default:
      return true;
  }
}

export function filterOverviewActionItems(
  items: OverviewActionItem[],
  role: PlatformRole
): OverviewActionItem[] {
  const config = getStaffOverviewConfig(role);
  return items.filter((item) => {
    if (item.section === 'payments' && !config.showPaymentsInQueue) return false;
    if (item.section === 'disputes' && !canHandleDisputes({ role })) return false;
    if (!canActOnOverviewAction(role, item)) return false;
    return true;
  });
}

export function staffOverviewMetricCount(role: PlatformRole): number {
  const config = getStaffOverviewConfig(role);
  if (config.metricLabels === 'all') return ALL_METRICS.length;
  return config.metricLabels.length;
}
