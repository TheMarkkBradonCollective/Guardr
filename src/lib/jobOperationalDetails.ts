import { JobOperationalDetails, JobOperationalLocation, SecurityRequest } from '../types';

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

export function normalizeJobOperationalDetails(raw: unknown): JobOperationalDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const source = raw as Record<string, unknown>;
  const details: JobOperationalDetails = {
    patronHeadCount: trimOptional(source.patronHeadCount),
    postAssignment: trimOptional(source.postAssignment),
    doorsOpenTime: trimOptional(source.doorsOpenTime),
    doorsCloseTime: trimOptional(source.doorsCloseTime),
    curfewTime: trimOptional(source.curfewTime),
    smokingAreaDetails: trimOptional(source.smokingAreaDetails),
    barDetails: trimOptional(source.barDetails),
    barLastCallTime: trimOptional(source.barLastCallTime),
    barCloseTime: trimOptional(source.barCloseTime),
    accessCodes: trimOptional(source.accessCodes),
    keyLocation: trimOptional(source.keyLocation),
    accessNotes: trimOptional(source.accessNotes),
    emergencyProtocol: trimOptional(source.emergencyProtocol),
    radioCodes: trimOptional(source.radioCodes),
    radioChannel: trimOptional(source.radioChannel),
    cooldownAreaDetails: trimOptional(source.cooldownAreaDetails),
    fireExtinguisherLocations: normalizeLocationList(source.fireExtinguisherLocations),
    medkitLocations: normalizeLocationList(source.medkitLocations),
    narcanLocations: normalizeLocationList(source.narcanLocations),
    vipAreaDetails: trimOptional(source.vipAreaDetails),
    credentialingDetails: trimOptional(source.credentialingDetails),
    medicalEmergencyContacts: trimOptional(source.medicalEmergencyContacts),
    nearestHospital: trimOptional(source.nearestHospital),
    evacuationRallyPoint: trimOptional(source.evacuationRallyPoint),
    lostChildProcedure: trimOptional(source.lostChildProcedure),
    intoxicationPolicy: trimOptional(source.intoxicationPolicy),
    filmingPhotoPolicy: trimOptional(source.filmingPhotoPolicy),
    vendorLoadInDetails: trimOptional(source.vendorLoadInDetails),
    guardStationLocation: trimOptional(source.guardStationLocation),
    restroomBreakPolicy: trimOptional(source.restroomBreakPolicy),
    clientSpecialRequests: trimOptional(source.clientSpecialRequests),
    additionalNotes: trimOptional(source.additionalNotes),
  };

  return hasJobOperationalDetails(details) ? details : undefined;
}

export function hasJobOperationalDetails(details?: JobOperationalDetails | null): boolean {
  if (!details) return false;
  return Object.entries(details).some(([key, value]) => {
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
  job: Pick<SecurityRequest, 'assignedGuardId' | 'status'>
): boolean {
  if (!guardId || !job.assignedGuardId || job.assignedGuardId !== guardId) return false;
  return ASSIGNED_BRIEFING_STATUSES.includes(job.status);
}

export function operationalBriefingLockedMessage(job: Pick<SecurityRequest, 'status'>): string {
  if (job.status === 'open') {
    return 'Full site briefing (access codes, keys, emergency plans, and equipment maps) unlocks after you are approved for this shift.';
  }
  return 'Site briefing unlocks once you are assigned and approved for this shift.';
}
