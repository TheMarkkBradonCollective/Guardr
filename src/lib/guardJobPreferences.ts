import type { JobType, SecurityGuard, SecurityRequest } from '../types';
import { isJobTypeOnboarded } from './guardJobTypeOnboarding';
import {
  guardCanEnableJobTypePreference,
  jobTypeRequiresVerifiedVehicle,
} from './guardJobTypeVehicleRequirements';

export interface JobTypePreferenceOption {
  type: JobType;
  label: string;
  description: string;
}

/** Job types shown in guard Preferences — excludes legacy `patrol`. */
export const PREFERENCE_JOB_TYPES: JobType[] = [
  'nightclub-bar',
  'event-wedding',
  'event-concert',
  'event-festival',
  'event-corporate',
  'event-private',
  'event',
  'foot-patrol',
  'vehicle-patrol',
  'construction',
  'fire-watch',
  'standing-guard',
  'bodyguard',
  'armed-escort',
  'asset-protection',
  'other',
];

/** All supported job types including legacy values stored in the database. */
export const ALL_JOB_TYPES: JobType[] = [...PREFERENCE_JOB_TYPES, 'patrol'];

export const ALL_JOB_TYPE_PREFERENCES = ALL_JOB_TYPES;

export interface JobTypePreferenceCategory {
  id: string;
  label: string;
  description: string;
  types: JobType[];
}

export const JOB_TYPE_PREFERENCE_CATEGORIES: JobTypePreferenceCategory[] = [
  {
    id: 'nightlife',
    label: 'Nightlife & hospitality',
    description: 'Venues, crowds, and front-door coverage.',
    types: ['nightclub-bar'],
  },
  {
    id: 'events',
    label: 'Events & venues',
    description: 'Weddings, concerts, festivals, and private functions.',
    types: [
      'event-wedding',
      'event-concert',
      'event-festival',
      'event-corporate',
      'event-private',
      'event',
    ],
  },
  {
    id: 'sites',
    label: 'Sites & patrol',
    description: 'Fixed posts, patrols, construction, and property coverage.',
    types: [
      'foot-patrol',
      'vehicle-patrol',
      'construction',
      'fire-watch',
      'standing-guard',
      'asset-protection',
    ],
  },
  {
    id: 'specialized',
    label: 'Specialized',
    description: 'Executive protection, armed escort, and custom requests.',
    types: ['bodyguard', 'armed-escort', 'other'],
  },
];

export const JOB_TYPE_PREFERENCE_OPTIONS: JobTypePreferenceOption[] = [
  {
    type: 'nightclub-bar',
    label: 'Nightclub & bar',
    description: 'Light hospitality security for nightlife venues, ID checks, and crowd flow.',
  },
  {
    type: 'event-wedding',
    label: 'Event venue — wedding',
    description: 'Ceremonies, receptions, and private celebration coverage.',
  },
  {
    type: 'event-concert',
    label: 'Event venue — concert',
    description: 'Live music, stage perimeter, and concert crowd management.',
  },
  {
    type: 'event-festival',
    label: 'Event venue — festival',
    description: 'Outdoor festivals, fairs, and multi-zone public events.',
  },
  {
    type: 'event-corporate',
    label: 'Event venue — corporate',
    description: 'Conferences, galas, and professional functions.',
  },
  {
    type: 'event-private',
    label: 'Event venue — private party',
    description: 'Invite-only parties, estates, and residence events.',
  },
  {
    type: 'event',
    label: 'Other events',
    description: 'General event posts when the venue type is not listed above.',
  },
  {
    type: 'foot-patrol',
    label: 'Foot patrol',
    description: 'On-foot perimeter checks, interior rounds, and scheduled site walks.',
  },
  {
    type: 'vehicle-patrol',
    label: 'Vehicle patrol',
    description: 'Mobile patrol routes using your approved guard vehicle.',
  },
  {
    type: 'construction',
    label: 'Construction site',
    description: 'Job-site access control and after-hours equipment protection.',
  },
  {
    type: 'fire-watch',
    label: 'Fire watch',
    description: 'Compliance posts for hot work and impaired fire systems.',
  },
  {
    type: 'standing-guard',
    label: 'Standing guard',
    description: 'Fixed-post coverage at doors, desks, and lobbies.',
  },
  {
    type: 'bodyguard',
    label: 'Executive protection',
    description: 'VIP and close-protection assignments.',
  },
  {
    type: 'armed-escort',
    label: 'Armed escort',
    description: 'Armed transport and high-risk movement security.',
  },
  {
    type: 'asset-protection',
    label: 'Property security',
    description: 'Buildings, retail, and facility asset protection.',
  },
  {
    type: 'other',
    label: 'Custom request',
    description: 'Non-standard jobs that need extra review before accepting.',
  },
];

const JOB_TYPE_LABEL_MAP = Object.fromEntries(
  JOB_TYPE_PREFERENCE_OPTIONS.map((option) => [option.type, option.label])
) as Record<JobType, string>;

const PREFERENCE_JOB_TYPE_SET = new Set(PREFERENCE_JOB_TYPES);

/** Preference keys that satisfy a job's type (handles legacy patrol aliases). */
export function jobTypePreferenceMatchKeys(jobType: JobType): JobType[] {
  switch (jobType) {
    case 'patrol':
    case 'vehicle-patrol':
      return ['vehicle-patrol', 'patrol'];
    case 'foot-patrol':
      return ['foot-patrol'];
    default:
      return [jobType];
  }
}

function migrateLegacyPreferenceType(value: string): JobType | null {
  const normalized = value === 'patrol' ? 'vehicle-patrol' : (value as JobType);
  return PREFERENCE_JOB_TYPE_SET.has(normalized) ? normalized : null;
}

export function isJobType(value: string): value is JobType {
  return ALL_JOB_TYPES.includes(value as JobType);
}

/** Empty or missing preferences mean all job types are off until the guard opts in. */
export function normalizeJobTypePreferences(values: string[] | undefined): JobType[] {
  if (!values?.length) return [];
  const seen = new Set<JobType>();
  const next: JobType[] = [];
  for (const value of values) {
    const migrated = migrateLegacyPreferenceType(value);
    if (!migrated || seen.has(migrated)) continue;
    seen.add(migrated);
    next.push(migrated);
  }
  return next;
}

export function guardWantsJobType(guard: Pick<SecurityGuard, 'jobTypePreferences'>, jobType: JobType): boolean {
  const prefs = new Set(normalizeJobTypePreferences(guard.jobTypePreferences));
  return jobTypePreferenceMatchKeys(jobType).some((key) => prefs.has(key));
}

export function guardMatchesJobPreferences(
  guard: Pick<SecurityGuard, 'jobTypePreferences'>,
  job: Pick<SecurityRequest, 'type'>
): boolean {
  return guardWantsJobType(guard, job.type);
}

export function guardCanAcceptJobType(
  guard: Pick<SecurityGuard, 'jobTypeOnboarding' | 'vehicleProfile'>,
  jobType: JobType
): boolean {
  if (!isJobTypeOnboarded(guard, jobType)) return false;
  if (jobTypeRequiresVerifiedVehicle(jobType) && !guardCanEnableJobTypePreference(guard, jobType)) {
    return false;
  }
  return true;
}

export function jobTypePreferenceLabel(type: JobType): string {
  if (type === 'patrol') return 'Patrol';
  return JOB_TYPE_LABEL_MAP[type] ?? type;
}

export function jobTypePreferenceDescription(type: JobType): string {
  return JOB_TYPE_PREFERENCE_OPTIONS.find((option) => option.type === type)?.description ?? '';
}

export function preferencesOnboardPercent(onboarded: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((onboarded / total) * 100));
}

export function preferencesActivePercent(active: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((active / total) * 100));
}

/** Monochrome anchors at 0% / 50% / 100% onboard (red → yellow → black). */
const PREF_HERO_RED = { top: '#b58a8a', mid: '#966969', bottom: '#7a5252' };
const PREF_HERO_YELLOW = { top: '#c9bc7a', mid: '#ada055', bottom: '#8f843f' };
const PREF_HERO_COMPLETE = { top: '#b3b3b3', mid: '#4d4d4d', bottom: '#000000' };

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function lerpHex(from: string, to: string, t: number): string {
  const start = parseHex(from);
  const end = parseHex(to);
  return toHex([
    lerpChannel(start[0], end[0], t),
    lerpChannel(start[1], end[1], t),
    lerpChannel(start[2], end[2], t),
  ]);
}

export interface PreferencesHeroColorStops {
  top: string;
  mid: string;
  bottom: string;
  tint: string;
}

/** Interpolate hero/page tint: red at 0%, yellow at 50%, black at 100%. */
export function preferencesHeroColorStops(onboardPercent: number): PreferencesHeroColorStops {
  const pct = Math.min(100, Math.max(0, onboardPercent));
  if (pct <= 50) {
    const t = pct / 50;
    return {
      top: lerpHex(PREF_HERO_RED.top, PREF_HERO_YELLOW.top, t),
      mid: lerpHex(PREF_HERO_RED.mid, PREF_HERO_YELLOW.mid, t),
      bottom: lerpHex(PREF_HERO_RED.bottom, PREF_HERO_YELLOW.bottom, t),
      tint: lerpHex(PREF_HERO_RED.mid, PREF_HERO_YELLOW.mid, t),
    };
  }
  const t = (pct - 50) / 50;
  return {
    top: lerpHex(PREF_HERO_YELLOW.top, PREF_HERO_COMPLETE.top, t),
    mid: lerpHex(PREF_HERO_YELLOW.mid, PREF_HERO_COMPLETE.mid, t),
    bottom: lerpHex(PREF_HERO_YELLOW.bottom, PREF_HERO_COMPLETE.bottom, t),
    tint: lerpHex(PREF_HERO_YELLOW.mid, PREF_HERO_COMPLETE.mid, t),
  };
}

export function preferencesHeroStyleVars(
  onboardPercent: number
): Record<'--pref-hero-c1' | '--pref-hero-c2' | '--pref-hero-c3' | '--pref-tint-color', string> {
  const stops = preferencesHeroColorStops(onboardPercent);
  return {
    '--pref-hero-c1': stops.top,
    '--pref-hero-c2': stops.mid,
    '--pref-hero-c3': stops.bottom,
    '--pref-tint-color': stops.tint,
  };
}
