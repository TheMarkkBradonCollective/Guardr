import type { Client, ClientLocation, ClientLocationStatus, LocationRiskLevel, SessionUser } from '../types';

export const LOCATION_RISK_OPTIONS: { id: LocationRiskLevel; label: string; description: string }[] = [
  { id: 'low', label: 'Low', description: 'Routine coverage — standard requirements' },
  { id: 'medium', label: 'Medium', description: 'Typical commercial or event site' },
  { id: 'high', label: 'High', description: 'Elevated risk — stricter creds and staff awareness' },
];

export function clientLocationId(clientId: string, slug: string): string {
  return `loc-${clientId}-${slug}`;
}

export function canClientSetLocationRisk(client: Pick<Client, 'trusted'>): boolean {
  return client.trusted === true;
}

export function newClientLocationDraft(
  clientId: string,
  input: {
    name: string;
    address: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    riskLevel?: LocationRiskLevel;
    siteInstructions?: string;
  },
  client?: Pick<Client, 'trusted'> | null
): ClientLocation {
  const now = new Date().toISOString();
  const trusted = canClientSetLocationRisk(client ?? {});
  return {
    id: `loc-${clientId}-${Date.now()}`,
    clientId,
    name: input.name.trim(),
    address: input.address.trim(),
    state: input.state,
    latitude: input.latitude,
    longitude: input.longitude,
    riskLevel: input.riskLevel ?? 'medium',
    status: trusted ? 'active' : 'pending',
    siteInstructions: input.siteInstructions?.trim() || undefined,
    createdAt: now,
    reviewedAt: trusted ? now : undefined,
  };
}

export function approveClientLocation(
  location: ClientLocation,
  reviewer: Pick<SessionUser, 'id'>
): ClientLocation {
  return {
    ...location,
    status: 'active',
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewer.id,
  };
}

export function rejectClientLocation(
  location: ClientLocation,
  reviewer: Pick<SessionUser, 'id'>
): ClientLocation {
  return {
    ...location,
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewer.id,
  };
}

export function activeClientLocations(locations: ClientLocation[], clientId: string): ClientLocation[] {
  return locations.filter((l) => l.clientId === clientId && l.status === 'active');
}

export function pendingClientLocations(locations: ClientLocation[]): ClientLocation[] {
  return locations.filter((l) => l.status === 'pending');
}

export function locationStatusLabel(status: ClientLocationStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending staff approval';
    case 'active':
      return 'Active';
    case 'rejected':
      return 'Rejected';
  }
}
