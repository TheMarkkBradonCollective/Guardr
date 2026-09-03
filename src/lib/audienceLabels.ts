/** User-facing labels for marketplace customers (internal role and tables still use `client`). */

import type { ClientType } from '../types';

export const CUSTOMER_LABEL = 'Customer';
export const CUSTOMERS_LABEL = 'Customers';

export const PERSONAL_ACCOUNT_LABEL = 'Personal account';
export const BUSINESS_ACCOUNT_LABEL = 'Business account';
export const SECURITY_COMPANY_ACCOUNT_LABEL = 'Security company account';

/** Fallback display name when profile fields are empty. */
export function customerDisplayFallback(): string {
  return CUSTOMER_LABEL;
}

/** Personal vs business vs security company contracting party label. */
export function accountKindLabel(kind: ClientType | undefined): string {
  if (kind === 'personal') return PERSONAL_ACCOUNT_LABEL;
  if (kind === 'security-company') return SECURITY_COMPANY_ACCOUNT_LABEL;
  return BUSINESS_ACCOUNT_LABEL;
}
