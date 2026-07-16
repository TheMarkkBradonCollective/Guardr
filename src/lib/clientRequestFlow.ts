import { JobType } from '../types';

export type ClientServiceId =
  | 'standing-guard'
  | 'foot-patrol'
  | 'vehicle-patrol'
  /** @deprecated Legacy service id — maps to vehicle patrol. */
  | 'patrol'
  | 'fire-watch'
  | 'construction'
  | 'property'
  | 'executive-protection'
  | 'nightclub-bar'
  | 'event-wedding'
  | 'event-concert'
  | 'event-festival'
  | 'event-corporate'
  | 'event-private'
  | 'event-other'
  | 'custom';

export interface ClientServiceOption {
  id: ClientServiceId;
  emoji: string;
  label: string;
  description: string;
  jobType: JobType;
  defaultTitle: string;
}

export interface ClientServiceGroup {
  label: string;
  serviceIds: ClientServiceId[];
  options?: ClientServiceOption[];
}

export const CLIENT_SERVICE_OPTIONS: ClientServiceOption[] = [
  {
    id: 'nightclub-bar',
    emoji: '🍸',
    label: 'Nightclub & bar',
    description: 'Light hospitality security for nightlife venues',
    jobType: 'nightclub-bar',
    defaultTitle: 'Nightclub & Bar Security',
  },
  {
    id: 'event-wedding',
    emoji: '💍',
    label: 'Wedding',
    description: 'Ceremonies, receptions, and private celebrations',
    jobType: 'event-wedding',
    defaultTitle: 'Wedding Security Detail',
  },
  {
    id: 'event-concert',
    emoji: '🎵',
    label: 'Concert / live music',
    description: 'Concerts, clubs, and live performance venues',
    jobType: 'event-concert',
    defaultTitle: 'Concert Security Detail',
  },
  {
    id: 'event-festival',
    emoji: '🎡',
    label: 'Festival / fair',
    description: 'Outdoor festivals, fairs, and large gatherings',
    jobType: 'event-festival',
    defaultTitle: 'Festival Security Detail',
  },
  {
    id: 'event-corporate',
    emoji: '🏛️',
    label: 'Corporate event',
    description: 'Conferences, galas, and professional functions',
    jobType: 'event-corporate',
    defaultTitle: 'Corporate Event Security',
  },
  {
    id: 'event-private',
    emoji: '🎉',
    label: 'Private party',
    description: 'Residence events and invite-only parties',
    jobType: 'event-private',
    defaultTitle: 'Private Party Security',
  },
  {
    id: 'event-other',
    emoji: '🎪',
    label: 'Other event',
    description: 'General event security when none of the above fit',
    jobType: 'event',
    defaultTitle: 'Event Security Detail',
  },
  {
    id: 'standing-guard',
    emoji: '🛡️',
    label: 'Standing guard',
    description: 'Fixed post at doors, desks, or lobbies',
    jobType: 'standing-guard',
    defaultTitle: 'Standing Guard Post',
  },
  {
    id: 'foot-patrol',
    emoji: '🚶',
    label: 'Foot patrol',
    description: 'On-foot perimeter checks and scheduled rounds',
    jobType: 'foot-patrol',
    defaultTitle: 'Foot Patrol Coverage',
  },
  {
    id: 'vehicle-patrol',
    emoji: '🚗',
    label: 'Vehicle patrol',
    description: 'Mobile patrol routes using a guard vehicle',
    jobType: 'vehicle-patrol',
    defaultTitle: 'Vehicle Patrol Coverage',
  },
  {
    id: 'patrol',
    emoji: '🚗',
    label: 'Patrol services',
    description: 'Mobile perimeter checks and scheduled rounds',
    jobType: 'vehicle-patrol',
    defaultTitle: 'Site Patrol Coverage',
  },
  {
    id: 'construction',
    emoji: '🚧',
    label: 'Construction security',
    description: 'Job sites, equipment yards, and contractor access',
    jobType: 'construction',
    defaultTitle: 'Construction Site Security',
  },
  {
    id: 'property',
    emoji: '🏢',
    label: 'Property security',
    description: 'Buildings, retail, and facility coverage',
    jobType: 'asset-protection',
    defaultTitle: 'Property Security Coverage',
  },
  {
    id: 'fire-watch',
    emoji: '🔥',
    label: 'Fire watch',
    description: 'Hot work and compliance fire watch posts',
    jobType: 'fire-watch',
    defaultTitle: 'Fire Watch Assignment',
  },
  {
    id: 'executive-protection',
    emoji: '👔',
    label: 'Executive protection',
    description: 'VIP, corporate, and close protection',
    jobType: 'bodyguard',
    defaultTitle: 'Executive Protection Detail',
  },
  {
    id: 'custom',
    emoji: '📍',
    label: 'Custom request',
    description: 'Describe your own security need',
    jobType: 'other',
    defaultTitle: 'Custom Security Request',
  },
];

export const GUARD_COUNT_PRESETS = [1, 2, 3, 4] as const;
export const PAY_RATE_PRESETS = [25, 30, 35] as const;

export function serviceToJobType(serviceId: ClientServiceId): JobType {
  return CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)?.jobType ?? 'other';
}

export function serviceDefaultTitle(serviceId: ClientServiceId): string {
  return CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)?.defaultTitle ?? 'Security Coverage Request';
}

export function defaultDirectGuardJobTitle(serviceId: ClientServiceId, guardName: string): string {
  return `${serviceDefaultTitle(serviceId)} — ${guardName}`;
}

/** Trim user-entered title; fall back to service default when empty. */
export function resolveJobTitle(jobTitle: string, serviceId: ClientServiceId): string {
  const trimmed = jobTitle.trim();
  return trimmed || serviceDefaultTitle(serviceId);
}
