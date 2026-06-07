import { JobType } from '../types';

export type ClientServiceId =
  | 'standing-guard'
  | 'patrol'
  | 'event'
  | 'fire-watch'
  | 'property'
  | 'construction'
  | 'custom';

export interface ClientServiceOption {
  id: ClientServiceId;
  emoji: string;
  label: string;
  description: string;
  jobType: JobType;
  defaultTitle: string;
}

export const CLIENT_SERVICE_OPTIONS: ClientServiceOption[] = [
  { id: 'standing-guard', emoji: '🛡️', label: 'Standing Guard', description: 'Fixed post security', jobType: 'other', defaultTitle: 'Standing Guard Post' },
  { id: 'patrol', emoji: '🚶', label: 'Patrol Services', description: 'Mobile perimeter checks', jobType: 'patrol', defaultTitle: 'Site Patrol Coverage' },
  { id: 'event', emoji: '🎪', label: 'Event Security', description: 'Crowds, access, VIP lanes', jobType: 'event', defaultTitle: 'Event Security Detail' },
  { id: 'fire-watch', emoji: '🔥', label: 'Fire Watch', description: 'Hot work & compliance posts', jobType: 'other', defaultTitle: 'Fire Watch Assignment' },
  { id: 'property', emoji: '🏢', label: 'Property Security', description: 'Buildings & facilities', jobType: 'asset-protection', defaultTitle: 'Property Security Coverage' },
  { id: 'construction', emoji: '🚧', label: 'Construction Security', description: 'Job sites & equipment', jobType: 'patrol', defaultTitle: 'Construction Site Security' },
  { id: 'custom', emoji: '📍', label: 'Custom Request', description: 'Describe your own need', jobType: 'other', defaultTitle: 'Custom Security Request' },
];

export const GUARD_COUNT_PRESETS = [1, 2, 3, 4] as const;
export const PAY_RATE_PRESETS = [25, 30, 35] as const;

export function serviceToJobType(serviceId: ClientServiceId): JobType {
  return CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)?.jobType ?? 'other';
}

export function serviceDefaultTitle(serviceId: ClientServiceId): string {
  return CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)?.defaultTitle ?? 'Security Coverage Request';
}
