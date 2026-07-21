import type {
  Client,
  ClientLocation,
  JobLocation,
  JobLocationStatus,
  LocationRiskLevel,
  SecurityRequest,
  SessionUser,
} from '../types';
import { LOCATION_RISK_OPTIONS, canClientSetLocationRisk } from './clientLocations';

export { LOCATION_RISK_OPTIONS };

export const JOB_LOCATION_STATUS_LABELS: Record<JobLocationStatus, string> = {
  pending: 'Pending review',
  active: 'Active',
  rejected: 'Rejected',
  archived: 'Archived',
};

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

export function findMatchingJobLocation(
  locations: JobLocation[],
  address: string,
  state?: string | null,
  excludeId?: string
): JobLocation | undefined {
  const key = normalizePlaceKey(address, state);
  if (!key.startsWith('|') && key.length > 2) {
    const byKey = locations.find(
      (loc) => loc.id !== excludeId && loc.placeKey === key && loc.status !== 'rejected'
    );
    if (byKey) return byKey;
  }
  const addressLower = address.trim().toLowerCase();
  const cityLower = (state ?? '').trim().toLowerCase();
  return locations.find((loc) => {
    if (excludeId && loc.id === excludeId) return false;
    if (loc.status === 'rejected') return false;
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
    status: input.status ?? 'pending',
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

export function pendingJobLocations(locations: JobLocation[]): JobLocation[] {
  return locations.filter((l) => l.status === 'pending');
}

/**
 * Upsert a shared location from a job or client site.
 * Reuses an existing place when the address matches so multiple clients share one record.
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
  }
): { location: JobLocation; created: boolean; locations: JobLocation[] } {
  const address = input.address.trim();
  if (address.length < 4) {
    throw new Error('Enter a valid address to save a location.');
  }

  const existing = findMatchingJobLocation(locations, address, input.state);
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
    status: input.preferredStatus ?? 'pending',
  });
  return { location: draft, created: true, locations: [draft, ...locations] };
}

export function ensureSharedLocationFromClientLocation(
  locations: JobLocation[],
  clientLocation: ClientLocation,
  client?: Pick<Client, 'trusted'> | null
): { location: JobLocation; created: boolean; locations: JobLocation[] } {
  const trusted = canClientSetLocationRisk(client ?? {});
  return ensureSharedJobLocation(locations, {
    name: clientLocation.name,
    address: clientLocation.address,
    state: clientLocation.state,
    latitude: clientLocation.latitude,
    longitude: clientLocation.longitude,
    riskLevel: clientLocation.riskLevel,
    siteInstructions: clientLocation.siteInstructions,
    createdByClientId: clientLocation.clientId,
    preferredStatus:
      clientLocation.status === 'active' || trusted
        ? 'active'
        : clientLocation.status === 'rejected'
          ? 'rejected'
          : 'pending',
  });
}

export type JobLocationStatusFilter = 'all' | JobLocationStatus;

export function filterJobLocations(
  locations: JobLocation[],
  opts: { search?: string; status?: JobLocationStatusFilter }
): JobLocation[] {
  const q = opts.search?.trim().toLowerCase() ?? '';
  return locations
    .filter((loc) => {
      if (opts.status && opts.status !== 'all' && loc.status !== opts.status) return false;
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
      status === 'active' || status === 'rejected' || status === 'archived' ? status : 'pending',
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
    status: location.status,
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
