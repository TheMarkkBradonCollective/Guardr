import type { SecurityGuard, SecurityRequest, StaffRole } from '../types';
import { getPlatformFeeAmount, isCashClientPayment, isStripeDepositSatisfied } from './cashPayments';
import { normalizeStaffRole } from './permissions';

/** Staff roles eligible for revenue-share compensation. */
export const COMPENSATABLE_STAFF_ROLES: StaffRole[] = [
  'Support',
  'Moderator',
  'Administrator',
  'Manager',
  'Director',
  'Founder',
];

export type StaffCompensationCadence = 'weekly' | 'monthly';

/** Director post-payout adjustment selection — deductions are never permitted. */
export type StaffPayoutAdjustmentChoice = 'none' | 'custom';

export type StaffCompensationPayoutStatus = 'base_paid' | 'finalized';

export const STAFF_COMPENSATION_AUTO_ACTOR = {
  id: 'system-auto',
  email: 'auto-payout@guardr.app',
} as const;

export interface StaffRoleCompensationRule {
  /** Share of collected platform fees for this role (0–1, e.g. 0.02 = 2%). */
  percentOfFees: number;
  /** Minimum payout per person per period when revenue allows. */
  floorPerPeriod: number;
  /** Maximum payout per person per period. */
  capPerPeriod: number;
  /** Hourly pay rate for tracked active time (Manager+ editable). */
  hourlyPayRate: number;
}

export interface StaffCompensationConfig {
  enabled: boolean;
  cadence: StaffCompensationCadence;
  roleRules: Record<StaffRole, StaffRoleCompensationRule>;
}

export interface StaffCompensationPayout {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: StaffRole;
  periodStart: string;
  periodEnd: string;
  platformFeesInPeriod: number;
  baseAmount: number;
  /** @deprecated Use hourlyAmount + manualAdjustmentAmount — kept for legacy rows. */
  adjustmentAmount: number;
  hourlyHours?: number;
  hourlyRate?: number;
  hourlyAmount?: number;
  manualAdjustmentAmount?: number;
  includeHourlyPay?: boolean;
  finalAmount: number;
  /** Instant revenue-share deposit — finalized when adjustments are confirmed. */
  payoutStatus?: StaffCompensationPayoutStatus;
  basePaidAt?: string;
  adjustmentChoice?: StaffPayoutAdjustmentChoice;
  adjustmentsConfirmedAt?: string;
  adjustmentsConfirmedById?: string;
  adjustmentsConfirmedByEmail?: string;
  confirmedById: string;
  confirmedByEmail: string;
  confirmedAt: string;
  note?: string;
}

export interface StaffCompensationPreview {
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: StaffRole;
  rolePercent: number;
  peersInRole: number;
  platformFeesInPeriod: number;
  baseAmount: number;
  floorAmount: number;
  capAmount: number;
  cappedBaseAmount: number;
  alreadyPaidAmount: number;
  pendingAmount: number;
  /** True when no payout row exists yet for this staff member in the period. */
  needsPeriodPayout: boolean;
  existingPayout?: StaffCompensationPayout;
  isActive: boolean;
  trackedHours: number;
  hourlyPayRate: number;
  awaitingAdjustments: boolean;
}

/** Default split targets ~50% of collected platform fees to staff.
 * Ladder keeps Mod↔Admin and Manager↔Director tight; higher responsibility gets more %.
 */
export const DEFAULT_STAFF_COMPENSATION_CONFIG: StaffCompensationConfig = {
  enabled: true,
  cadence: 'weekly',
  roleRules: {
    Support: { percentOfFees: 0.04, floorPerPeriod: 0, capPerPeriod: 1100, hourlyPayRate: 18 },
    Moderator: { percentOfFees: 0.06, floorPerPeriod: 0, capPerPeriod: 1700, hourlyPayRate: 20 },
    Administrator: { percentOfFees: 0.07, floorPerPeriod: 0, capPerPeriod: 2200, hourlyPayRate: 22 },
    Manager: { percentOfFees: 0.1, floorPerPeriod: 0, capPerPeriod: 3300, hourlyPayRate: 28 },
    Director: { percentOfFees: 0.111, floorPerPeriod: 0, capPerPeriod: 5600, hourlyPayRate: 35 },
    Founder: { percentOfFees: 0.119, floorPerPeriod: 0, capPerPeriod: 8300, hourlyPayRate: 40 },
  },
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isClientPaid(req: SecurityRequest): boolean {
  return !!req.paymentStatus && req.paymentStatus !== 'unpaid';
}

function isPlatformFeeCollected(req: SecurityRequest): boolean {
  if (!isClientPaid(req)) return false;
  if (!isCashClientPayment(req)) return true;
  return isStripeDepositSatisfied(req);
}

function jobFeeEarnedAt(req: SecurityRequest): string {
  return req.cashDepositedAt ?? req.guardPayoutAvailableAt ?? req.endDate;
}

export function normalizeStaffCompensationConfig(
  input?: Partial<StaffCompensationConfig> | null,
): StaffCompensationConfig {
  const base = DEFAULT_STAFF_COMPENSATION_CONFIG;
  const roleRules = { ...base.roleRules };
  if (input?.roleRules) {
    for (const role of COMPENSATABLE_STAFF_ROLES) {
      const rule = input.roleRules[role];
      if (!rule) continue;
      roleRules[role] = {
        percentOfFees: Math.min(1, Math.max(0, rule.percentOfFees ?? roleRules[role].percentOfFees)),
        floorPerPeriod: Math.max(0, rule.floorPerPeriod ?? roleRules[role].floorPerPeriod),
        capPerPeriod: Math.max(0, rule.capPerPeriod ?? roleRules[role].capPerPeriod),
        hourlyPayRate: Math.max(0, rule.hourlyPayRate ?? roleRules[role].hourlyPayRate),
      };
    }
  }
  return {
    enabled: input?.enabled ?? base.enabled,
    cadence: input?.cadence === 'monthly' ? 'monthly' : 'weekly',
    roleRules,
  };
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getCompensationPeriodBounds(
  cadence: StaffCompensationCadence,
  referenceDate: Date = new Date(),
): { periodStart: string; periodEnd: string } {
  const ref = startOfUtcDay(referenceDate);

  if (cadence === 'monthly') {
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
    const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }

  const day = ref.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(ref);
  start.setUTCDate(ref.getUTCDate() + diffToMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { periodStart: startOfUtcDay(start).toISOString(), periodEnd: end.toISOString() };
}

export function isWithinCompensationPeriod(isoDate: string, periodStart: string, periodEnd: string): boolean {
  const ts = new Date(isoDate).getTime();
  return ts >= new Date(periodStart).getTime() && ts <= new Date(periodEnd).getTime();
}

export function sumCollectedPlatformFeesInPeriod(
  requests: SecurityRequest[],
  periodStart: string,
  periodEnd: string,
): number {
  let total = 0;
  for (const req of requests) {
    if (!isPlatformFeeCollected(req)) continue;
    const earnedAt = jobFeeEarnedAt(req);
    if (!isWithinCompensationPeriod(earnedAt, periodStart, periodEnd)) continue;
    total += getPlatformFeeAmount(req);
  }
  return round2(total);
}

export function activeCompensatableStaff(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((guard) => {
    if (!guard.isStaff || !guard.staffRole) return false;
    const role = normalizeStaffRole(guard.staffRole);
    if (!role || !COMPENSATABLE_STAFF_ROLES.includes(role)) return false;
    return guard.userStatus !== 'suspended' && guard.userStatus !== 'blocked';
  });
}

function applyFloorAndCap(amount: number, floor: number, cap: number): number {
  let value = amount;
  if (floor > 0) value = Math.max(value, floor);
  if (cap > 0) value = Math.min(value, cap);
  return round2(value);
}

export function computeHourlyPayAmount(hours: number, hourlyRate: number): number {
  return round2(Math.max(0, hours) * Math.max(0, hourlyRate));
}

export interface StaffPayoutAdjustmentInput {
  choice: StaffPayoutAdjustmentChoice;
  includeHourlyPay: boolean;
  trackedHours: number;
  hourlyRate: number;
  manualAdjustment: number;
}

export function resolvePayoutStatus(payout: StaffCompensationPayout): StaffCompensationPayoutStatus {
  if (payout.payoutStatus === 'base_paid' || payout.payoutStatus === 'finalized') {
    return payout.payoutStatus;
  }
  return 'finalized';
}

export function isPayoutAwaitingAdjustments(payout: StaffCompensationPayout): boolean {
  return resolvePayoutStatus(payout) === 'base_paid';
}

export function buildInstantBasePayout(params: {
  preview: StaffCompensationPreview;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
}): StaffCompensationPayout {
  const paidAt = params.paidAt ?? new Date().toISOString();
  const baseAmount = params.preview.cappedBaseAmount;
  return {
    id: `scpay-base-${params.preview.staffId}-${Date.parse(params.periodStart)}`,
    staffId: params.preview.staffId,
    staffName: params.preview.staffName,
    staffEmail: params.preview.staffEmail,
    staffRole: params.preview.staffRole,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    platformFeesInPeriod: params.preview.platformFeesInPeriod,
    baseAmount,
    adjustmentAmount: 0,
    hourlyHours: 0,
    hourlyRate: params.preview.hourlyPayRate,
    hourlyAmount: 0,
    manualAdjustmentAmount: 0,
    includeHourlyPay: false,
    finalAmount: baseAmount,
    payoutStatus: 'base_paid',
    basePaidAt: paidAt,
    adjustmentChoice: 'none',
    confirmedById: STAFF_COMPENSATION_AUTO_ACTOR.id,
    confirmedByEmail: STAFF_COMPENSATION_AUTO_ACTOR.email,
    confirmedAt: paidAt,
  };
}

export function applyStaffPayoutAdjustments(
  payout: StaffCompensationPayout,
  input: StaffPayoutAdjustmentInput,
  confirmedBy: { id: string; email: string },
): StaffCompensationPayout {
  const extras = computeStaffPayoutAdjustment(input);
  const now = new Date().toISOString();
  return {
    ...payout,
    adjustmentAmount: extras.totalAdjustment,
    hourlyHours: extras.hourlyHours,
    hourlyRate: input.hourlyRate,
    hourlyAmount: extras.hourlyAmount,
    manualAdjustmentAmount: extras.manualAdjustmentAmount,
    includeHourlyPay: input.choice === 'custom' && input.includeHourlyPay,
    adjustmentChoice: input.choice,
    finalAmount: round2(payout.baseAmount + extras.totalAdjustment),
    payoutStatus: 'finalized',
    adjustmentsConfirmedAt: now,
    adjustmentsConfirmedById: confirmedBy.id,
    adjustmentsConfirmedByEmail: confirmedBy.email,
  };
}

export function computeStaffPayoutAdjustment(input: StaffPayoutAdjustmentInput): {
  hourlyHours: number;
  hourlyAmount: number;
  manualAdjustmentAmount: number;
  totalAdjustment: number;
} {
  const manualAdjustmentAmount =
    input.choice === 'custom' ? round2(Math.max(0, input.manualAdjustment)) : 0;
  const hourlyHours =
    input.choice === 'custom' && input.includeHourlyPay ? round2(Math.max(0, input.trackedHours)) : 0;
  const hourlyAmount =
    input.choice === 'custom' && input.includeHourlyPay
      ? computeHourlyPayAmount(hourlyHours, input.hourlyRate)
      : 0;
  return {
    hourlyHours,
    hourlyAmount,
    manualAdjustmentAmount,
    totalAdjustment: round2(hourlyAmount + manualAdjustmentAmount),
  };
}

export function computeStaffPayoutFinalAmount(
  baseAmount: number,
  adjustment: StaffPayoutAdjustmentInput,
): number {
  const extras = computeStaffPayoutAdjustment(adjustment);
  return round2(baseAmount + extras.totalAdjustment);
}

export function buildStaffCompensationPreviews(params: {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  config: StaffCompensationConfig;
  payouts: StaffCompensationPayout[];
  periodStart: string;
  periodEnd: string;
  trackedHoursByStaffId?: Record<string, number>;
}): StaffCompensationPreview[] {
  const { guards, requests, config, payouts, periodStart, periodEnd, trackedHoursByStaffId = {} } = params;
  if (!config.enabled) return [];

  const platformFeesInPeriod = sumCollectedPlatformFeesInPeriod(requests, periodStart, periodEnd);
  const staff = activeCompensatableStaff(guards);
  const periodPayouts = payouts.filter(
    (p) => p.periodStart === periodStart && p.periodEnd === periodEnd,
  );

  const byRole = new Map<StaffRole, SecurityGuard[]>();
  for (const member of staff) {
    const role = normalizeStaffRole(member.staffRole!)!;
    const list = byRole.get(role) ?? [];
    list.push(member);
    byRole.set(role, list);
  }

  const previews: StaffCompensationPreview[] = [];

  for (const member of staff) {
    const role = normalizeStaffRole(member.staffRole!)!;
    const rule = config.roleRules[role];
    const peers = byRole.get(role) ?? [];
    const peerCount = Math.max(1, peers.length);
    const rolePool = round2(platformFeesInPeriod * rule.percentOfFees);
    const rawShare = round2(rolePool / peerCount);
    const cappedBase = applyFloorAndCap(rawShare, rule.floorPerPeriod, rule.capPerPeriod);
    const existingPayout = periodPayouts.find((p) => p.staffId === member.id);
    const alreadyPaidAmount = existingPayout?.finalAmount ?? 0;

    previews.push({
      staffId: member.id,
      staffName: member.name,
      staffEmail: member.email,
      staffRole: role,
      rolePercent: rule.percentOfFees,
      peersInRole: peerCount,
      platformFeesInPeriod,
      baseAmount: rawShare,
      floorAmount: rule.floorPerPeriod,
      capAmount: rule.capPerPeriod,
      cappedBaseAmount: cappedBase,
      alreadyPaidAmount,
      pendingAmount: existingPayout ? 0 : cappedBase,
      needsPeriodPayout: !existingPayout,
      existingPayout,
      awaitingAdjustments: existingPayout ? isPayoutAwaitingAdjustments(existingPayout) : false,
      isActive: member.userStatus === 'active' || member.userStatus === 'pending',
      trackedHours: trackedHoursByStaffId[member.id] ?? 0,
      hourlyPayRate: rule.hourlyPayRate,
    });
  }

  return previews.sort((a, b) => {
    const roleOrder = COMPENSATABLE_STAFF_ROLES.indexOf(a.staffRole) - COMPENSATABLE_STAFF_ROLES.indexOf(b.staffRole);
    if (roleOrder !== 0) return roleOrder;
    return a.staffName.localeCompare(b.staffName);
  });
}

export function formatCompensationMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompensationPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatCompensationPeriodLabel(periodStart: string, periodEnd: string, cadence: StaffCompensationCadence): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
  if (cadence === 'monthly') {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

export function totalRolePercent(config: StaffCompensationConfig): number {
  return COMPENSATABLE_STAFF_ROLES.reduce((sum, role) => sum + config.roleRules[role].percentOfFees, 0);
}
