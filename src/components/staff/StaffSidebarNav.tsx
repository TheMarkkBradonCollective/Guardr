import React from 'react';
import { StaffSection } from '../../lib/staffOps';
import { getStaffNavAccessNotice, type StaffNavAccessFlags } from '../../lib/staffNavAccess';
import { showAppAlert } from '../ui/AppConfirm';
import { LayoutDashboard } from 'lucide-react';

export interface StaffNavItem {
  id: StaffSection;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  /** Visible only to Director and Founder (payments / fund handling) */
  financeOnly?: boolean;
  /** Visible to Administrator and above (platform settings) */
  settingsOnly?: boolean;
  /** Visible to Manager and above (city market controls) */
  citiesOnly?: boolean;
  /** Visible to Administrator and above (dispute resolution) */
  disputesOnly?: boolean;
}

interface StaffSidebarNavProps {
  items: StaffNavItem[];
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  showFinance: boolean;
  showSettings: boolean;
  showDisputes: boolean;
  showCities: boolean;
}

const DASHBOARD_IDS: StaffSection[] = ['overview', 'map'];
const OPERATIONS_IDS: StaffSection[] = [
  'jobs',
  'applications',
  'credentials',
  'clients',
  'guards',
  'crews',
  'team',
  'messages',
  'payments',
];
const PEOPLE_IDS: StaffSection[] = ['incidents', 'disputes', 'analytics'];
const HELP_IDS: StaffSection[] = ['guide', 'dev-updates'];
const PLATFORM_IDS: StaffSection[] = ['payment-settings', 'agreements', 'audit-log', 'cities', 'settings'];

function NavGroup({
  title,
  itemIds,
  items,
  activeSection,
  onNavigate,
  accessFlags,
}: {
  title: string;
  itemIds: StaffSection[];
  items: StaffNavItem[];
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  accessFlags: StaffNavAccessFlags;
}) {
  const groupItems = itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is StaffNavItem => !!item);

  if (groupItems.length === 0) return null;

  const handleSelect = (id: StaffSection) => {
    const notice = getStaffNavAccessNotice(id, accessFlags);
    if (notice) {
      void showAppAlert({ title: notice.title, message: notice.message, tone: 'warning' });
      return;
    }
    onNavigate(id);
  };

  return (
    <div className="mb-5">
      <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted opacity-60">
        {title}
      </p>
      <div className="uber-side-nav">
        {groupItems.map(({ id, label, icon: Icon, badge }) => {
          const locked = getStaffNavAccessNotice(id, accessFlags) != null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`uber-side-nav-item w-full flex items-center gap-2.5 text-left transition-colors ${
                activeSection === id ? 'uber-side-nav-item-active' : ''
              }${locked ? ' uber-side-nav-item--locked' : ''}`}
            >
              <Icon className="w-[1.125rem] h-[1.125rem] shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span className="sidebar-nav-badge text-[11px] font-bold min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 rounded-full">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StaffSidebarNav({
  items,
  activeSection,
  onNavigate,
  showFinance,
  showSettings,
  showDisputes,
  showCities,
}: StaffSidebarNavProps) {
  const accessFlags = { showFinance, showSettings, showDisputes, showCities };

  return (
    <nav aria-label="Staff navigation">
      <NavGroup
        title="Dashboard"
        itemIds={DASHBOARD_IDS}
        items={items}
        activeSection={activeSection}
        onNavigate={onNavigate}
        accessFlags={accessFlags}
      />
      <NavGroup
        title="Operations"
        itemIds={OPERATIONS_IDS}
        items={items}
        activeSection={activeSection}
        onNavigate={onNavigate}
        accessFlags={accessFlags}
      />
      <NavGroup
        title="Support & insights"
        itemIds={PEOPLE_IDS}
        items={items}
        activeSection={activeSection}
        onNavigate={onNavigate}
        accessFlags={accessFlags}
      />
      <NavGroup
        title="Help"
        itemIds={HELP_IDS}
        items={items}
        activeSection={activeSection}
        onNavigate={onNavigate}
        accessFlags={accessFlags}
      />
      <NavGroup
        title="Platform"
        itemIds={PLATFORM_IDS}
        items={items}
        activeSection={activeSection}
        onNavigate={onNavigate}
        accessFlags={accessFlags}
      />
    </nav>
  );
}
