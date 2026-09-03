import type { ClientType } from '../types';
import { clientApplicationIntake } from './clientApplicationIntake';
import { clientTypeLabel } from './clientType';

/**
 * Guardr staff operate the marketplace — they are not a security company command center.
 * Shift-level ops (tours, live post monitoring, dispatch) stay between the guard and whoever hired them.
 */
export const STAFF_PLATFORM_PURPOSE =
  'Platform trust: account approval, credential verification, payments, disputes, and safety escalations — not security operations dispatch.';

export const STAFF_DOES_NOT_OVERSEE = [
  'Per-shift patrol tours or guard routes',
  'Live post command for normal jobs',
  'Security company roster dispatch',
  'Client–guard on-site operational decisions',
] as const;

export const STAFF_OVERSEES = [
  'Account and application approval (per account type)',
  'Credential and PPO verification',
  'Job posting review when policy requires it',
  'Payments, payouts, refunds, and disputes',
  'Safety escalations, fraud, and policy violations',
] as const;

/** Staff never run shift operations dashboards — those belong to hiring parties. */
export function staffOverseesShiftOperations(): boolean {
  return false;
}

export function staffApplicationReviewFocus(clientType: ClientType | undefined): string {
  return clientApplicationIntake(clientType).staffReviewFocus;
}

export function staffApplicationReviewTitle(clientType: ClientType | undefined): string {
  return `${clientTypeLabel(clientType)} application`;
}
