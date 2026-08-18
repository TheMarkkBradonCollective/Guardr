import type { ClientType, JobType } from '../types';
import { ALL_JOB_TYPES, isJobType } from './guardJobPreferences';
import { JOB_TYPE_LABELS } from './guardJobs';
import { normalizeClientType } from './clientType';

export type ClientCredentialApplicableTo = ClientType;

export interface ClientCredentialTypeDef {
  id: string;
  name: string;
  applicableTo: ClientCredentialApplicableTo[];
  /** Job types this credential is required for. Empty = library-only until an admin sets Required For. */
  requiredFor: JobType[];
  /** Always required for every client of the applicable type (government ID). */
  alwaysRequired?: boolean;
  /** Admin-facing explanation of when this credential is needed. */
  requiredForDescription?: string;
  description?: string;
}

export interface ClientCredentialRuleOverride {
  typeId: string;
  applicableTo?: ClientCredentialApplicableTo[];
  requiredFor?: JobType[];
  alwaysRequired?: boolean;
  requiredForDescription?: string;
  enabled?: boolean;
}

const EVENT_JOB_TYPES: JobType[] = [
  'event-wedding',
  'event-concert',
  'event-festival',
  'event-corporate',
  'event-private',
  'event',
];

const ALCOHOL_REQUIRED_FOR: JobType[] = ['nightclub-bar'];

export const CLIENT_CREDENTIAL_CATALOG: ClientCredentialTypeDef[] = [
  {
    id: 'personal-gov-id',
    name: 'Government-issued ID',
    applicableTo: ['personal'],
    requiredFor: [],
    alwaysRequired: true,
    requiredForDescription: 'Required for every personal client account.',
    description: 'A government-issued photo ID for the individual hiring Guardr.',
  },
  {
    id: 'personal-drivers-license',
    name: "Driver's License",
    applicableTo: ['personal'],
    requiredFor: [],
    requiredForDescription: 'Required when a driver’s license applies to the requested service.',
  },
  {
    id: 'personal-ccw',
    name: 'Concealed Carry Weapon (CCW) Permit',
    applicableTo: ['personal'],
    requiredFor: [],
  },
  {
    id: 'personal-firearm-license',
    name: 'Firearm License/Permit',
    applicableTo: ['personal'],
    requiredFor: [],
  },
  {
    id: 'personal-security-permit',
    name: 'Security/Protective Services Permit',
    applicableTo: ['personal'],
    requiredFor: [],
    requiredForDescription: 'Required where a personal protective-services permit applies.',
  },
  {
    id: 'personal-event-permit',
    name: 'Event Permit',
    applicableTo: ['personal'],
    requiredFor: [...EVENT_JOB_TYPES],
    requiredForDescription: 'Required when requesting event coverage.',
  },
  {
    id: 'personal-special-event-permit',
    name: 'Special Event Permit',
    applicableTo: ['personal'],
    requiredFor: [...EVENT_JOB_TYPES],
    requiredForDescription: 'Required when the event needs a special-event permit.',
  },
  {
    id: 'personal-property-use-permit',
    name: 'Private Property/Property Use Permit',
    applicableTo: ['personal'],
    requiredFor: [],
  },
  {
    id: 'personal-alcohol-permit',
    name: 'Alcohol-Related Permit',
    applicableTo: ['personal'],
    requiredFor: [...ALCOHOL_REQUIRED_FOR],
    requiredForDescription: 'Required when requesting security for an alcohol-serving establishment.',
  },
  {
    id: 'personal-cannabis-permit',
    name: 'Cannabis-Related License/Permit',
    applicableTo: ['personal'],
    requiredFor: [],
    requiredForDescription: 'Required when requesting security for a cannabis-related service.',
  },
  {
    id: 'personal-other-gov-license',
    name: 'Other Government-Issued License/Permit',
    applicableTo: ['personal'],
    requiredFor: [],
  },
  {
    id: 'business-rep-gov-id',
    name: 'Government-issued ID (authorized representative)',
    applicableTo: ['business'],
    requiredFor: [],
    alwaysRequired: true,
    requiredForDescription: 'Required for the authorized representative on every business client account.',
    description: 'A government-issued photo ID for the person authorized to hire Guardr for the business.',
  },
  {
    id: 'business-license',
    name: 'Business License',
    applicableTo: ['business'],
    requiredFor: [],
  },
  {
    id: 'business-registration',
    name: 'Business Registration / Entity Documentation',
    applicableTo: ['business'],
    requiredFor: [],
  },
  {
    id: 'business-sellers-permit',
    name: "Seller's Permit",
    applicableTo: ['business'],
    requiredFor: [],
  },
  {
    id: 'business-alcohol-license',
    name: 'Alcohol License/Permit',
    applicableTo: ['business'],
    requiredFor: [...ALCOHOL_REQUIRED_FOR],
    requiredForDescription: 'Required when requesting security for an alcohol-serving establishment.',
  },
  {
    id: 'business-cannabis-license',
    name: 'Cannabis License/Permit',
    applicableTo: ['business'],
    requiredFor: [],
    requiredForDescription: 'Required when requesting security for a cannabis-related business.',
  },
  {
    id: 'business-event-permit',
    name: 'Event Permit',
    applicableTo: ['business'],
    requiredFor: [...EVENT_JOB_TYPES],
    requiredForDescription: 'Required when requesting event coverage.',
  },
  {
    id: 'business-special-event-permit',
    name: 'Special Event Permit',
    applicableTo: ['business'],
    requiredFor: [...EVENT_JOB_TYPES],
    requiredForDescription: 'Required when the event needs a special-event permit.',
  },
  {
    id: 'business-entertainment-permit',
    name: 'Entertainment Permit',
    applicableTo: ['business'],
    requiredFor: ['event-concert', 'event-festival', 'event'],
    requiredForDescription: 'Required when requesting security for entertainment venues or shows.',
  },
  {
    id: 'business-firearms-license',
    name: 'Firearms License/Permit',
    applicableTo: ['business'],
    requiredFor: [],
  },
  {
    id: 'business-security-license',
    name: 'Security/Protective Services License/Permit',
    applicableTo: ['business'],
    requiredFor: [],
    requiredForDescription: 'Required where a business protective-services license applies.',
  },
  {
    id: 'business-occupancy-permit',
    name: 'Property/Occupancy Permit',
    applicableTo: ['business'],
    requiredFor: [],
  },
  {
    id: 'business-health-permit',
    name: 'Health/Operating Permit',
    applicableTo: ['business'],
    requiredFor: [],
    requiredForDescription: 'Required where a health or operating permit applies.',
  },
  {
    id: 'business-local-license',
    name: 'State/County/City-Specific License or Permit',
    applicableTo: ['business'],
    requiredFor: [],
  },
  {
    id: 'business-industry-license',
    name: 'Industry-Specific License/Permit',
    applicableTo: ['business'],
    requiredFor: [],
  },
  {
    id: 'business-other-gov-license',
    name: 'Other Government-Issued License/Permit',
    applicableTo: ['business'],
    requiredFor: [],
  },
];

const CATALOG_BY_ID = new Map(CLIENT_CREDENTIAL_CATALOG.map((type) => [type.id, type]));

export function clientCredentialTypeById(typeId: string): ClientCredentialTypeDef | undefined {
  return CATALOG_BY_ID.get(typeId);
}

function parseApplicableTo(value: unknown, fallback: ClientCredentialApplicableTo[]): ClientCredentialApplicableTo[] {
  if (!Array.isArray(value)) return fallback;
  const next = value.filter((item): item is ClientCredentialApplicableTo => item === 'personal' || item === 'business');
  return next.length > 0 ? [...new Set(next)] : fallback;
}

function parseRequiredFor(value: unknown, fallback: JobType[]): JobType[] {
  if (!Array.isArray(value)) return fallback;
  const next = value.filter((item): item is JobType => typeof item === 'string' && isJobType(item));
  return [...new Set(next)];
}

export function parseClientCredentialRuleOverrides(value: unknown): ClientCredentialRuleOverride[] {
  if (!Array.isArray(value)) return [];
  const overrides: ClientCredentialRuleOverride[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    if (typeof row.typeId !== 'string' || !CATALOG_BY_ID.has(row.typeId)) continue;
    const override: ClientCredentialRuleOverride = { typeId: row.typeId };
    if (row.applicableTo !== undefined) override.applicableTo = parseApplicableTo(row.applicableTo, []);
    if (row.requiredFor !== undefined) override.requiredFor = parseRequiredFor(row.requiredFor, []);
    if (typeof row.alwaysRequired === 'boolean') override.alwaysRequired = row.alwaysRequired;
    if (typeof row.requiredForDescription === 'string') {
      override.requiredForDescription = row.requiredForDescription.trim();
    }
    if (typeof row.enabled === 'boolean') override.enabled = row.enabled;
    overrides.push(override);
  }
  return overrides;
}

export function resolveClientCredentialCatalog(
  overrides: ClientCredentialRuleOverride[] | undefined = []
): ClientCredentialTypeDef[] {
  const byType = new Map(overrides.map((override) => [override.typeId, override]));
  return CLIENT_CREDENTIAL_CATALOG.filter((type) => byType.get(type.id)?.enabled !== false).map((type) => {
    const override = byType.get(type.id);
    if (!override) return { ...type, requiredFor: [...type.requiredFor], applicableTo: [...type.applicableTo] };
    return {
      ...type,
      applicableTo: override.applicableTo?.length ? [...override.applicableTo] : [...type.applicableTo],
      requiredFor: override.requiredFor ? [...override.requiredFor] : [...type.requiredFor],
      alwaysRequired: override.alwaysRequired ?? type.alwaysRequired,
      requiredForDescription:
        override.requiredForDescription?.trim() || type.requiredForDescription,
    };
  });
}

export function catalogTypesForClientType(
  clientType: ClientType | undefined,
  overrides?: ClientCredentialRuleOverride[]
): ClientCredentialTypeDef[] {
  const kind = normalizeClientType(clientType);
  return resolveClientCredentialCatalog(overrides).filter((type) => type.applicableTo.includes(kind));
}

export function clientCredentialRequiredForJob(
  type: ClientCredentialTypeDef,
  jobType: JobType
): boolean {
  if (type.alwaysRequired) return true;
  if (type.requiredFor.includes(jobType)) return true;
  if (jobType === 'patrol' && type.requiredFor.includes('vehicle-patrol')) return true;
  return false;
}

export function formatClientCredentialRequiredFor(type: ClientCredentialTypeDef): string {
  if (type.alwaysRequired) return 'Always required';
  if (type.requiredForDescription?.trim()) return type.requiredForDescription.trim();
  if (type.requiredFor.length === 0) return 'Not required — library only';
  return type.requiredFor.map((jobType) => JOB_TYPE_LABELS[jobType] ?? jobType).join(', ');
}

export function formatClientCredentialApplicableTo(type: ClientCredentialTypeDef): string {
  return type.applicableTo.map((kind) => (kind === 'personal' ? 'Personal clients' : 'Business clients')).join(', ');
}

export function selectableJobTypesForCredentialRules(): { id: JobType; label: string }[] {
  return ALL_JOB_TYPES.filter((type) => type !== 'patrol').map((type) => ({
    id: type,
    label: JOB_TYPE_LABELS[type] ?? type,
  }));
}

export function upsertClientCredentialRuleOverride(
  existing: ClientCredentialRuleOverride[],
  patch: ClientCredentialRuleOverride
): ClientCredentialRuleOverride[] {
  if (!clientCredentialTypeById(patch.typeId)) return existing;
  const current = existing.find((rule) => rule.typeId === patch.typeId);
  const resolved: ClientCredentialRuleOverride = {
    typeId: patch.typeId,
    applicableTo: patch.applicableTo ?? current?.applicableTo,
    requiredFor: patch.requiredFor ?? current?.requiredFor,
    alwaysRequired: patch.alwaysRequired ?? current?.alwaysRequired,
    requiredForDescription: patch.requiredForDescription ?? current?.requiredForDescription,
    enabled: patch.enabled ?? current?.enabled,
  };
  return [...existing.filter((rule) => rule.typeId !== patch.typeId), resolved];
}
