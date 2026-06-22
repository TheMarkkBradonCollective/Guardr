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

const PRIMARY_IDS: StaffSection[] = ['overview', 'map', 'jobs', 'approvals'];
const MORE_IDS: StaffSection[] = ['clients', 'guards', 'team', 'messages', 'support', 'incidents', 'disputes', 'analytics'];
const ADMIN_IDS: StaffSection[] = ['payments', 'settings'];

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
    <div className="mb-4">
      <p className="px-3 mb-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-brand-text-muted">
        {title}
      </p>
      <div className="uber-side-nav divide-y divide-brand-border border-y border-brand-border">
        {groupItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`uber-side-nav-item w-full flex items-center gap-2 px-3 py-3 text-left text-sm font-medium transition-colors ${
              activeSection === id
                ? 'uber-side-nav-item-active bg-brand-primary text-brand-accent-text'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 min-w-[1.25rem] text-center ${
                  activeSection === id
                    ? 'bg-brand-accent-text/20 text-brand-accent-text'
                    : 'bg-brand-primary/15 text-brand-primary'
                }`}
              >
                {badge}
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
  const adminItems = showFinance ? ADMIN_IDS : [];

  return (
    <nav aria-label="Staff navigation">
      <NavGroup
        title="Command"
        itemIds={PRIMARY_IDS}
        items={visibleItems}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
      <NavGroup
        title="Operations"
        itemIds={MORE_IDS}
        items={visibleItems}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
      {adminItems.length > 0 && (
        <NavGroup
          title="Administration"
          itemIds={adminItems}
          items={visibleItems}
          activeSection={activeSection}
          onNavigate={onNavigate}
        />
      )}
    </nav>
  );
}
