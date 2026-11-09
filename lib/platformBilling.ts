/**
 * Guardr's additive billing primitives.
 *
 * These helpers are deliberately opt-in. The current hourly platform-fee engine
 * remains the source of the existing fee. Administrative fees are disabled by
 * default and are only included when a versioned fee configuration is enabled
 * AND the client has explicitly accepted that exact fee snapshot.
 */

export type AdditionalFeeBasis = 'per_booking' | 'per_guard' | 'per_hour';
export type AdditionalFeeModel = 'flat' | 'percent';

export interface AdministrativeFeeConfig {
  id: string;
  label: string;
  enabled: boolean;
  model: AdditionalFeeModel;
  /** Flat currency amount or percentage in decimal form (0.025 = 2.5%). */
  amount: number;
  basis: AdditionalFeeBasis;
  version: string;
  effectiveAt?: string;
}

export interface AcceptedAdministrativeFee {
  config: AdministrativeFeeConfig;
  accepted: boolean;
  acceptedAt?: string;
  acceptanceVersion?: string;
}

export interface PlatformBillingInput {
  hourlyRate: number;
  platformFeePerHour: number;
  durationHours: number;
  guardsNeeded: number;
  administrativeFee?: AcceptedAdministrativeFee | null;
}

export interface PlatformBillingBreakdown {
  currency: 'USD';
  clientHourlyRate: number;
  scheduledHours: number;
  guards: number;
  grossServiceAmount: number;
  hourlyPlatformFee: number;
  guardCompensation: number;
  administrativeFee: number;
  totalClientAmount: number;
  feeLines: Array<{
    code: 'hourly_platform_fee' | 'administrative_fee';
    label: string;
    amount: number;
  }>;
}

export interface BillingSnapshot extends PlatformBillingBreakdown {
  snapshotVersion: 1;
  capturedAt: string;
  feeScheduleVersion: string;
  administrativeFeeAcceptance?: {
    configId: string;
    configVersion: string;
    acceptedAt: string;
  };
}

export interface BillingAdjustment {
  id: string;
  jobId: string;
  kind: 'extension' | 'overtime' | 'guard_count_change' | 'refund' | 'correction';
  amount: number;
  currency: 'USD';
  reason: string;
  createdAt: string;
  acceptedByClient?: boolean;
  acceptedByGuard?: boolean;
  reversesAdjustmentId?: string;
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validNonNegative(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite, non-negative number.`);
  }
  return value;
}

/**
 * Calculate the current hourly fee allocation plus an optional, separately
 * itemized administrative fee. The latter is never charged by default.
 */
export function calculatePlatformBilling(input: PlatformBillingInput): PlatformBillingBreakdown {
  const hourlyRate = validNonNegative(input.hourlyRate, 'hourlyRate');
  const platformFeePerHour = validNonNegative(input.platformFeePerHour, 'platformFeePerHour');
  const hours = validNonNegative(input.durationHours, 'durationHours');
  const guards = Math.max(1, Math.floor(validNonNegative(input.guardsNeeded, 'guardsNeeded')));
  if (platformFeePerHour > hourlyRate) {
    throw new Error('Platform fee cannot exceed the agreed client hourly rate.');
  }

  const grossServiceAmount = money(hourlyRate * hours * guards);
  const hourlyPlatformFee = money(platformFeePerHour * hours * guards);
  const guardCompensation = money((hourlyRate - platformFeePerHour) * hours * guards);

  let administrativeFee = 0;
  const acceptedAdmin = input.administrativeFee;
  if (
    acceptedAdmin?.config.enabled === true &&
    acceptedAdmin.accepted === true &&
    acceptedAdmin.acceptanceVersion === acceptedAdmin.config.version &&
    acceptedAdmin.acceptedAt
  ) {
    const config = acceptedAdmin.config;
    const amount = validNonNegative(config.amount, 'administrativeFee.amount');
    const units =
      config.basis === 'per_booking' ? 1 :
      config.basis === 'per_guard' ? guards : hours * guards;
    administrativeFee = config.model === 'flat'
      ? money(amount * units)
      : money(grossServiceAmount * amount);
  }

  const feeLines: PlatformBillingBreakdown['feeLines'] = [
    { code: 'hourly_platform_fee', label: 'Platform fee allocation', amount: hourlyPlatformFee },
  ];
  if (administrativeFee > 0) {
    feeLines.push({
      code: 'administrative_fee',
      label: acceptedAdmin?.config.label?.trim() || 'Administrative fee',
      amount: administrativeFee,
    });
  }

  return {
    currency: 'USD',
    clientHourlyRate: hourlyRate,
    scheduledHours: hours,
    guards,
    grossServiceAmount,
    hourlyPlatformFee,
    guardCompensation,
    administrativeFee,
    totalClientAmount: money(grossServiceAmount + administrativeFee),
    feeLines,
  };
}

/** Capture the exact accepted fee configuration; later schedule changes cannot rewrite it. */
export function createBillingSnapshot(
  input: PlatformBillingInput,
  metadata: { feeScheduleVersion: string; capturedAt?: string }
): BillingSnapshot {
  const breakdown = calculatePlatformBilling(input);
  const acceptedAdmin = input.administrativeFee;
  const acceptedFee =
    acceptedAdmin?.config.enabled === true &&
    acceptedAdmin.accepted === true &&
    acceptedAdmin.acceptanceVersion === acceptedAdmin.config.version &&
    acceptedAdmin.acceptedAt
      ? {
          configId: acceptedAdmin.config.id,
          configVersion: acceptedAdmin.config.version,
          acceptedAt: acceptedAdmin.acceptedAt,
        }
      : undefined;

  return {
    ...breakdown,
    snapshotVersion: 1,
    capturedAt: metadata.capturedAt ?? new Date().toISOString(),
    feeScheduleVersion: metadata.feeScheduleVersion,
    ...(acceptedFee ? { administrativeFeeAcceptance: acceptedFee } : {}),
  };
}

/** A repeat event with the same provider event ID must not create another ledger row. */
export function appendLedgerEventOnce<T extends { idempotencyKey: string }>(
  existing: readonly T[],
  incoming: T
): { events: T[]; inserted: boolean } {
  if (existing.some((event) => event.idempotencyKey === incoming.idempotencyKey)) {
    return { events: [...existing], inserted: false };
  }
  return { events: [...existing, incoming], inserted: true };
}

/** Create an adjustment record without mutating the original accepted snapshot. */
export function createBillingAdjustment(
  input: Omit<BillingAdjustment, 'currency' | 'createdAt'> & {
    createdAt?: string;
  }
): BillingAdjustment {
  if (!input.id.trim() || !input.jobId.trim() || !input.reason.trim()) {
    throw new Error('Adjustment ID, job ID, and reason are required.');
  }
  if (!Number.isFinite(input.amount) || input.amount === 0) {
    throw new Error('Adjustment amount must be a finite, non-zero amount.');
  }
  return {
    ...input,
    amount: money(input.amount),
    currency: 'USD',
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
