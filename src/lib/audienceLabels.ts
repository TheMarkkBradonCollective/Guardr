/** User-facing labels for marketplace hiring accounts (internal role and tables still use `client`). */

export const GUARD_CUSTOMER_LABEL = 'Customer';

export const STAFF_HIRING_ACCOUNT_LABEL = 'Hiring account';
export const STAFF_HIRING_ACCOUNTS_LABEL = 'Hiring accounts';

export const PERSONAL_ACCOUNT_LABEL = 'Personal account';
export const BUSINESS_ACCOUNT_LABEL = 'Business account';

/** Fallback display name when profile fields are empty. */
export function hiringAccountDisplayFallback(audience: 'guard' | 'staff' = 'staff'): string {
  return audience === 'guard' ? GUARD_CUSTOMER_LABEL : STAFF_HIRING_ACCOUNT_LABEL;
}

/** Personal vs business contracting party label. */
export function accountKindLabel(kind: 'personal' | 'business' | undefined): string {
  return kind === 'personal' ? PERSONAL_ACCOUNT_LABEL : BUSINESS_ACCOUNT_LABEL;
}
