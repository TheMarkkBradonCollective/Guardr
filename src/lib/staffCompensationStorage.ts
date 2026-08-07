import { supabase } from './supabase';
import type { StaffCompensationPayout } from './staffCompensation';

const STORAGE_KEY = 'guardr_staff_compensation_payouts';

export function loadStaffCompensationPayoutsFromStorage(): StaffCompensationPayout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStaffCompensationPayoutsToStorage(payouts: StaffCompensationPayout[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payouts));
  } catch {
    /* ignore */
  }
}

function rowToPayout(row: Record<string, unknown>): StaffCompensationPayout {
  const hourlyAmount = row.hourly_amount != null ? Number(row.hourly_amount) : undefined;
  const manualAdjustmentAmount =
    row.manual_adjustment_amount != null ? Number(row.manual_adjustment_amount) : undefined;
  const adjustmentAmount = Number(row.adjustment_amount);
  return {
    id: String(row.id),
    staffId: String(row.staff_id),
    staffName: String(row.staff_name),
    staffEmail: String(row.staff_email),
    staffRole: row.staff_role as StaffCompensationPayout['staffRole'],
    periodStart: String(row.period_start),
    periodEnd: String(row.period_end),
    platformFeesInPeriod: Number(row.platform_fees_in_period),
    baseAmount: Number(row.base_amount),
    adjustmentAmount,
    hourlyHours: row.hourly_hours != null ? Number(row.hourly_hours) : undefined,
    hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : undefined,
    hourlyAmount,
    manualAdjustmentAmount,
    includeHourlyPay: row.include_hourly_pay != null ? Boolean(row.include_hourly_pay) : undefined,
    finalAmount: Number(row.final_amount),
    payoutStatus:
      row.payout_status === 'base_paid' || row.payout_status === 'finalized'
        ? row.payout_status
        : undefined,
    basePaidAt: row.base_paid_at != null ? String(row.base_paid_at) : undefined,
    adjustmentChoice:
      row.adjustment_choice === 'none' || row.adjustment_choice === 'custom'
        ? row.adjustment_choice
        : undefined,
    adjustmentsConfirmedAt:
      row.adjustments_confirmed_at != null ? String(row.adjustments_confirmed_at) : undefined,
    adjustmentsConfirmedById:
      row.adjustments_confirmed_by_id != null ? String(row.adjustments_confirmed_by_id) : undefined,
    adjustmentsConfirmedByEmail:
      row.adjustments_confirmed_by_email != null ? String(row.adjustments_confirmed_by_email) : undefined,
    confirmedById: String(row.confirmed_by_id),
    confirmedByEmail: String(row.confirmed_by_email),
    confirmedAt: String(row.confirmed_at),
    note: row.note != null ? String(row.note) : undefined,
  };
}

function payoutToRow(payout: StaffCompensationPayout) {
  return {
    id: payout.id,
    staff_id: payout.staffId,
    staff_name: payout.staffName,
    staff_email: payout.staffEmail,
    staff_role: payout.staffRole,
    period_start: payout.periodStart,
    period_end: payout.periodEnd,
    platform_fees_in_period: payout.platformFeesInPeriod,
    base_amount: payout.baseAmount,
    adjustment_amount: payout.adjustmentAmount,
    hourly_hours: payout.hourlyHours ?? null,
    hourly_rate: payout.hourlyRate ?? null,
    hourly_amount: payout.hourlyAmount ?? null,
    manual_adjustment_amount: payout.manualAdjustmentAmount ?? null,
    include_hourly_pay: payout.includeHourlyPay ?? null,
    final_amount: payout.finalAmount,
    payout_status: payout.payoutStatus ?? null,
    base_paid_at: payout.basePaidAt ?? null,
    adjustment_choice: payout.adjustmentChoice ?? null,
    adjustments_confirmed_at: payout.adjustmentsConfirmedAt ?? null,
    adjustments_confirmed_by_id: payout.adjustmentsConfirmedById ?? null,
    adjustments_confirmed_by_email: payout.adjustmentsConfirmedByEmail ?? null,
    confirmed_by_id: payout.confirmedById,
    confirmed_by_email: payout.confirmedByEmail,
    confirmed_at: payout.confirmedAt,
    note: payout.note ?? null,
  };
}

export async function loadStaffCompensationPayouts(): Promise<StaffCompensationPayout[]> {
  const local = loadStaffCompensationPayoutsFromStorage();
  try {
    const { data, error } = await supabase
      .from('staff_compensation_payouts')
      .select('*')
      .order('confirmed_at', { ascending: false });
    if (error || !data) return local;
    const remote = data.map((row) => rowToPayout(row as Record<string, unknown>));
    if (remote.length > 0) {
      saveStaffCompensationPayoutsToStorage(remote);
      return remote;
    }
  } catch {
    /* table may not exist yet */
  }
  return local;
}

export async function persistStaffCompensationPayout(payout: StaffCompensationPayout): Promise<StaffCompensationPayout[]> {
  const local = loadStaffCompensationPayoutsFromStorage();
  const next = [payout, ...local.filter((p) => p.id !== payout.id)];
  saveStaffCompensationPayoutsToStorage(next);

  try {
    await supabase.from('staff_compensation_payouts').upsert(payoutToRow(payout));
  } catch {
    /* table may not exist yet */
  }

  return next;
}
