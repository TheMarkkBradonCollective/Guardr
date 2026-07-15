import type { SecurityGuard } from '../types';
import { getClientVisibleListedWeaponGear } from './guardWeaponGear';

/** Computed armed classification from verified credentials and listed gear. */
export type GuardArmedStatus = 'unarmed' | 'light-armed' | 'armed';

export const GUARD_ARMED_STATUS_LABELS: Record<GuardArmedStatus, string> = {
  unarmed: 'Unarmed',
  'light-armed': 'Light Armed',
  armed: 'Armed',
};

export const GUARD_ARMED_STATUS_PILL_CLASS: Record<GuardArmedStatus, string> = {
  unarmed: 'guard-armed-pill guard-armed-pill--unarmed',
  'light-armed': 'guard-armed-pill guard-armed-pill--light-armed',
  armed: 'guard-armed-pill guard-armed-pill--armed',
};

/** Highest armed tier the guard is credentialed and listing for clients. */
export function computeGuardArmedStatus(guard: SecurityGuard, state = 'CA'): GuardArmedStatus {
  const visible = getClientVisibleListedWeaponGear(guard, state);
  if (visible.some((rule) => rule.category === 'armed')) return 'armed';
  if (visible.some((rule) => rule.category === 'light-armed')) return 'light-armed';
  return 'unarmed';
}

export function guardMeetsArmedRequirement(
  guard: SecurityGuard,
  armedRequired: boolean,
  state = 'CA'
): boolean {
  if (!armedRequired) return true;
  const status = computeGuardArmedStatus(guard, state);
  return status === 'armed' || status === 'light-armed';
}

export function armedStatusRank(status: GuardArmedStatus): number {
  if (status === 'armed') return 3;
  if (status === 'light-armed') return 2;
  return 1;
}
