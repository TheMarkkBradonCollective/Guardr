import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { LabelSmall } from 'baseui/typography';
import { UberDirectHubCard } from '../../baseui/dashboard';
import { MetricCell, MetricStrip } from '../../baseui/dashboard/MetricCell';
import { QuickActionTile } from '../../baseui/dashboard/QuickActionTile';
import { WorkbenchPanel } from '../../baseui/layout/WorkbenchLayout';
import { CheckCircle2 } from 'lucide-react';

import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  MessagesSquare,
  Plug,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  UsersRound,
} from 'lucide-react';
import type { StaffSection } from '../../../lib/staffOps';
import type { StaffOverviewConfig } from '../../../lib/staffOverviewConfig';
import type { PlatformStats } from '../../../lib/staffOps';
import type { PlatformRole } from '../../../types';

export const QUICK_LINK_META: Record<
  StaffSection,
  { label: string; icon: import('lucide-react').LucideIcon; sub: string }
> = {
  overview: { label: 'Overview', icon: LayoutDashboard, sub: 'Command center' },
  map: { label: 'Map', icon: MapPin, sub: 'Live coverage' },
  applications: { label: 'Applications', icon: UserCheck, sub: 'Review queue' },
  credentials: { label: 'Credentials', icon: ClipboardList, sub: 'Verify uploads' },
  jobs: { label: 'Jobs', icon: Briefcase, sub: 'Pipeline' },
  guards: { label: 'Guards', icon: Shield, sub: 'Field roster' },
  team: { label: 'Staff', icon: Users, sub: 'Platform team' },
  clients: { label: 'Clients', icon: Building2, sub: 'Accounts' },
  crews: { label: 'Crews', icon: UsersRound, sub: 'Teams' },
  incidents: { label: 'Incidents', icon: AlertTriangle, sub: 'Follow-up' },
  violations: { label: 'Violations', icon: ShieldAlert, sub: 'Shift issues' },
  stats: { label: 'Stats', icon: BarChart3, sub: 'Reporting' },
  messages: { label: 'Messages', icon: MessagesSquare, sub: 'Inbox' },
  support: { label: 'Support', icon: LifeBuoy, sub: 'Tickets' },
  'team-chat': { label: 'Messages', icon: MessagesSquare, sub: 'Inbox' },
  'job-chats': { label: 'Messages', icon: MessagesSquare, sub: 'Inbox' },
  payments: { label: 'Payments', icon: DollarSign, sub: 'Billing' },
  'payment-settings': { label: 'Payment settings', icon: CreditCard, sub: 'Stripe' },
  agreements: { label: 'Agreements', icon: FileText, sub: 'Legal' },
  'audit-log': { label: 'Audit log', icon: ScrollText, sub: 'Activity' },
  disputes: { label: 'Disputes', icon: AlertTriangle, sub: 'Resolution' },
  analytics: { label: 'Analytics', icon: BarChart3, sub: 'Trends' },
  settings: { label: 'Public Information', icon: Settings, sub: 'Company info' },
  permissions: { label: 'Permissions', icon: KeyRound, sub: 'Access rules' },
  integrations: { label: 'Integrations', icon: Plug, sub: 'Connections' },
  cities: { label: 'Operations', icon: MapPin, sub: 'Markets' },
  guide: { label: 'Guide', icon: LayoutDashboard, sub: 'How-to' },
  'dev-updates': { label: 'Dev notes', icon: LayoutDashboard, sub: 'Release log' },
  profile: { label: 'Profile', icon: UserCheck, sub: 'Your account' },
  preferences: { label: 'Preferences', icon: Settings, sub: 'Settings' },
};

export const STAFF_OVERVIEW_HUB_META: Record<
  string,
  { title: string; description: string; iconTone: 'green' | 'yellow' | 'orange' }
> = {
  jobs: {
    title: 'Jobs',
    description: 'Review requests and manage active coverage',
    iconTone: 'yellow',
  },
  map: {
    title: 'Map',
    description: 'Live guard locations and on-site shifts',
    iconTone: 'green',
  },
  applications: {
    title: 'Applications',
    description: 'Pending accounts, jobs, and schedule changes',
    iconTone: 'orange',
  },
  credentials: {
    title: 'Credentials',
    description: 'Verify guard licenses and certifications',
    iconTone: 'yellow',
  },
  guards: {
    title: 'Guards',
    description: 'Field roster, performance, and assignments',
    iconTone: 'green',
  },
  incidents: {
    title: 'Incidents',
    description: 'Client reports and escalation follow-up',
    iconTone: 'orange',
  },
  messages: {
    title: 'Messages',
    description: 'Job chats, support, and team inbox',
    iconTone: 'green',
  },
  payments: {
    title: 'Payments',
    description: 'Deposits, payouts, and billing follow-up',
    iconTone: 'yellow',
  },
  analytics: {
    title: 'Analytics',
    description: 'Platform trends and operational reporting',
    iconTone: 'green',
  },
  team: {
    title: 'Staff',
    description: 'Platform team, roles, and access',
    iconTone: 'green',
  },
  clients: {
    title: 'Clients',
    description: 'Client accounts and coverage history',
    iconTone: 'yellow',
  },
  settings: {
    title: 'Public information',
    description: 'Company profile and platform settings',
    iconTone: 'green',
  },
  'payment-settings': {
    title: 'Payment settings',
    description: 'Stripe, fees, and payout configuration',
    iconTone: 'yellow',
  },
  agreements: {
    title: 'Agreements',
    description: 'Legal templates and signed contracts',
    iconTone: 'orange',
  },
  'audit-log': {
    title: 'Audit log',
    description: 'Staff actions and platform activity',
    iconTone: 'orange',
  },
  crews: {
    title: 'Crews',
    description: 'Guard teams and crew assignments',
    iconTone: 'green',
  },
  violations: {
    title: 'Violations',
    description: 'Shift issues and policy follow-up',
    iconTone: 'orange',
  },
  stats: {
    title: 'Stats',
    description: 'Guard performance and reporting',
    iconTone: 'green',
  },
  cities: {
    title: 'Operations',
    description: 'City markets and coverage in your assigned areas',
    iconTone: 'green',
  },
  permissions: {
    title: 'Permissions',
    description: 'Staff roles, approval rules, and access',
    iconTone: 'orange',
  },
};

const DEFAULT_HUB_SECTIONS: StaffSection[] = ['map', 'jobs', 'applications', 'payments', 'analytics'];

export function buildStaffOverviewHubItems(
  sections: StaffSection[],
  onNavigate: (section: StaffSection) => void,
) {
  const items: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    iconTone: 'green' | 'yellow' | 'orange';
    onClick: () => void;
  }[] = [];

  const tryAdd = (section: StaffSection) => {
    if (items.some((item) => item.id === section)) return;
    const meta = QUICK_LINK_META[section];
    const hubMeta = STAFF_OVERVIEW_HUB_META[section];
    if (!meta || !hubMeta) return;
    items.push({
      id: section,
      title: hubMeta.title,
      description: hubMeta.description,
      icon: meta.icon,
      iconTone: hubMeta.iconTone,
      onClick: () => onNavigate(section),
    });
  };

  for (const section of sections) tryAdd(section);
  for (const section of DEFAULT_HUB_SECTIONS) {
    if (items.length >= 3) break;
    tryAdd(section);
  }

  return items.slice(0, 4);
}

export function StaffOverviewHubCards({
  items,
  className = '',
}: {
  items: { id: string; title: string; description: string; icon: LucideIcon; iconTone: 'green' | 'yellow' | 'orange'; onClick: () => void }[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`uber-direct-home-hub staff-overview-hub ${className}`.trim()}>
      {items.map((item) => (
        <UberDirectHubCard
          key={item.id}
          title={item.title}
          description={item.description}
          icon={item.icon}
          iconTone={item.iconTone}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
}

export function StaffOverviewQuickGrid({
  items,
}: {
  items: { id: string; label: string; sub: string; icon: LucideIcon; primary?: boolean; onClick: () => void }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="uber-mobile-action-grid" role="navigation" aria-label="Quick actions">
      {items.map((item) => (
        <QuickActionTile
          key={item.id}
          icon={item.icon}
          label={item.label}
          sub={item.sub}
          primary={item.primary}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
}

export function StaffOverviewStatusBanner({
  healthy,
  pendingReviews,
  onReview,
}: {
  healthy: boolean;
  pendingReviews: number;
  onReview?: () => void;
}) {
  return (
    <button
      type="button"
      className={`staff-overview-status-banner${healthy ? ' staff-overview-status-banner--ok' : ' staff-overview-status-banner--warn'}`}
      onClick={onReview}
      disabled={!onReview}
    >
      <span className="staff-overview-status-banner-dot" aria-hidden />
      <span className="staff-overview-status-banner-copy">
        <span className="staff-overview-status-banner-title">
          {healthy ? 'All clear' : 'Needs review'}
        </span>
        <span className="staff-overview-status-banner-sub">
          {healthy
            ? 'Operations are running smoothly'
            : `${pendingReviews} item${pendingReviews === 1 ? '' : 's'} in the review queue`}
        </span>
      </span>
      {onReview ? <ChevronRight size={18} aria-hidden className="staff-overview-status-banner-chevron" /> : null}
    </button>
  );
}

export function StaffOverviewSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="staff-overview-section-head">
      <LabelSmall margin={0} $style={{ fontWeight: 700, fontSize: '14px', color: 'inherit' }}>
        {title}
      </LabelSmall>
      {actionLabel && onAction ? (
        <button type="button" className="uber-direct-inline-link" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function StaffOverviewListPanel({
  title,
  actionLabel,
  onAction,
  emptyIcon: EmptyIcon = CheckCircle2,
  emptyTitle,
  emptyBody,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyBody?: string;
  children?: React.ReactNode;
}) {
  const isEmpty = !children;

  return (
    <WorkbenchPanel className="staff-overview-list-panel" padding>
      <StaffOverviewSectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />
      {isEmpty && emptyTitle ? (
        <div className="staff-overview-empty-card staff-overview-empty-card--panel">
          <EmptyIcon className="w-5 h-5 uber-text-muted shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{emptyTitle}</p>
            {emptyBody ? <p className="text-xs uber-text-muted mt-0.5 leading-relaxed">{emptyBody}</p> : null}
          </div>
        </div>
      ) : (
        <ul className="uber-mobile-list staff-overview-list">{children}</ul>
      )}
    </WorkbenchPanel>
  );
}

export function StaffOverviewListRow({
  icon,
  title,
  description,
  meta,
  badge,
  urgent = false,
  onClick,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  meta?: string;
  badge?: React.ReactNode;
  urgent?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`uber-mobile-list-row staff-overview-list-row${urgent ? ' staff-overview-list-row--urgent' : ''}`}
        onClick={onClick}
        disabled={!onClick}
      >
        {icon ? <span className="staff-overview-list-row-icon">{icon}</span> : null}
        <span className="staff-overview-list-row-copy">
          <span className="staff-overview-list-row-title-row">
            <span className="staff-overview-list-row-title">{title}</span>
            {badge}
          </span>
          {description ? <span className="staff-overview-list-row-description">{description}</span> : null}
          {meta ? <span className="staff-overview-list-row-meta">{meta}</span> : null}
        </span>
        {onClick ? <ArrowRight size={16} className="staff-overview-list-row-chevron" aria-hidden /> : null}
      </button>
    </li>
  );
}

export function StaffOverviewShortcutRow({
  title,
  description,
  onClick,
}: {
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className="uber-mobile-list-row staff-overview-shortcut-row" onClick={onClick}>
        <span className="staff-overview-list-row-copy">
          <span className="staff-overview-list-row-title">{title}</span>
          {description ? <span className="staff-overview-list-row-description">{description}</span> : null}
        </span>
        <ChevronRight size={16} className="staff-overview-list-row-chevron" aria-hidden />
      </button>
    </li>
  );
}

export function StaffOverviewRoleHeader({
  config,
  healthy,
  pendingReviews,
  onReview,
}: {
  config: StaffOverviewConfig;
  healthy: boolean;
  pendingReviews: number;
  onReview?: () => void;
}) {
  return (
    <header className="staff-overview-pro-hero">
      <p className="staff-overview-pro-kicker">{config.workspaceKicker}</p>
      <h1 className="staff-overview-pro-title">{config.roleLabel} overview</h1>
      <p className="staff-overview-pro-focus">{config.focusLine}</p>
      <StaffOverviewStatusBanner healthy={healthy} pendingReviews={pendingReviews} onReview={onReview} />
    </header>
  );
}

/** Compact desktop page header — toolbar density, inline status chip. */
export function StaffOverviewDesktopHeader({
  config,
  healthy,
  pendingReviews,
  onReview,
}: {
  config: StaffOverviewConfig;
  healthy: boolean;
  pendingReviews: number;
  onReview?: () => void;
}) {
  return (
    <header className="staff-overview-desktop-head">
      <div className="staff-overview-desktop-head-copy">
        <p className="staff-overview-desktop-eyebrow">{config.workspaceKicker}</p>
        <div className="staff-overview-desktop-head-row">
          <h1 className="staff-overview-desktop-title">{config.roleLabel} overview</h1>
          <button
            type="button"
            className={`staff-overview-desktop-status-chip${healthy ? '' : ' staff-overview-desktop-status-chip--warn'}`}
            onClick={onReview}
            disabled={!onReview}
          >
            <span className="staff-overview-desktop-status-dot" aria-hidden />
            <span className="staff-overview-desktop-status-label">
              {healthy ? 'All clear' : `${pendingReviews} need review`}
            </span>
          </button>
        </div>
        <p className="staff-overview-desktop-subtitle">{config.focusLine}</p>
      </div>
    </header>
  );
}

export function StaffOverviewKpiGrid({
  metrics,
  onNavigate,
}: {
  metrics: { label: string; value: string; sub: string; accent?: boolean; navigateTo?: StaffSection }[];
  onNavigate?: (section: StaffSection) => void;
}) {
  if (metrics.length === 0) return null;
  return (
    <section className="staff-overview-pro-kpi" aria-label="Key metrics">
      {metrics.map((metric) => (
        <button
          key={metric.label}
          type="button"
          className={`staff-overview-pro-kpi-card${metric.accent ? ' staff-overview-pro-kpi-card--accent' : ''}`}
          onClick={metric.navigateTo && onNavigate ? () => onNavigate(metric.navigateTo!) : undefined}
          disabled={!metric.navigateTo || !onNavigate}
        >
          <span className="staff-overview-pro-kpi-value">{metric.value}</span>
          <span className="staff-overview-pro-kpi-label">{metric.label}</span>
          <span className="staff-overview-pro-kpi-sub">{metric.sub}</span>
        </button>
      ))}
    </section>
  );
}

/** Desktop metric strip — compact white cells instead of tall mobile KPI cards. */
export function StaffOverviewDesktopKpiStrip({
  metrics,
  onNavigate,
}: {
  metrics: { label: string; value: string; sub: string; accent?: boolean; navigateTo?: StaffSection }[];
  onNavigate?: (section: StaffSection) => void;
}) {
  if (metrics.length === 0) return null;
  return (
    <section className="staff-overview-desktop-metrics" aria-label="Key metrics">
      <MetricStrip className="staff-overview-desktop-metric-strip">
        {metrics.map((metric) => (
          <MetricCell
            key={metric.label}
            label={metric.label}
            value={metric.value}
            sub={metric.sub}
            highlight={metric.accent}
            onClick={metric.navigateTo && onNavigate ? () => onNavigate(metric.navigateTo!) : undefined}
          />
        ))}
      </MetricStrip>
    </section>
  );
}

export function StaffOverviewQueueBoard({
  stats,
  showPayments,
  staffRole,
  onNavigate,
  layout = 'default',
}: {
  stats: PlatformStats;
  showPayments: boolean;
  staffRole: PlatformRole;
  onNavigate: (section: StaffSection) => void;
  layout?: 'default' | 'desktop';
}) {
  const allRows = [
    {
      id: 'job-offers',
      label: 'Job offers',
      count: stats.pendingJobApprovals,
      description: 'New job requests waiting for staff approval',
      section: 'applications' as StaffSection,
      roles: ['administrator', 'manager', 'director', 'owner'] as PlatformRole[],
    },
    {
      id: 'schedule-changes',
      label: 'Schedule changes',
      count: stats.pendingScheduleChanges,
      description: 'Guard or client requested a schedule update',
      section: 'applications' as StaffSection,
      roles: ['administrator', 'manager', 'director', 'owner'] as PlatformRole[],
    },
    {
      id: 'credentials',
      label: 'Credentials',
      count: stats.pendingCertApprovals,
      description: 'Licenses and certifications to verify',
      section: 'credentials' as StaffSection,
      roles: ['moderator', 'administrator', 'manager', 'director', 'owner'] as PlatformRole[],
    },
    {
      id: 'applications',
      label: 'Account applications',
      count: stats.pendingAccountApplications,
      description: 'New guard, client, or staff sign-ups',
      section: 'applications' as StaffSection,
      roles: ['administrator', 'manager', 'director', 'owner'] as PlatformRole[],
    },
    {
      id: 'payments',
      label: 'Payments',
      count: stats.paymentsNeedingAction,
      description: 'Deposits, payouts, or billing follow-up',
      section: 'payments' as StaffSection,
      roles: ['manager', 'director', 'owner'] as PlatformRole[],
      hidden: !showPayments,
    },
    {
      id: 'incidents',
      label: 'Active incidents',
      count: stats.activeIncidents,
      description: 'Open incident reports needing follow-up',
      section: 'incidents' as StaffSection,
      roles: ['moderator', 'administrator', 'manager', 'director', 'owner'] as PlatformRole[],
    },
  ];

  const rows = allRows.filter((row) => !row.hidden && row.roles.includes(staffRole));

  const totalPending = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <WorkbenchPanel
      className={`staff-overview-list-panel staff-overview-pro-queue${layout === 'desktop' ? ' staff-overview-pro-queue--desktop' : ''}`}
      padding
    >
      <StaffOverviewSectionHeader
        title="Approval & action queue"
        actionLabel={totalPending > 0 ? 'Open queue' : undefined}
        onAction={totalPending > 0 ? () => onNavigate('applications') : undefined}
      />
      <ul className={`staff-overview-pro-queue-grid${layout === 'desktop' ? ' staff-overview-pro-queue-grid--desktop' : ''}`}>
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={`staff-overview-pro-queue-card${row.count > 0 ? ' staff-overview-pro-queue-card--active' : ''}`}
              onClick={() => onNavigate(row.section)}
            >
              <span className="staff-overview-pro-queue-count">{row.count}</span>
              <span className="staff-overview-pro-queue-label">{row.label}</span>
              <span className="staff-overview-pro-queue-desc">{row.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </WorkbenchPanel>
  );
}

export function StaffOverviewActivityPanel({
  items,
  formatTime,
  onViewAll,
}: {
  items: { id: string; message: string; timestamp: string }[];
  formatTime: (iso: string) => string;
  onViewAll?: () => void;
}) {
  return (
    <WorkbenchPanel className="staff-overview-list-panel staff-overview-pro-activity" padding>
      <StaffOverviewSectionHeader title="Recent activity" actionLabel={onViewAll ? 'View all' : undefined} onAction={onViewAll} />
      {items.length === 0 ? (
        <div className="staff-overview-empty-card staff-overview-empty-card--panel">
          <CheckCircle2 className="w-5 h-5 uber-text-muted shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">No recent activity</p>
            <p className="text-xs uber-text-muted mt-0.5 leading-relaxed">
              Check-ins, patrol reports, and new jobs will show here as they happen.
            </p>
          </div>
        </div>
      ) : (
        <ul className="staff-overview-feed-list">
          {items.map((item) => (
            <li key={item.id} className="staff-overview-feed-item">
              <span className="staff-overview-feed-dot" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm leading-snug">{item.message}</p>
                <p className="text-[11px] uber-text-muted mt-0.5">{formatTime(item.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WorkbenchPanel>
  );
}

export function StaffOverviewMetricChips({
  metrics,
  onNavigate,
}: {
  metrics: { label: string; value: string; navigateTo?: string }[];
  onNavigate?: (section: string) => void;
}) {
  if (metrics.length === 0) return null;
  return (
    <div className="staff-overview-metric-chips" role="list">
      {metrics.map((metric) => (
        <button
          key={metric.label}
          type="button"
          className="staff-overview-metric-chip"
          onClick={metric.navigateTo && onNavigate ? () => onNavigate(metric.navigateTo!) : undefined}
          disabled={!metric.navigateTo || !onNavigate}
        >
          <span className="staff-overview-metric-chip-value">{metric.value}</span>
          <span className="staff-overview-metric-chip-label">{metric.label}</span>
        </button>
      ))}
    </div>
  );
}
