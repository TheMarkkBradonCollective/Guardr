import {
  BookOpen,
  Briefcase,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  Map,
  MapPin,
  MessageSquare,
  Settings,
  Shield,
  Truck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { GuardrNavGroup, GuardrNavItem } from '../components/baseui/layout/types';
import type { NavItemDef } from './nav';
import { STAFF_GROUPS, STAFF_NAV } from './nav';

const ICON_BY_ID: Record<string, LucideIcon> = {
  home: Home,
  requests: ClipboardList,
  map: Map,
  messages: MessageSquare,
  guards: Users,
  invoices: FileText,
  locations: MapPin,
  reports: FileText,
  settings: Settings,
  myJobs: Briefcase,
  crew: Users,
  availability: Calendar,
  preferences: Settings,
  performance: Shield,
  vehicle: Truck,
  earnings: DollarSign,
  activation: Shield,
  profile: User,
  overview: Home,
  jobs: Briefcase,
  applications: ClipboardList,
  credentials: Shield,
  clients: Users,
  teams: Users,
  team: Users,
  crews: Users,
  payments: DollarSign,
  'payment-settings': Settings,
  agreements: FileText,
  'audit-log': FileText,
  incidents: Shield,
  violations: Shield,
  stats: ClipboardList,
  disputes: Shield,
  analytics: ClipboardList,
  cities: MapPin,
  permissions: Shield,
  integrations: Settings,
  guide: BookOpen,
  'dev-updates': ClipboardList,
  'design-qa': ClipboardList,
};

export function toGuardrNavItems(items: NavItemDef[]): GuardrNavItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    icon: ICON_BY_ID[item.id] ?? Map,
  }));
}

export function staffNavGroups(): GuardrNavGroup[] {
  return STAFF_GROUPS.map((group) => ({
    title: group.title,
    items: group.ids
      .map((id) => STAFF_NAV.find((n) => n.id === id))
      .filter((n): n is NavItemDef => !!n)
      .map((n) => ({
        id: n.id,
        label: n.label,
        icon: ICON_BY_ID[n.id] ?? Map,
      })),
  }));
}
