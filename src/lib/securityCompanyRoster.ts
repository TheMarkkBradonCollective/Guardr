import type { Client, SecurityCompanyRosterEntry, SecurityGuard, SecurityRequest } from '../types';

export function activeRosterEntries(client: Pick<Client, 'securityCompanyRoster'>): SecurityCompanyRosterEntry[] {
  return (client.securityCompanyRoster ?? []).filter((e) => e.status === 'active');
}

export function rosterGuardIds(client: Pick<Client, 'securityCompanyRoster'>): string[] {
  return activeRosterEntries(client).map((e) => e.guardId);
}

export function isGuardOnCompanyRoster(
  client: Pick<Client, 'securityCompanyRoster'>,
  guardId: string
): boolean {
  return rosterGuardIds(client).includes(guardId);
}

function newEntryId(clientId: string, guardId: string): string {
  return `${clientId}-roster-${guardId}`;
}

export function addGuardToCompanyRoster(
  client: Client,
  guardId: string,
  options?: { source?: SecurityCompanyRosterEntry['source']; notes?: string },
  now = new Date()
): { client: Client } | { error: string } {
  const existing = (client.securityCompanyRoster ?? []).find(
    (e) => e.guardId === guardId && e.status === 'active'
  );
  if (existing) return { error: 'This guard is already on your roster.' };

  const ts = now.toISOString();
  const reactivated = (client.securityCompanyRoster ?? []).find((e) => e.guardId === guardId);
  const entry: SecurityCompanyRosterEntry = reactivated
    ? {
        ...reactivated,
        status: 'active',
        addedAt: ts,
        source: options?.source ?? reactivated.source,
        notes: options?.notes ?? reactivated.notes,
      }
    : {
        id: newEntryId(client.id, guardId),
        guardId,
        addedAt: ts,
        source: options?.source ?? 'manual',
        status: 'active',
        notes: options?.notes,
      };

  const without = (client.securityCompanyRoster ?? []).filter((e) => e.guardId !== guardId);
  return {
    client: {
      ...client,
      securityCompanyRoster: [...without, entry],
    },
  };
}

export function removeGuardFromCompanyRoster(
  client: Client,
  guardId: string,
  now = new Date()
): Client {
  const ts = now.toISOString();
  return {
    ...client,
    securityCompanyRoster: (client.securityCompanyRoster ?? []).map((e) =>
      e.guardId === guardId ? { ...e, status: 'removed' as const, addedAt: ts } : e
    ),
  };
}

export function touchRosterBooking(
  client: Client,
  guardId: string,
  jobId: string,
  now = new Date()
): Client {
  const ts = now.toISOString();
  return {
    ...client,
    securityCompanyRoster: (client.securityCompanyRoster ?? []).map((e) =>
      e.guardId === guardId && e.status === 'active'
        ? { ...e, lastBookedJobId: jobId, lastBookedAt: ts }
        : e
    ),
  };
}

export function rosterGuardsForClient(
  client: Pick<Client, 'securityCompanyRoster'>,
  guards: SecurityGuard[]
): SecurityGuard[] {
  const ids = new Set(rosterGuardIds(client));
  return guards.filter((g) => ids.has(g.id));
}

export function autoAddCompletedJobGuardsToRoster(
  client: Client,
  requests: SecurityRequest[],
  now = new Date()
): Client {
  if (client.clientType !== 'security-company') return client;
  let next = client;
  for (const job of requests) {
    if (job.clientId !== client.id) continue;
    if (!['completed', 'closed', 'accepted', 'in-progress'].includes(job.status)) continue;
    const guardIds = new Set<string>();
    if (job.assignedGuardId) guardIds.add(job.assignedGuardId);
    for (const slot of job.guardSlots ?? []) {
      if (slot.guardId && slot.status === 'approved') guardIds.add(slot.guardId);
    }
    for (const guardId of guardIds) {
      if (isGuardOnCompanyRoster(next, guardId)) {
        next = touchRosterBooking(next, guardId, job.id, now);
        continue;
      }
      const added = addGuardToCompanyRoster(next, guardId, { source: 'marketplace' }, now);
      if (!('error' in added)) next = added.client;
    }
  }
  return next;
}
