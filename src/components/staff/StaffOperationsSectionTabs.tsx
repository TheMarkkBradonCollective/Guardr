import React, { useMemo } from 'react';
import {
  Briefcase,
  Building2,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
} from 'lucide-react';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';
import {
  isStaffOperationsSection,
  STAFF_OPERATIONS_SECTIONS,
  type StaffSection,
} from '../../lib/staffOps';

type OperationsSection = (typeof STAFF_OPERATIONS_SECTIONS)[number];

const OPS_TAB_META: Record<OperationsSection, { label: string; icon: React.ReactNode }> = {
  jobs: {
    label: 'Jobs',
    icon: <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />,
  },
  applications: {
    label: 'Applications',
    icon: <UserCheck className="w-3.5 h-3.5" strokeWidth={2} />,
  },
  credentials: {
    label: 'Credentials',
    icon: <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />,
  },
  guards: {
    label: 'Guards',
    icon: <Shield className="w-3.5 h-3.5" strokeWidth={2} />,
  },
  crews: {
    label: 'Crews',
    icon: <UsersRound className="w-3.5 h-3.5" strokeWidth={2} />,
  },
  clients: {
    label: 'Clients',
    icon: <Building2 className="w-3.5 h-3.5" strokeWidth={2} />,
  },
  team: {
    label: 'Staff',
    icon: <Users className="w-3.5 h-3.5" strokeWidth={2} />,
  },
};

interface StaffOperationsSectionTabsProps {
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  badges?: Partial<Record<StaffSection, number>>;
}

/** Communications-style inbox tabs for Operations section pages. */
export function StaffOperationsSectionTabs({
  activeSection,
  onNavigate,
  badges = {},
}: StaffOperationsSectionTabsProps) {
  const tabs = useMemo(
    () =>
      STAFF_OPERATIONS_SECTIONS.map((id) => ({
        id,
        label: OPS_TAB_META[id].label,
        icon: OPS_TAB_META[id].icon,
        badge: badges[id],
      })),
    [badges]
  );

  if (!isStaffOperationsSection(activeSection)) return null;

  return (
    <MessagesInboxTabs
      className="staff-operations-section-tabs"
      activeTab={activeSection}
      onTabChange={(tabId) => onNavigate(tabId as StaffSection)}
      tabs={tabs}
    />
  );
}
