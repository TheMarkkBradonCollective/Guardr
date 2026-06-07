/** Platform fee model: client pays hourlyRate, guard receives guardPay, platform keeps the difference. */

export const PLATFORM_FEE_PER_HOUR = 5;

export function computeGuardPay(hourlyRate: number): number {
  return Math.max(0, hourlyRate - PLATFORM_FEE_PER_HOUR);
}

export function computePlatformFee(durationHours: number): number {
  return Math.round(durationHours * PLATFORM_FEE_PER_HOUR * 100) / 100;
}

export function computeGuardEarnings(durationHours: number, hourlyRate: number): number {
  return Math.round(durationHours * computeGuardPay(hourlyRate) * 100) / 100;
}
