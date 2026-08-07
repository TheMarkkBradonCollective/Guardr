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

export function staffLoginEmailMatches(
  member: { email: string; personalEmail?: string | null },
  loginEmail: string
): boolean {
  const normalized = normalizeStaffEmail(loginEmail);
  if (!normalized) return false;
  if (normalizeStaffEmail(member.email) === normalized) return true;
  const personal = member.personalEmail?.trim();
  return Boolean(personal && normalizeStaffEmail(personal) === normalized);
}

/** Supabase Auth is linked to the work email even when signing in with personal. */
export function staffWorkLoginEmail(member: { email: string }): string {
  return normalizeStaffEmail(member.email);
}

export function staffLoginEmailOrFilter(emailLower: string): string {
  return `email.eq.${emailLower},personal_email.eq.${emailLower}`;
}
