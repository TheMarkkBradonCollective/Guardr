/** User-facing labels for marketplace customers (internal role and tables still use `client`). */

export const CUSTOMER_LABEL = 'Customer';
export const CUSTOMERS_LABEL = 'Customers';

export const PERSONAL_ACCOUNT_LABEL = 'Personal account';
export const BUSINESS_ACCOUNT_LABEL = 'Business account';

/** Fallback display name when profile fields are empty. */
export function customerDisplayFallback(): string {
  return CUSTOMER_LABEL;
}

/** Personal vs business contracting party label. */
export function accountKindLabel(kind: 'personal' | 'business' | undefined): string {
  return kind === 'personal' ? PERSONAL_ACCOUNT_LABEL : BUSINESS_ACCOUNT_LABEL;
}
