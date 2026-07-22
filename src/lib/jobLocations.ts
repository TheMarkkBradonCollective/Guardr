import type {
  Client,
  ClientLocation,
  JobLocation,
  JobLocationStatus,
  LocationRiskLevel,
  SecurityRequest,
  SessionUser,
} from '../types';
import { LOCATION_RISK_OPTIONS } from './clientLocations';

export { LOCATION_RISK_OPTIONS };

export const JOB_LOCATION_STATUS_LABELS: Record<JobLocationStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  rejected: 'Rejected',
  archived: 'Archived',
};

const PAST_JOB_STATUSES = new Set(['completed', 'closed', 'cancelled']);

/** Normalize address+city into a stable reuse key across clients. */
export function normalizePlaceKey(address: string, state?: string | null): string {
  const street = address
    .trim()
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct|way|place|pl)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const city = (state ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${street}|${city}`;
}

export function isLocationListed(location: Pick<JobLocation, 'listed'> | Pick<ClientLocation, 'listed'>): boolean {
  return location.listed !== false;
}

/** Rejected addresses stay blocked — never reuse for other clients. */
export function findRejectedJobLocation(
  locations: JobLocation[],
  address: string,
  state?: string | null,
  excludeId?: string
): JobLocation | undefined {
  const key = normalizePlaceKey(address, state);
  const addressLower = address.trim().toLowerCase();
  const cityLower = (state ?? '').trim().toLowerCase();
  return locations.find((loc) => {
    if (excludeId && loc.id === excludeId) return false;
    if (loc.status !== 'rejected') return false;
    if (loc.placeKey === key && key.length > 2 && !key.startsWith('|')) return true;
    const sameAddress = loc.address.trim().toLowerCase() === addressLower;
    const sameCity =
      !cityLower || !loc.state || loc.state.trim().toLowerCase() === cityLower;
    return sameAddress && sameCity;
  });
}

/**
 * Find a reusable shared place.
 * Skips rejected (blocked), archived, and private sites owned by someone else.
 */
export function findMatchingJobLocation(
  locations: JobLocation[],
  address: string,
  state?: string | null,
  excludeId?: string,
  opts?: { forClientId?: string }
): JobLocation | undefined {
  const key = normalizePlaceKey(address, state);
  const canUse = (loc: JobLocation) => {
    if (excludeId && loc.id === excludeId) return false;
    if (loc.status === 'rejected' || loc.status === 'archived' || loc.status === 'pending') {
      return false;
    }
    if (loc.status !== 'active') return false;
    if (!isLocationListed(loc)) {
      return opts?.forClientId != null && loc.createdByClientId === opts.forClientId;
    }
    return true;
  };

  if (!key.startsWith('|') && key.length > 2) {
    const byKey = locations.find((loc) => loc.placeKey === key && canUse(loc));
    if (byKey) return byKey;
  }
  const addressLower = address.trim().toLowerCase();
  const cityLower = (state ?? '').trim().toLowerCase();
  return locations.find((loc) => {
    if (!canUse(loc)) return false;
    const sameAddress = loc.address.trim().toLowerCase() === addressLower;
    const sameCity =
      !cityLower ||
      !loc.state ||
      loc.state.trim().toLowerCase() === cityLower;
    return sameAddress && sameCity;
  });
}

export function newJobLocationDraft(input: {
  name: string;
  address: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  riskLevel?: LocationRiskLevel;
  siteInstructions?: string;
  parkingInstructions?: string;
  accessInstructions?: string;
  createdByClientId?: string;
  status?: JobLocationStatus;
  listed?: boolean;
  notes?: string;
}): JobLocation {
  const now = new Date().toISOString();
  const address = input.address.trim();
  const state = input.state?.trim() || undefined;
  return {
    id: `jloc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim() || address,
    address,
    state,
    latitude: input.latitude,
    longitude: input.longitude,
    riskLevel: input.riskLevel ?? 'medium',
    status: input.status ?? 'active',
    listed: input.listed !== false,
    siteInstructions: input.siteInstructions?.trim() || undefined,
    parkingInstructions: input.parkingInstructions?.trim() || undefined,
    accessInstructions: input.accessInstructions?.trim() || undefined,
    placeKey: normalizePlaceKey(address, state),
    createdByClientId: input.createdByClientId,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function approveJobLocation(
  location: JobLocation,
  reviewer: Pick<SessionUser, 'id'>
): JobLocation {
  const now = new Date().toISOString();
  return {
    ...location,
    status: 'active',
    reviewedAt: now,
    reviewedBy: reviewer.id,
    updatedAt: now,
  };
}

export function rejectJobLocation(
  location: JobLocation,
  reviewer: Pick<SessionUser, 'id'>
): JobLocation {
  const now = new Date().toISOString();
  return {
    ...location,
    status: 'rejected',
    reviewedAt: now,
    reviewedBy: reviewer.id,
    updatedAt: now,
  };
}

export function archiveJobLocation(location: JobLocation): JobLocation {
  return {
    ...location,
    status: 'archived',
    updatedAt: new Date().toISOString(),
  };
}

export function activeJobLocations(locations: JobLocation[]): JobLocation[] {
  return locations.filter((l) => l.status === 'active');
}

/** @deprecated Pending location queue removed — kept for legacy data reads. */
export function pendingJobLocations(locations: JobLocation[]): JobLocation[] {
  return locations.filter((l) => l.status === 'pending');
}

export function locationHasUpcomingJobs(jobs: SecurityRequest[], locationId: string): boolean {
  return jobs.some(
    (job) => job.jobLocationId === locationId && !PAST_JOB_STATUSES.has(job.status)
  );
}

/**
 * Staff list bucket — Active = in catalog / in use;
 * Archived = historically used with no upcoming jobs (or manually archived).
 */
export type JobLocationBrowseBucket = 'active' | 'rejected' | 'archived';

export function jobLocationBrowseBucket(
  location: JobLocation,
  jobs: SecurityRequest[]
): JobLocationBrowseBucket | null {
  if (location.status === 'rejected') return 'rejected';
  if (location.status === 'archived') return 'archived';
  if (location.status === 'pending') return null;
  if (location.status !== 'active') return null;

  const used = countJobsUsingLocation(jobs, location.id) > 0;
  const upcoming = locationHasUpcomingJobs(jobs, location.id);
  if (used && !upcoming) return 'archived';
  return 'active';
}

/** Shared sites clients can scroll / pick (active + listed, or own private). */
export function browsableSharedLocations(
  locations: JobLocation[],
  clientId?: string
): JobLocation[] {
  return locations
    .filter((loc) => {
      if (loc.status !== 'active') return false;
      if (!isLocationListed(loc)) {
        return clientId != null && loc.createdByClientId === clientId;
      }
      return true;
    })
    .sort((a, b) => {
      const aTime = a.updatedAt ?? a.createdAt ?? '';
      const bTime = b.updatedAt ?? b.createdAt ?? '';
      return bTime.localeCompare(aTime);
    });
}

/**
 * Upsert a shared location from a job or client site.
 * Reuses an existing place when the address matches so multiple clients share one record.
 * Rejected addresses are blocked permanently for other clients.
 */
export function ensureSharedJobLocation(
  locations: JobLocation[],
  input: {
    name: string;
    address: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    riskLevel?: LocationRiskLevel;
    siteInstructions?: string;
    parkingInstructions?: string;
    accessInstructions?: string;
    createdByClientId?: string;
    preferredStatus?: JobLocationStatus;
    listed?: boolean;
  }
): { location: JobLocation; created: boolean; locations: JobLocation[] } {
  const address = input.address.trim();
  if (address.length < 4) {
    throw new Error('Enter a valid address to save a location.');
  }

  const blocked = findRejectedJobLocation(locations, address, input.state);
  if (blocked) {
    throw new Error(
      'This address was rejected by staff and cannot be used for new jobs or shared with other clients.'
    );
  }

  const existing = findMatchingJobLocation(locations, address, input.state, undefined, {
    forClientId: input.createdByClientId,
  });
  if (existing) {
    const now = new Date().toISOString();
    const merged: JobLocation = {
      ...existing,
      name: input.name.trim() || existing.name,
      address,
      state: input.state?.trim() || existing.state,
      latitude: input.latitude ?? existing.latitude,
      longitude: input.longitude ?? existing.longitude,
      riskLevel: input.riskLevel ?? existing.riskLevel,
      siteInstructions: input.siteInstructions?.trim() || existing.siteInstructions,
      parkingInstructions: input.parkingInstructions?.trim() || existing.parkingInstructions,
      accessInstructions: input.accessInstructions?.trim() || existing.accessInstructions,
      placeKey: normalizePlaceKey(address, input.state?.trim() || existing.state),
      createdByClientId: existing.createdByClientId ?? input.createdByClientId,
      listed:
        input.listed === false &&
        (!existing.createdByClientId ||
          existing.createdByClientId === input.createdByClientId)
          ? false
          : existing.listed !== false,
      status:
        input.preferredStatus === 'active' && existing.status === 'pending'
          ? 'active'
          : existing.status,
      updatedAt: now,
    };
    return {
      location: merged,
      created: false,
      locations: locations.map((loc) => (loc.id === merged.id ? merged : loc)),
    };
  }

  const draft = newJobLocationDraft({
    ...input,
    status: input.preferredStatus ?? 'active',
    listed: input.listed !== false,
  });
  return { location: draft, created: true, locations: [draft, ...locations] };
}

export function ensureSharedLocationFromClientLocation(
  locations: JobLocation[],
  clientLocation: ClientLocation,
  _client?: Pick<Client, 'trusted'> | null
): { location: JobLocation; created: boolean; locations: JobLocation[] } {
  return ensureSharedJobLocation(locations, {
    name: clientLocation.name,
    address: clientLocation.address,
    state: clientLocation.state,
    latitude: clientLocation.latitude,
    longitude: clientLocation.longitude,
    riskLevel: clientLocation.riskLevel,
    siteInstructions: clientLocation.siteInstructions,
    createdByClientId: clientLocation.clientId,
    preferredStatus: clientLocation.status === 'rejected' ? 'rejected' : 'active',
    listed: clientLocation.listed !== false,
  });
}

/** Staff filter tabs — Pending queue removed. */
export type JobLocationStatusFilter = 'all' | 'active' | 'rejected' | 'archived';

export function filterJobLocations(
  locations: JobLocation[],
  opts: { search?: string; status?: JobLocationStatusFilter; jobs?: SecurityRequest[] }
): JobLocation[] {
  const q = opts.search?.trim().toLowerCase() ?? '';
  const jobs = opts.jobs ?? [];
  return locations
    .filter((loc) => {
      if (opts.status && opts.status !== 'all') {
        const bucket = jobLocationBrowseBucket(loc, jobs);
        if (bucket !== opts.status) return false;
      }
      if (!q) return true;
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        (loc.state?.toLowerCase().includes(q) ?? false) ||
        (loc.notes?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      const aTime = a.updatedAt ?? a.createdAt ?? '';
      const bTime = b.updatedAt ?? b.createdAt ?? '';
      return bTime.localeCompare(aTime);
    });
}

export function countJobsUsingLocation(jobs: SecurityRequest[], locationId: string): number {
  return jobs.filter((job) => job.jobLocationId === locationId).length;
}

export function countClientsUsingLocation(
  clientLocations: ClientLocation[],
  locationId: string
): number {
  const clientIds = new Set(
    clientLocations
      .filter((loc) => loc.sharedLocationId === locationId)
      .map((loc) => loc.clientId)
  );
  return clientIds.size;
}

export function jobLocationRowToRecord(row: Record<string, unknown>): JobLocation {
  const risk = row.risk_level;
  const status = row.status;
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    address: String(row.address ?? ''),
    state: row.state != null ? String(row.state) : undefined,
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    riskLevel: risk === 'high' || risk === 'low' ? risk : 'medium',
    status:
      status === 'active' || status === 'rejected' || status === 'archived' || status === 'pending'
        ? status
        : 'active',
    listed: row.listed === false || row.listed === 'false' ? false : true,
    siteInstructions: row.site_instructions != null ? String(row.site_instructions) : undefined,
    parkingInstructions:
      row.parking_instructions != null ? String(row.parking_instructions) : undefined,
    accessInstructions:
      row.access_instructions != null ? String(row.access_instructions) : undefined,
    placeKey: String(row.place_key ?? normalizePlaceKey(String(row.address ?? ''), row.state as string)),
    createdByClientId:
      row.created_by_client_id != null ? String(row.created_by_client_id) : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    createdAt: row.created_at != null ? String(row.created_at) : undefined,
    updatedAt: row.updated_at != null ? String(row.updated_at) : undefined,
    reviewedAt: row.reviewed_at != null ? String(row.reviewed_at) : undefined,
    reviewedBy: row.reviewed_by != null ? String(row.reviewed_by) : undefined,
  };
}

export function jobLocationToDbRow(location: JobLocation) {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    state: location.state ?? null,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    risk_level: location.riskLevel,
    status: location.status === 'pending' ? 'active' : location.status,
    listed: location.listed !== false,
    site_instructions: location.siteInstructions ?? null,
    parking_instructions: location.parkingInstructions ?? null,
    access_instructions: location.accessInstructions ?? null,
    place_key: location.placeKey || normalizePlaceKey(location.address, location.state),
    created_by_client_id: location.createdByClientId ?? null,
    notes: location.notes ?? null,
    created_at: location.createdAt ?? new Date().toISOString(),
    updated_at: location.updatedAt ?? new Date().toISOString(),
    reviewed_at: location.reviewedAt ?? null,
    reviewed_by: location.reviewedBy ?? null,
  };
}
