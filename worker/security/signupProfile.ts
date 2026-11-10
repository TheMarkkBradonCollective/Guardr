/** Server-side profile construction for public sign-up (guards and clients only). */
import { SECRET_COLUMNS } from './dataPolicy.ts';

export type SignupBody = {
  email?: string;
  password?: string;
  profileKind?: string;
  /** Snake_case profile columns proposed by the app (untrusted). */
  profile?: Record<string, unknown>;
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SAFE_ID_RE = /^[A-Za-z0-9_-]{6,80}$/;
const IDENT_RE = /^[a-z_][a-z0-9_]*$/;

/** Columns a new account may never choose for itself. */
const SERVER_CONTROLLED = new Set([
  'id', 'email', 'password', 'password_hash', 'auth_user_id', 'must_change_password',
  'is_staff', 'staff_role', 'side_role', 'user_status', 'verified', 'background_checked',
  'id_verification_status', 'stripe_connect_account_id', 'migrated_to_staff_at',
  'approved', 'account_status', 'rating', 'jobs_completed', 'total_requests',
  'personal_email', 'managed_cities', 'created_at', 'updated_at',
]);

export function buildSignupProfileRow(
  kind: 'guard' | 'client',
  proposed: Record<string, unknown> | undefined
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (proposed && typeof proposed === 'object' && !Array.isArray(proposed)) {
    for (const [key, value] of Object.entries(proposed)) {
      if (!IDENT_RE.test(key)) continue;
      if (SERVER_CONTROLLED.has(key) || SECRET_COLUMNS.has(key)) continue;
      if (value === undefined) continue;
      row[key] = value;
    }
  }
  if (kind === 'guard') {
    if (typeof row.badge_number !== 'string' || !row.badge_number.trim()) {
      row.badge_number = `IC-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    Object.assign(row, {
      is_staff: false,
      staff_role: null,
      user_status: 'pending',
      verified: false,
      background_checked: false,
      rating: 0,
      jobs_completed: 0,
    });
  } else {
    Object.assign(row, { approved: false, account_status: 'pending', total_requests: 0 });
  }
  return row;
}
