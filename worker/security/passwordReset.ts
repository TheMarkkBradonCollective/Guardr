/**
 * Staff-driven password reset (there is no email reset yet). Administrator and above may
 * give a guard, client, or lower-ranked staff member a one-time temporary password that must
 * be changed at next sign-in. Resetting changes the password hash, so every existing session
 * for that account stops working.
 */
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { STAFF_RANK, staffRank } from './staffRules.ts';

export type ResetTargetKind = 'guard' | 'client' | 'staff';
const ADMINISTRATOR = 3;

export function resetTargetTable(kind: ResetTargetKind): 'guards' | 'clients' | 'staff' {
  return kind === 'staff' ? 'staff' : kind === 'client' ? 'clients' : 'guards';
}

/** Error text when the caller may not reset this account, else null. */
export function passwordResetDenied(
  caller: RequestIdentity | null,
  target: { kind: ResetTargetKind; id: string; staffRole?: string | null }
): string | null {
  if (!caller || caller.profileKind !== 'staff') return 'Staff sign-in required';
  if (staffRank(caller) < ADMINISTRATOR) return 'Only an Administrator or above can reset passwords';
  if (target.id === caller.profileId) return 'Use Change password for your own account';
  if (target.kind === 'staff') {
    const targetRank = STAFF_RANK[target.staffRole ?? ''] ?? 0;
    if (target.staffRole === 'Founder') return 'The Founder account cannot be reset here';
    if (targetRank >= staffRank(caller)) return 'You can only reset staff below your own role';
  }
  return null;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** Random temporary password, e.g. "Guardr-7hQk-2mXp-9Rta" (never the public default). */
export function generateTemporaryPassword(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = random(12);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `Guardr-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`;
}
