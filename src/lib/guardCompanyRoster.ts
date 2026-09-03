import type { Client, SecurityGuard } from '../types';
import { activeRosterEntries } from './securityCompanyRoster';

export type GuardCompanyRosterMembership = {
  clientId: string;
  companyName: string;
  addedAt: string;
  notes?: string;
};

/** Guards may work marketplace jobs and appear on licensed PPO rosters — not employment. */
export function guardCompanyRosterMemberships(
  guardId: string,
  clients: Client[]
): GuardCompanyRosterMembership[] {
  return clients
    .filter((c) => c.clientType === 'security-company')
    .flatMap((client) => {
      const entry = activeRosterEntries(client).find((e) => e.guardId === guardId);
      if (!entry) return [];
      return [
        {
          clientId: client.id,
          companyName: client.companyName || client.name,
          addedAt: entry.addedAt,
          notes: entry.notes,
        },
      ];
    })
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export function guardHasCompanyRosterMemberships(guardId: string, clients: Client[]): boolean {
  return guardCompanyRosterMemberships(guardId, clients).length > 0;
}

export function guardMarketplaceModeLabel(guard: SecurityGuard, clients: Client[]): string {
  const count = guardCompanyRosterMemberships(guard.id, clients).length;
  if (count === 0) return 'Marketplace guard';
  if (count === 1) return 'Marketplace + 1 company roster';
  return `Marketplace + ${count} company rosters`;
}
