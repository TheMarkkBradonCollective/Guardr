/**
 * Static data for the surface preview harness.
 *
 * Mirrors the shape of real Guardr records so the three surface previews show
 * realistic density — column counts, name lengths, and status spread all affect
 * whether a layout actually works.
 */

import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CreditCard,
  FileText,
  LifeBuoy,
  Map,
  MessagesSquare,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { SurfaceDestination } from '../surfaces/surfaceNavigation';

export type ShiftStatus = 'on-time' | 'en-route' | 'in-progress' | 'completed' | 'no-show' | 'unassigned';

export interface PreviewShift {
  id: string;
  site: string;
  city: string;
  guard: string;
  guardInitials: string;
  window: string;
  rate: string;
  payout: string;
  status: ShiftStatus;
  armed: boolean;
  columnId: string;
}

export const SHIFT_STATUS_LABEL: Record<ShiftStatus, string> = {
  'on-time': 'On time',
  'en-route': 'En route',
  'in-progress': 'On shift',
  completed: 'Completed',
  'no-show': 'No show',
  unassigned: 'Unassigned',
};

export const SHIFT_STATUS_TONE: Record<ShiftStatus, 'neutral' | 'positive' | 'warning' | 'critical' | 'info'> = {
  'on-time': 'positive',
  'en-route': 'info',
  'in-progress': 'positive',
  completed: 'neutral',
  'no-show': 'critical',
  unassigned: 'warning',
};

export const PREVIEW_SHIFTS: PreviewShift[] = [
  {
    id: '2131256835',
    site: 'Portage Distribution — Dock A3',
    city: 'Sacramento',
    guard: 'Marcus Trent',
    guardInitials: 'MT',
    window: 'Today 08:00 – 16:00',
    rate: '$28.00/hr',
    payout: '$224.00',
    status: 'in-progress',
    armed: false,
    columnId: 'live',
  },
  {
    id: '4901238031',
    site: 'Harbor Logistics — Gate 2',
    city: 'West Sacramento',
    guard: 'Janelle Reyes',
    guardInitials: 'JR',
    window: 'Today 09:00 – 17:00',
    rate: '$24.00/hr',
    payout: '$192.00',
    status: 'en-route',
    armed: false,
    columnId: 'live',
  },
  {
    id: '0219831134',
    site: 'Civic Center Plaza',
    city: 'Sacramento',
    guard: 'Andre Powell',
    guardInitials: 'AP',
    window: 'Today 10:00 – 18:00',
    rate: '$31.50/hr',
    payout: '$252.00',
    status: 'on-time',
    armed: true,
    columnId: 'live',
  },
  {
    id: '1298013254',
    site: 'Riverside Warehouse',
    city: 'Rancho Cordova',
    guard: 'Dana Kimura',
    guardInitials: 'DK',
    window: 'Yesterday 12:00 – 20:00',
    rate: '$26.00/hr',
    payout: '$208.00',
    status: 'completed',
    armed: false,
    columnId: 'closed',
  },
  {
    id: '4890879031',
    site: 'Northgate Retail Center',
    city: 'Sacramento',
    guard: 'Unassigned',
    guardInitials: '—',
    window: 'Tomorrow 18:00 – 02:00',
    rate: '$29.75/hr',
    payout: '$238.00',
    status: 'unassigned',
    armed: true,
    columnId: 'open',
  },
  {
    id: '7712049920',
    site: 'Midtown Event Hall',
    city: 'Sacramento',
    guard: 'Unassigned',
    guardInitials: '—',
    window: 'Sat 20:00 – 04:00',
    rate: '$34.00/hr',
    payout: '$272.00',
    status: 'unassigned',
    armed: false,
    columnId: 'open',
  },
  {
    id: '5540118872',
    site: 'Elk Grove Construction Yard',
    city: 'Elk Grove',
    guard: 'Priya Raman',
    guardInitials: 'PR',
    window: 'Mon 06:00 – 14:00',
    rate: '$27.25/hr',
    payout: '$218.00',
    status: 'on-time',
    armed: false,
    columnId: 'scheduled',
  },
  {
    id: '9083311204',
    site: 'Folsom Tech Campus — North',
    city: 'Folsom',
    guard: 'Cole Whitaker',
    guardInitials: 'CW',
    window: 'Mon 22:00 – 06:00',
    rate: '$30.00/hr',
    payout: '$240.00',
    status: 'no-show',
    armed: false,
    columnId: 'closed',
  },
  // Enough live rows that the mobile list actually scrolls — a three-row list
  // cannot demonstrate the collapsing title or the pinned filter row.
  {
    id: '6620117745',
    site: 'Arden Fair Mall — East Entrance',
    city: 'Sacramento',
    guard: 'Tomas Delgado',
    guardInitials: 'TD',
    window: 'Today 11:00 – 19:00',
    rate: '$25.50/hr',
    payout: '$204.00',
    status: 'in-progress',
    armed: false,
    columnId: 'live',
  },
  {
    id: '3301887420',
    site: 'Sutter Medical Campus — Lot B',
    city: 'Sacramento',
    guard: 'Aisha Bello',
    guardInitials: 'AB',
    window: 'Today 07:00 – 15:00',
    rate: '$27.00/hr',
    payout: '$216.00',
    status: 'on-time',
    armed: false,
    columnId: 'live',
  },
  {
    id: '8845200913',
    site: 'Railyards Construction — Gate 4',
    city: 'Sacramento',
    guard: 'Victor Nunes',
    guardInitials: 'VN',
    window: 'Today 06:00 – 14:00',
    rate: '$26.75/hr',
    payout: '$214.00',
    status: 'in-progress',
    armed: true,
    columnId: 'live',
  },
  {
    id: '1170338265',
    site: 'Natomas Distribution — Bay 7',
    city: 'Sacramento',
    guard: 'Renee Alvarado',
    guardInitials: 'RA',
    window: 'Today 14:00 – 22:00',
    rate: '$28.50/hr',
    payout: '$228.00',
    status: 'en-route',
    armed: false,
    columnId: 'live',
  },
  {
    id: '5019924471',
    site: 'Golden 1 Center — Service Corridor',
    city: 'Sacramento',
    guard: 'Marcus Okafor',
    guardInitials: 'MO',
    window: 'Today 16:00 – 00:00',
    rate: '$33.00/hr',
    payout: '$264.00',
    status: 'on-time',
    armed: false,
    columnId: 'live',
  },
];

export interface PreviewThread {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
}

export const PREVIEW_THREADS: PreviewThread[] = [
  { id: 't1', name: 'Portage Distribution', preview: 'Dock A3 gate code changed to 4417.', time: '2m', unread: 2 },
  { id: 't2', name: 'Marcus Trent', preview: 'Clocked in, perimeter walk starting.', time: '14m', unread: 0 },
  { id: 't3', name: 'Guardr support', preview: 'Your BSIS renewal was approved.', time: '1h', unread: 1 },
  { id: 't4', name: 'Harbor Logistics', preview: 'Can we extend tonight by two hours?', time: '3h', unread: 0 },
  { id: 't5', name: 'Sacramento crew', preview: 'Andre picked up the Civic Center slot.', time: 'Yest', unread: 0 },
];

/** Guard destinations — the mobile app is the guard's primary surface. */
export const GUARD_DESTINATIONS: SurfaceDestination[] = [
  { id: 'map', label: 'Map', icon: Map, section: 'Work', mobileRank: 1, tabletQuick: true },
  { id: 'myJobs', label: 'Shifts', icon: Briefcase, section: 'Work', mobileRank: 2, tabletQuick: true, badge: 2 },
  { id: 'earnings', label: 'Payments', icon: CreditCard, section: 'Work', mobileRank: 3 },
  { id: 'messages', label: 'Messages', icon: MessagesSquare, section: 'Communications', mobileRank: 4, badge: 3 },
  { id: 'support', label: 'Support', icon: LifeBuoy, section: 'Communications' },
  { id: 'availability', label: 'Availability', icon: CalendarDays, section: 'Profile' },
  { id: 'performance', label: 'Performance', icon: BarChart3, section: 'Profile' },
  { id: 'credentials', label: 'Credentials', icon: ShieldCheck, section: 'Profile' },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal, section: 'Profile' },
  { id: 'guide', label: 'Guide', icon: FileText, section: 'Help' },
];

/** Staff destinations — the desktop operations centre is the staff surface. */
export const STAFF_DESTINATIONS: SurfaceDestination[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3, section: 'Dashboard', mobileRank: 1, tabletQuick: true },
  { id: 'map', label: 'Live map', icon: Map, section: 'Dashboard', tabletQuick: true },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, section: 'Operations', mobileRank: 2, tabletQuick: true, badge: 4 },
  { id: 'guards', label: 'Guards', icon: Users, section: 'Operations', mobileRank: 3 },
  { id: 'clients', label: 'Clients', icon: Users, section: 'Operations' },
  { id: 'credentials', label: 'Credentials', icon: ShieldCheck, section: 'Operations', badge: 7 },
  { id: 'messages', label: 'Messages', icon: MessagesSquare, section: 'Communications', mobileRank: 4, badge: 3 },
  { id: 'support', label: 'Support', icon: LifeBuoy, section: 'Communications' },
  { id: 'payments', label: 'Payments & invoices', icon: CreditCard, section: 'Management' },
  { id: 'agreements', label: 'Agreements', icon: FileText, section: 'Management' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'Oversight' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'Platform' },
];
