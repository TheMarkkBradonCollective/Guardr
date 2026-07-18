import React from 'react';
import { StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible, type StaffNavAccessFlags } from '../../../lib/staffNavAccess';
import { showAppAlert } from '../../ui/AppConfirm';
import { StaffNavItem } from '../../staff/StaffSidebarNav';
import { Logo } from '../../Logo';

interface StaffDesktopNavProps {
  items: StaffNavItem[];
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  showFinance: boolean;
  showSettings: boolean;
  showPermissions: boolean;
  showDisputes: boolean;
  footer?: React.ReactNode;
  brandingTrailing?: React.ReactNode;
}

const GROUPS: { title: string; ids: StaffSection[] }[] = [
  { title: 'Dashboard', ids: ['overview', 'map'] },
  {
    title: 'Operations',
    ids: ['jobs', 'applications', 'credentials', 'guards', 'crews', 'clients', 'team', 'messages'],
  },
  { title: 'Finance', ids: ['payments', 'payment-settings', 'agreements', 'audit-log'] },
  { title: 'Support & insights', ids: ['incidents', 'violations', 'stats', 'disputes', 'analytics'] },
  { title: 'Platform', ids: ['permissions', 'settings', 'integrations', 'guide', 'dev-updates'] },
];

export function StaffDesktopNav({
  items,
  activeSection,
  onNavigate,
  showFinance,
  showSettings,
  showPermissions,
  showDisputes,
  footer,
  brandingTrailing,
}: StaffDesktopNavProps) {
  const accessFlags: StaffNavAccessFlags = { showFinance, showSettings, showPermissions, showDisputes, showCities: false };

  const handleSelect = (id: StaffSection) => {
    const notice = getStaffNavAccessNotice(id, accessFlags);
    if (notice) {
      void showAppAlert({ title: notice.title, message: notice.message, tone: 'warning' });
      return;
    }
    onNavigate(id);
  };

  const visibleItem = (item: StaffNavItem) => isStaffNavItemVisible(item, accessFlags);

  return (
    <aside className="desktop-nav-rail desktop-nav-rail--staff" aria-label="Staff navigation">
      <div className="desktop-nav-rail-brand">
        <Logo size={22} className="text-brand-primary shrink-0" />
        <div className="desktop-nav-rail-brand-copy">
          <span className="desktop-nav-rail-brand-name">
            Guard<span className="text-brand-primary">r</span>
          </span>
          <span className="desktop-nav-rail-brand-tag">Operations</span>
        </div>
        {brandingTrailing}
      </div>

      <nav className="desktop-nav-rail-scroll">
        {GROUPS.map((group) => {
          const groupItems = group.ids
            .map((id) => items.find((item) => item.id === id))
            .filter((item): item is StaffNavItem => !!item && visibleItem(item));

          if (groupItems.length === 0) return null;

          return (
            <div key={group.title} className="desktop-nav-rail-section">
              <p className="desktop-nav-rail-section-label">{group.title}</p>
              <div className="desktop-nav-rail-group">
                {groupItems.map(({ id, label, icon: Icon, badge }) => {
                  const active = activeSection === id;
                  const locked = getStaffNavAccessNotice(id, accessFlags) != null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelect(id)}
                      className={`desktop-nav-rail-item${
                        active ? ' desktop-nav-rail-item--active' : ''
                      }${locked ? ' desktop-nav-rail-item--locked' : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="desktop-nav-rail-item-icon-wrap" aria-hidden>
                        <Icon
                          className="desktop-nav-rail-item-icon"
                          strokeWidth={active ? 2.25 : 1.85}
                        />
                      </span>
                      <span className="desktop-nav-rail-item-label">{label}</span>
                      {badge != null && badge > 0 ? (
                        <span className="desktop-nav-rail-item-badge">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {footer ? <div className="desktop-nav-rail-footer">{footer}</div> : null}
    </aside>
  );
}
