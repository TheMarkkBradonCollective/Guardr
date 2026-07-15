import type { DifferentialPayRates, SecurityGuard, SecurityRequest } from '../types';
import { computeGuardArmedStatus, type GuardArmedStatus } from './guardArmedStatus';

export function hasTierPayRates(rates?: DifferentialPayRates | null): boolean {
  if (!rates) return false;
  return rates.unarmed != null || rates.lightArmed != null || rates.armed != null;
}

export function resolveTierPayRate(
  rates: DifferentialPayRates | undefined,
  tier: GuardArmedStatus,
  fallback: number
): number {
  if (!rates) return fallback;
  const tierRate =
    tier === 'armed' ? rates.armed : tier === 'light-armed' ? rates.lightArmed : rates.unarmed;
  return tierRate ?? fallback;
}

export function resolveGuardPayForJob(
  job: Pick<SecurityRequest, 'guardPay' | 'hourlyRate' | 'tierPayRates' | 'state'>,
  guard: SecurityGuard
): number {
  const fallback = job.guardPay ?? job.hourlyRate;
  if (!hasTierPayRates(job.tierPayRates)) return fallback;
  const tier = computeGuardArmedStatus(guard, job.state ?? 'CA');
  return resolveTierPayRate(job.tierPayRates, tier, fallback);
}

export function effectiveJobGuardPay(
  job: Pick<SecurityRequest, 'guardPay' | 'hourlyRate' | 'tierPayRates'>
): number {
  if (!hasTierPayRates(job.tierPayRates)) {
    return job.guardPay ?? job.hourlyRate;
  }
  const rates = job.tierPayRates!;
  return rates.unarmed ?? rates.lightArmed ?? rates.armed ?? job.guardPay ?? job.hourlyRate;
}
