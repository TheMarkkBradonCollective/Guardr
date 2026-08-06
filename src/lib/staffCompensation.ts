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

export interface StaffRoleCompensationRule {
  /** Share of collected platform fees for this role (0–1, e.g. 0.02 = 2%). */
  percentOfFees: number;
  /** Minimum payout per person per period when revenue allows. */
  floorPerPeriod: number;
  /** Maximum payout per person per period. */
  capPerPeriod: number;
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
  adjustmentAmount: number;
  finalAmount: number;
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
  existingPayout?: StaffCompensationPayout;
  isActive: boolean;
}

export const DEFAULT_STAFF_COMPENSATION_CONFIG: StaffCompensationConfig = {
  enabled: true,
  cadence: 'weekly',
  roleRules: {
    Support: { percentOfFees: 0.015, floorPerPeriod: 0, capPerPeriod: 400 },
    Moderator: { percentOfFees: 0.02, floorPerPeriod: 0, capPerPeriod: 600 },
    Administrator: { percentOfFees: 0.025, floorPerPeriod: 0, capPerPeriod: 800 },
    Manager: { percentOfFees: 0.03, floorPerPeriod: 0, capPerPeriod: 1200 },
    Director: { percentOfFees: 0.04, floorPerPeriod: 0, capPerPeriod: 2000 },
    Founder: { percentOfFees: 0.05, floorPerPeriod: 0, capPerPeriod: 3000 },
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

export function buildStaffCompensationPreviews(params: {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  config: StaffCompensationConfig;
  payouts: StaffCompensationPayout[];
  periodStart: string;
  periodEnd: string;
}): StaffCompensationPreview[] {
  const { guards, requests, config, payouts, periodStart, periodEnd } = params;
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
      existingPayout,
      isActive: member.userStatus === 'active' || member.userStatus === 'pending',
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
