export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeOptionalStaffEmail(email?: string | null): string {
  return email?.trim() ?? '';
}

/** Personal email cannot be used as another account's login email. */
export function assertStaffPersonalEmailAvailable(
  personalEmail: string,
  accounts: Array<{ id: string; email: string }>,
  staffId?: string
): string {
  const normalized = normalizeStaffEmail(personalEmail);
  if (!normalized) return '';
  const conflict = accounts.find(
    (account) => account.id !== staffId && normalizeStaffEmail(account.email) === normalized
  );
  if (conflict) {
    throw new Error('That personal email is already used as a sign-in email on another account.');
  }
  return normalized;
}

export function assertStaffPersonalEmailDistinctFromWork(
  workEmail: string,
  personalEmail: string
): void {
  const personal = normalizeOptionalStaffEmail(personalEmail);
  if (!personal) return;
  if (normalizeStaffEmail(workEmail) === normalizeStaffEmail(personal)) {
    throw new Error('Personal email must be different from your work email.');
  }
}
