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

/** Finance desk (null ladder role + Finance side role) badge prefix */
export const FINANCE_DESK_BADGE_PREFIX = 'FIN';

const STAFF_BADGE_PATTERN = /^([A-Z]{3})-(\d+)$/i;
const FORBIDDEN_STAFF_BADGE_PREFIX = 'STF';

export function formatStaffBadgeNumber(role: StaffRole, sequence: number): string {
  const prefix = STAFF_BADGE_PREFIX[role];
  return `${prefix}-${String(sequence).padStart(5, '0')}`;
}

export function formatFinanceDeskBadgeNumber(sequence: number): string {
  return `${FINANCE_DESK_BADGE_PREFIX}-${String(sequence).padStart(5, '0')}`;
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

export function staffBadgeMatchesFinanceDesk(badgeNumber: string): boolean {
  const parsed = parseStaffBadgeNumber(badgeNumber);
  if (!parsed || isForbiddenStaffBadgePrefix(parsed.prefix)) return false;
  return parsed.prefix === FINANCE_DESK_BADGE_PREFIX;
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

export function nextFinanceDeskBadgeNumber(
  roster: Array<Pick<SecurityGuard, 'badgeNumber' | 'isStaff'>>
): string {
  let maxSequence = 0;
  for (const member of roster) {
    if (!member.isStaff) continue;
    const parsed = parseStaffBadgeNumber(member.badgeNumber ?? '');
    if (!parsed || parsed.prefix !== FINANCE_DESK_BADGE_PREFIX) continue;
    maxSequence = Math.max(maxSequence, parsed.sequence);
  }
  return formatFinanceDeskBadgeNumber(maxSequence + 1);
}

/** Next badge for a role change — excludes the member being reassigned. */
export function nextStaffBadgeNumberForRoleChange(
  role: StaffRole,
  roster: Array<Pick<SecurityGuard, 'id' | 'badgeNumber' | 'isStaff'>>,
  staffId: string
): string {
  const others = roster.filter((member) => member.isStaff && member.id !== staffId);
  return nextStaffBadgeNumber(role, others);
}

export function nextFinanceDeskBadgeNumberForChange(
  roster: Array<Pick<SecurityGuard, 'id' | 'badgeNumber' | 'isStaff'>>,
  staffId: string
): string {
  const others = roster.filter((member) => member.isStaff && member.id !== staffId);
  return nextFinanceDeskBadgeNumber(others);
}

export function staffBadgeNeedsRoleReassignment(
  badgeNumber: string | undefined,
  role: StaffRole
): boolean {
  if (!badgeNumber?.trim()) return true;
  return !staffBadgeMatchesRole(badgeNumber, role);
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

export function validateFinanceDeskBadgeNumber(badgeNumber: string): string | null {
  const trimmed = badgeNumber.trim();
  if (!STAFF_BADGE_PATTERN.test(trimmed)) {
    return 'Staff ID must look like FIN-00001.';
  }
  const parsed = parseStaffBadgeNumber(trimmed);
  if (!parsed) return 'Staff ID must look like FIN-00001.';
  if (isForbiddenStaffBadgePrefix(parsed.prefix)) {
    return 'STF staff IDs are not allowed.';
  }
  if (parsed.prefix !== FINANCE_DESK_BADGE_PREFIX) {
    return `Finance desk Staff ID prefix must be ${FINANCE_DESK_BADGE_PREFIX}.`;
  }
  return null;
}

export function isValidStaffBadgeNumberFormat(value: string): boolean {
  return STAFF_BADGE_PATTERN.test(value.trim());
}

export function looksLikeStaffBadge(value?: string | null): boolean {
  if (!value?.trim()) return false;
  return STAFF_BADGE_PATTERN.test(value.trim());
}
