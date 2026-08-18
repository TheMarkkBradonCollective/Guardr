import React from 'react';
import { StaffSection } from '../../lib/staffOps';
import { STAFF_NAV_GROUPS } from '../../lib/staffNavGroups';
import { getStaffNavAccessNotice, isStaffNavItemVisible, type StaffNavAccessFlags } from '../../lib/staffNavAccess';
import { showAppAlert } from '../ui/AppConfirm';
import { LayoutDashboard } from 'lucide-react';

export interface StaffNavItem {
  id: StaffSection;
  label: string;
  icon: typeof LayoutDashboard;
  /** Visible only to finance staff (Payments & invoices). */
  paymentsOnly?: boolean;
  /** Visible only to Director and Founder (payments / fund handling) */
  financeOnly?: boolean;
  /** Visible to Administrator and above (platform settings) */
  settingsOnly?: boolean;
  /** Visible to Manager and above (permissions & approval rules) */
  permissionsOnly?: boolean;
  /** Visible to Manager and above (Service Areas controls) */
  citiesOnly?: boolean;
  /** Visible to Administrator and above (dispute resolution) */
  disputesOnly?: boolean;
}

interface StaffSidebarNavProps {
  items: StaffNavItem[];
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  showFinance: boolean;
  showPayments: boolean;
  showSettings: boolean;
  showPermissions: boolean;
  showDisputes: boolean;
  showCities: boolean;
  financeDeskOnly?: boolean;
}

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
    .filter((item): item is StaffNavItem => !!item && isStaffNavItemVisible(item, accessFlags));

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
        {groupItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            className={`uber-side-nav-item w-full flex items-center gap-2.5 text-left transition-colors ${
              activeSection === id ? 'uber-side-nav-item-active' : ''
            }`}
          >
            <Icon className="w-[1.125rem] h-[1.125rem] shrink-0" />
            <span className="flex-1 truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StaffSidebarNav({
  items,
  activeSection,
  onNavigate,
  showFinance,
  showPayments,
  showSettings,
  showPermissions,
  showDisputes,
  showCities,
  financeDeskOnly = false,
}: StaffSidebarNavProps) {
  const accessFlags = {
    showFinance,
    showPayments,
    showSettings,
    showPermissions,
    showDisputes,
    showCities,
    financeDeskOnly,
  };

  return (
    <nav aria-label="Staff navigation">
      {STAFF_NAV_GROUPS.map((group) => (
        <NavGroup
          key={group.title}
          title={group.title}
          itemIds={group.ids}
          items={items}
          activeSection={activeSection}
          onNavigate={onNavigate}
          accessFlags={accessFlags}
        />
      ))}
    </nav>
  );
}
