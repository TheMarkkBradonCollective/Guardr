import type { SecurityGuard, StaffRole } from '../types';

/** Role-specific staff ID prefixes — never use STF. */
export const STAFF_BADGE_PREFIX: Record<StaffRole, string> = {
  Founder: 'OWN',
  Director: 'DIR',
  Manager: 'MGR',
  Administrator: 'ADM',
  Moderator: 'MOD',
  Support: 'SUP',
};

const STAFF_BADGE_PATTERN = /^([A-Z]{3})-(\d+)$/i;
const FORBIDDEN_STAFF_BADGE_PREFIX = 'STF';

export function formatStaffBadgeNumber(role: StaffRole, sequence: number): string {
  const prefix = STAFF_BADGE_PREFIX[role];
  return `${prefix}-${String(sequence).padStart(5, '0')}`;
}

export function parseStaffBadgeNumber(
  badgeNumber: string
): { prefix: string; sequence: number } | null {
  const match = badgeNumber.trim().match(STAFF_BADGE_PATTERN);
  if (!match) return null;
  return {
    prefix: match[1].toUpperCase(),
    sequence: Number.parseInt(match[2], 10),
  };
}

export function isForbiddenStaffBadgePrefix(prefix: string): boolean {
  return prefix.toUpperCase() === FORBIDDEN_STAFF_BADGE_PREFIX;
}

export function staffBadgeMatchesRole(badgeNumber: string, role: StaffRole): boolean {
  const parsed = parseStaffBadgeNumber(badgeNumber);
  if (!parsed || isForbiddenStaffBadgePrefix(parsed.prefix)) return false;
  return parsed.prefix === STAFF_BADGE_PREFIX[role];
}

export function nextStaffBadgeNumber(
  role: StaffRole,
  roster: Array<Pick<SecurityGuard, 'badgeNumber' | 'isStaff'>>
): string {
  const prefix = STAFF_BADGE_PREFIX[role];
  let maxSequence = 0;

  for (const member of roster) {
    if (!member.isStaff) continue;
    const parsed = parseStaffBadgeNumber(member.badgeNumber ?? '');
    if (!parsed || parsed.prefix !== prefix) continue;
    maxSequence = Math.max(maxSequence, parsed.sequence);
  }

  return formatStaffBadgeNumber(role, maxSequence + 1);
}

export function validateStaffBadgeNumber(
  badgeNumber: string,
  role: StaffRole
): string | null {
  const trimmed = badgeNumber.trim();
  if (!trimmed) return 'Staff ID is required.';
  const parsed = parseStaffBadgeNumber(trimmed);
  if (!parsed) return 'Staff ID must look like MOD-00001 (role prefix + number).';
  if (isForbiddenStaffBadgePrefix(parsed.prefix)) {
    return 'STF is not allowed. Use the role prefix (e.g. MOD-00001 for Moderator).';
  }
  if (parsed.prefix !== STAFF_BADGE_PREFIX[role]) {
    return `Staff ID prefix must be ${STAFF_BADGE_PREFIX[role]} for ${role}.`;
  }
  if (parsed.sequence < 1) return 'Staff ID number must start at 00001.';
  return null;
}

export function looksLikeStaffBadge(value?: string | null): boolean {
  if (!value?.trim()) return false;
  return STAFF_BADGE_PATTERN.test(value.trim());
}
