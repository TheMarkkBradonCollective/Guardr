import {
  JobOperationalCheckpoint,
  JobOperationalContact,
  JobOperationalCustomField,
  JobOperationalDetails,
  JobOperationalLocation,
  SecurityRequest,
} from '../types';
import {
  OPERATIONAL_LOCATION_LIST_KEYS,
  OPERATIONAL_SCALAR_KEYS,
} from './jobOperationalFieldRegistry';

export const EMPTY_JOB_OPERATIONAL_DETAILS: JobOperationalDetails = {};

function trimOptional(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeLocationList(raw: unknown): JobOperationalLocation[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const details = trimOptional((entry as JobOperationalLocation).details);
      if (!details) return null;
      const label = trimOptional((entry as JobOperationalLocation).label);
      return { details, ...(label ? { label } : {}) };
    })
    .filter((entry): entry is JobOperationalLocation => entry != null);
  return items.length > 0 ? items : undefined;
}

function normalizeContactList(raw: unknown): JobOperationalContact[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const source = entry as JobOperationalContact;
      const role = trimOptional(source.role);
      const name = trimOptional(source.name);
      const phone = trimOptional(source.phone);
      const email = trimOptional(source.email);
      const notes = trimOptional(source.notes);
      if (!role && !name && !phone && !email && !notes) return null;
      return {
        ...(role ? { role } : {}),
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(notes ? { notes } : {}),
      };
    })
    .filter((entry): entry is JobOperationalContact => entry != null);
  return items.length > 0 ? items : undefined;
}

function normalizeCheckpointList(raw: unknown): JobOperationalCheckpoint[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const source = entry as JobOperationalCheckpoint;
      const label = trimOptional(source.label);
      const location = trimOptional(source.location);
      const schedule = trimOptional(source.schedule);
      const instructions = trimOptional(source.instructions);
      if (!label && !location && !schedule && !instructions) return null;
      return {
        ...(label ? { label } : {}),
        ...(location ? { location } : {}),
        ...(schedule ? { schedule } : {}),
        ...(instructions ? { instructions } : {}),
      };
    })
    .filter((entry): entry is JobOperationalCheckpoint => entry != null);
  return items.length > 0 ? items : undefined;
}

function normalizeCustomFieldList(raw: unknown): JobOperationalCustomField[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const source = entry as JobOperationalCustomField;
      const label = trimOptional(source.label);
      const value = trimOptional(source.value);
      if (!label || !value) return null;
      const section = trimOptional(source.section);
      return { label, value, ...(section ? { section } : {}) };
    })
    .filter((entry): entry is JobOperationalCustomField => entry != null);
  return items.length > 0 ? items : undefined;
}

export function normalizeJobOperationalDetails(raw: unknown): JobOperationalDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const source = raw as Record<string, unknown>;
  const details: JobOperationalDetails = {};

  for (const key of OPERATIONAL_SCALAR_KEYS) {
    const value = trimOptional(source[key]);
    if (value) {
      (details as Record<string, unknown>)[key] = value;
    }
  }

  if (!details.smokingAreaRules) {
    const legacy = trimOptional(source.smokingAreaDetails);
    if (legacy) details.smokingAreaRules = legacy;
  }

  for (const key of OPERATIONAL_LOCATION_LIST_KEYS) {
    const items = normalizeLocationList(source[key]);
    if (items) {
      (details as Record<string, unknown>)[key] = items;
    }
  }

  const guardPosts = normalizeCheckpointList(source.guardPosts);
  if (guardPosts) details.guardPosts = guardPosts;

  const contacts = normalizeContactList(source.contacts);
  if (contacts) details.contacts = contacts;

  const customBriefingFields = normalizeCustomFieldList(source.customBriefingFields);
  if (customBriefingFields) details.customBriefingFields = customBriefingFields;

  return hasJobOperationalDetails(details) ? details : undefined;
}

export function hasJobOperationalDetails(details?: JobOperationalDetails | null): boolean {
  if (!details) return false;
  return Object.entries(details).some(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export function operationalDetailsFromJob(job: Partial<SecurityRequest>): JobOperationalDetails {
  return { ...EMPTY_JOB_OPERATIONAL_DETAILS, ...(job.operationalDetails ?? {}) };
}

export function operationalDetailsDbValue(
  details?: JobOperationalDetails | null
): JobOperationalDetails | null {
  return normalizeJobOperationalDetails(details) ?? null;
}

const ASSIGNED_BRIEFING_STATUSES: SecurityRequest['status'][] = [
  'accepted',
  'in-progress',
  'completed',
];

/** Guards see codes, keys, and full briefing only after staff approves them for the shift. */
export function guardCanViewOperationalBriefing(
  guardId: string | undefined,
  job: Pick<SecurityRequest, 'assignedGuardId' | 'status' | 'guardSlots'>
): boolean {
  if (!guardId || !ASSIGNED_BRIEFING_STATUSES.includes(job.status)) return false;
  if (job.assignedGuardId === guardId) return true;
  return (job.guardSlots ?? []).some((s) => s.guardId === guardId && s.status === 'approved');
}

export function operationalBriefingLockedMessage(job: Pick<SecurityRequest, 'status'>): string {
  if (job.status === 'open') {
    return 'Full site briefing (access codes, keys, emergency plans, and equipment maps) unlocks after you are approved for this shift.';
  }
  return 'Site briefing unlocks once you are assigned and approved for this shift.';
}
