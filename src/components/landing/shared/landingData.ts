import {
  BadgeCheck,
  Clock,
  CreditCard,
  FileText,
  Lock,
  MapPin,
  MessageSquare,
  Navigation,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const CLIENT_FEATURES = [
  { icon: MapPin, title: 'Post by site', body: 'Set location, hours, and coverage type in minutes. Add special requirements and let guards apply.' },
  { icon: BadgeCheck, title: 'Verified credentials', body: 'Independent guards apply with state licenses, certifications, and profile verified by the platform.' },
  { icon: Clock, title: 'Live visibility', body: 'Track check-ins, shift audits, and guard activity from one real-time dashboard.' },
] as const;

export const GUARD_FEATURES = [
  { icon: MapPin, title: 'Jobs near you', body: 'Browse open posts on the map filtered by distance, rate, and type. You choose what fits.' },
  { icon: Lock, title: 'Own your credentials', body: 'Your license, certs, and professional profile — stored on the platform and portable.' },
  { icon: CreditCard, title: 'Direct pay', body: 'Complete shifts and receive earnings through the platform. Track every payment in your dashboard.' },
] as const;

export const COVERAGE_TYPES = [
  'Event security',
  'Construction sites',
  'Retail protection',
  'Nightlife & venues',
  'Corporate campuses',
  'Hospital & healthcare',
  'Short & recurring posts',
  'Armed transport',
] as const;

export const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Navigation,
    title: 'Post or discover',
    body: 'Clients post coverage needs with full site details. Guards browse open jobs on the map in real time.',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: 'Match & confirm',
    body: 'Review credentials, message directly through the platform, and lock in the job details.',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Track & complete',
    body: 'Live check-ins, shift audits, incident reports, and payment — all handled through Guardr.',
  },
] as const;

export const TRUST_METRICS = [
  { value: 'Map-first', label: 'Job discovery' },
  { value: 'Licensed', label: 'Independent pros' },
  { value: 'Live', label: 'Shift tracking' },
  { value: 'Direct', label: 'Platform payments' },
] as const;

export const PLATFORM_HIGHLIGHTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Smartphone,
    title: 'Mobile-first design',
    body: 'Built for guards on the move. Full functionality on any device, installable as a PWA.',
  },
  {
    icon: FileText,
    title: 'Digital credentials',
    body: 'Upload licenses and certs once. They travel with your profile across every job.',
  },
  {
    icon: TrendingUp,
    title: 'Earnings tracking',
    body: 'Full history of shifts, rates, and payouts. No spreadsheets required.',
  },
  {
    icon: Users,
    title: 'Team coordination',
    body: 'Form standing crews, coordinate multi-guard posts, and manage team communications.',
  },
  {
    icon: Zap,
    title: 'Instant notifications',
    body: 'Real-time alerts for new jobs, shift updates, check-ins, and platform messages.',
  },
  {
    icon: Star,
    title: 'Reputation system',
    body: 'Build a verified track record. Clients rate completed shifts; guards build their profile.',
  },
];
