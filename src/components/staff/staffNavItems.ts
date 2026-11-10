import type { StaffSection } from '../../lib/staffOps';
import type { LayoutDashboard } from 'lucide-react';

/** A staff destination. The shell decides how each surface shows it. */
export interface StaffNavItem {
  id: StaffSection;
  label: string;
  icon: typeof LayoutDashboard;
  paymentsOnly?: boolean;
  financeOnly?: boolean;
  settingsOnly?: boolean;
  permissionsOnly?: boolean;
  citiesOnly?: boolean;
  disputesOnly?: boolean;
  managementOnly?: boolean;
  /** Hidden when the page would be a blocked screen for this role. */
  applicationsOnly?: boolean;
  credentialsOnly?: boolean;
  statsOnly?: boolean;
  analyticsOnly?: boolean;
  violationsOnly?: boolean;
  messagesOnly?: boolean;
}
