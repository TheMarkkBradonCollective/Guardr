import React from 'react';
import { StaffSection } from '../../lib/staffOps';
import { LayoutDashboard } from 'lucide-react';

export interface StaffNavItem {
  id: StaffSection;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  adminOnly?: boolean;
}

interface StaffSidebarNavProps {
  items: StaffNavItem[];
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  showFinance: boolean;
}

const DASHBOARD_IDS: StaffSection[] = ['overview', 'map'];
const OPERATIONS_IDS: StaffSection[] = [
  'jobs',
  'approvals',
  'clients',
  'guards',
  'team',
  'team-chat',
  'job-chats',
  'payments',
];
const PEOPLE_IDS: StaffSection[] = ['support', 'incidents', 'disputes', 'analytics'];
const HELP_IDS: StaffSection[] = ['guide'];
const PLATFORM_IDS: StaffSection[] = ['settings'];

function NavGroup({
  title,
  itemIds,
  items,
  activeSection,
  onNavigate,
}: {
  title: string;
  itemIds: StaffSection[];
  items: StaffNavItem[];
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
}) {
  const groupItems = itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is StaffNavItem => !!item);

  if (groupItems.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted opacity-60">
        {title}
      </p>
      <div className="uber-side-nav">
        {groupItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`uber-side-nav-item w-full flex items-center gap-2.5 text-left transition-colors ${
              activeSection === id ? 'uber-side-nav-item-active' : ''
            }`}
          >
            <Icon className="w-[1.125rem] h-[1.125rem] shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span className="text-[11px] font-bold min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 rounded-full bg-white/15 text-white/85">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
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
}: StaffSidebarNavProps) {
  const visibleItems = items.filter((item) => !item.adminOnly || showFinance);

  return (
    <nav aria-label="Staff navigation">
      <NavGroup
        title="Dashboard"
        itemIds={DASHBOARD_IDS}
        items={visibleItems}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
      <NavGroup
        title="Operations"
        itemIds={OPERATIONS_IDS}
        items={visibleItems}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
      <NavGroup
        title="Support & insights"
        itemIds={PEOPLE_IDS}
        items={visibleItems}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
      <NavGroup
        title="Help"
        itemIds={HELP_IDS}
        items={visibleItems}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
      {showFinance && (
        <NavGroup
          title="Platform"
          itemIds={PLATFORM_IDS}
          items={visibleItems}
          activeSection={activeSection}
          onNavigate={onNavigate}
        />
      )}
    </nav>
  );
}
