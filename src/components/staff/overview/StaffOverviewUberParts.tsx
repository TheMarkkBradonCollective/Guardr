import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { LabelSmall } from 'baseui/typography';
import { UberDirectHubCard } from '../../baseui/dashboard';
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
  support: { label: 'Messages', icon: MessagesSquare, sub: 'Inbox' },
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

  return items.slice(0, 3);
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
