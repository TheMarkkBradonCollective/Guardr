import {
  Calendar,
  Map,
  Radio,
  Shield,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface ExploreService {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  role?: 'client' | 'guard';
}

/** Uber-style "Explore what you can do" cards — adapted for Guardr. */
export const EXPLORE_SERVICES: ExploreService[] = [
  {
    id: 'post',
    title: 'Post coverage',
    body: 'Request licensed guards at your site. Set location, hours, and requirements in minutes.',
    icon: Shield,
    role: 'client',
  },
  {
    id: 'schedule',
    title: 'Schedule shifts',
    body: 'Book recurring or one-time coverage in advance so your sites are ready when shifts start.',
    icon: Calendar,
    role: 'client',
  },
  {
    id: 'browse',
    title: 'Browse jobs',
    body: 'Discover open posts on the map near you. Filter by rate, distance, and coverage type.',
    icon: Map,
    role: 'guard',
  },
  {
    id: 'live',
    title: 'Live operations',
    body: 'Track check-ins, shift audits, and guard activity from one real-time command view.',
    icon: Radio,
    role: 'client',
  },
  {
    id: 'teams',
    title: 'Multi-guard jobs',
    body: 'Post jobs that need more than one guard and approve guards into independent slots.',
    icon: Users,
  },
  {
    id: 'earn',
    title: 'Earnings',
    body: 'Complete shifts and receive payouts through the platform. Full history in your dashboard.',
    icon: Wallet,
    role: 'guard',
  },
];
