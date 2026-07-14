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

const STAFF_OVERVIEW_CONFIG: Record<
  Extract<PlatformRole, 'moderator' | 'administrator' | 'director' | 'owner'>,
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
  director: {
    roleLabel: ROLE_LABELS.director,
    workspaceKicker: 'Director workspace',
    focusLine: 'Executive operations — company financials, team oversight, and live command.',
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
      'Nothing urgent in the queue. Review financials, team activity, or live jobs on the map.',
    quickLinkSections: ['map', 'payments', 'team', 'analytics', 'jobs', 'applications'],
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
    quickLinkSections: ['settings', 'team', 'payments', 'analytics', 'map', 'applications'],
  },
};

export function getStaffOverviewConfig(role: PlatformRole): StaffOverviewConfig {
  if (role === 'moderator' || role === 'administrator' || role === 'director' || role === 'owner') {
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
    case 'guard-applications':
      return canReviewJobRequests({ role });
    case 'pending-guard-accounts':
      return canManageGuards({ role });
    case 'pending-staff-accounts':
      return canApproveStaffAccounts({ role });
    case 'pending-client-accounts':
      return canManageClients({ role });
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
