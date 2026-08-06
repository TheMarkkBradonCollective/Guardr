import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import {
  applyStaffPayoutAdjustments,
  buildInstantBasePayout,
  buildStaffCompensationPreviews,
  computeStaffPayoutAdjustment,
  computeStaffPayoutFinalAmount,
  formatCompensationMoney,
  formatCompensationPercent,
  formatCompensationPeriodLabel,
  getCompensationPeriodBounds,
  isPayoutAwaitingAdjustments,
  resolvePayoutStatus,
  totalRolePercent,
  type StaffCompensationPayout,
  type StaffCompensationPreview,
  type StaffPayoutAdjustmentChoice,
} from '../../lib/staffCompensation';
import {
  loadStaffCompensationPayouts,
  persistStaffCompensationPayout,
} from '../../lib/staffCompensationStorage';
import {
  closeStaffTimeEntry,
  createStaffClockInEntry,
  elapsedActiveSessionSeconds,
  formatElapsedDuration,
  formatTrackedHours,
  getActiveStaffTimeEntry,
  listActiveStaffTimeEntries,
  sumStaffHoursInPeriod,
  type StaffTimeEntry,
} from '../../lib/staffTimeTracking';
import {
  loadStaffTimeEntries,
  persistStaffTimeEntries,
} from '../../lib/staffTimeTrackingStorage';
import { PlatformSettings } from '../../lib/platformSettings';
import {
  canConfirmStaffCompensationPayout,
  canManageStaffCompensation,
  canViewStaffCompensation,
  platformRoleToStaffRole,
} from '../../lib/permissions';
import { writeAuditLog } from '../../lib/auditLog';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { GuardrButton } from '../baseui/GuardrButton';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { StaffMgmtSection } from './StaffMgmtSection';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { useDevice } from '../../lib/platform';

interface StaffCompensationPanelProps {
  currentUser: SessionUser;
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  platformSettings: PlatformSettings;
}

interface PayoutAdjustmentState {
  choice: StaffPayoutAdjustmentChoice;
  includeHourlyPay: boolean;
  manualAdjustment: number;
}

function defaultAdjustmentState(): PayoutAdjustmentState {
  return { choice: 'none', includeHourlyPay: false, manualAdjustment: 0 };
}

export function StaffCompensationPanel({
  currentUser,
  guards,
  requests,
  platformSettings,
}: StaffCompensationPanelProps) {
  const { formFactor } = useDevice();
  const config = platformSettings.staffCompensation!;
  const canManage = canManageStaffCompensation(currentUser);
  const canConfirm = canConfirmStaffCompensationPayout(currentUser);
  const viewerStaffRole = platformRoleToStaffRole(currentUser.role);
  const currentStaffMember = guards.find((guard) => guard.id === currentUser.id && guard.isStaff);

  const [payouts, setPayouts] = useState<StaffCompensationPayout[]>([]);
  const [timeEntries, setTimeEntries] = useState<StaffTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustmentState, setAdjustmentState] = useState<Record<string, PayoutAdjustmentState>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [clockBusy, setClockBusy] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const { periodStart, periodEnd } = useMemo(
    () => getCompensationPeriodBounds(config.cadence),
    [config.cadence],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([loadStaffCompensationPayouts(), loadStaffTimeEntries()]).then(([payoutRows, entryRows]) => {
      if (active) {
        setPayouts(payoutRows);
        setTimeEntries(entryRows);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const trackedHoursByStaffId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const guard of guards) {
      if (!guard.isStaff) continue;
      map[guard.id] = sumStaffHoursInPeriod(timeEntries, guard.id, periodStart, periodEnd, new Date(nowTick));
    }
    return map;
  }, [guards, timeEntries, periodStart, periodEnd, nowTick]);

  const allPreviews = useMemo(
    () =>
      buildStaffCompensationPreviews({
        guards,
        requests,
        config,
        payouts,
        periodStart,
        periodEnd,
        trackedHoursByStaffId,
      }),
    [guards, requests, config, payouts, periodStart, periodEnd, trackedHoursByStaffId],
  );

  const previews = useMemo(() => {
    if (canManage) return allPreviews;
    return allPreviews.filter((preview) => preview.staffId === currentUser.id);
  }, [allPreviews, canManage, currentUser.id]);

  useEffect(() => {
    if (!config.enabled || loading) return;
    const pending = allPreviews.filter((preview) => preview.pendingAmount > 0);
    if (pending.length === 0) return;

    let cancelled = false;
    void (async () => {
      let next = await loadStaffCompensationPayouts();
      for (const preview of pending) {
        const basePayout = buildInstantBasePayout({ preview, periodStart, periodEnd });
        next = await persistStaffCompensationPayout(basePayout);
      }
      if (!cancelled) setPayouts(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [allPreviews, config.enabled, loading, periodStart, periodEnd]);

  const periodLabel = formatCompensationPeriodLabel(periodStart, periodEnd, config.cadence);
  const periodFees = allPreviews[0]?.platformFeesInPeriod ?? 0;
  const rolePercentTotal = totalRolePercent(config);
  const myActiveEntry = getActiveStaffTimeEntry(timeEntries, currentUser.id);
  const activeStaffSessions = listActiveStaffTimeEntries(timeEntries);

  const history = useMemo(() => {
    const rows = canManage ? payouts : payouts.filter((p) => p.staffId === currentUser.id);
    return rows.slice(0, 20);
  }, [payouts, canManage, currentUser.id]);

  const getAdjustmentForPreview = (preview: StaffCompensationPreview): PayoutAdjustmentState =>
    adjustmentState[preview.staffId] ?? defaultAdjustmentState();

  const buildAdjustmentInput = (preview: StaffCompensationPreview) => {
    const state = getAdjustmentForPreview(preview);
    return {
      choice: state.choice,
      includeHourlyPay: state.includeHourlyPay,
      trackedHours: preview.trackedHours,
      hourlyRate: preview.hourlyPayRate,
      manualAdjustment: state.manualAdjustment,
    };
  };

  const computePreviewTotal = (preview: StaffCompensationPreview): number => {
    const payout = preview.existingPayout;
    if (payout && resolvePayoutStatus(payout) === 'finalized') {
      return payout.finalAmount;
    }
    if (payout && isPayoutAwaitingAdjustments(payout)) {
      return computeStaffPayoutFinalAmount(payout.baseAmount, buildAdjustmentInput(preview));
    }
    return preview.cappedBaseAmount;
  };

  const handleClockIn = async () => {
    if (!currentStaffMember || myActiveEntry || !canViewStaffCompensation(currentUser)) return;
    setClockBusy(true);
    try {
      const entry = createStaffClockInEntry({
        staffId: currentUser.id,
        staffName: currentStaffMember.name,
      });
      const next = [entry, ...timeEntries];
      setTimeEntries(await persistStaffTimeEntries(next));
    } finally {
      setClockBusy(false);
    }
  };

  const handleClockOut = async () => {
    if (!myActiveEntry) return;
    setClockBusy(true);
    try {
      const closed = closeStaffTimeEntry(myActiveEntry);
      const next = timeEntries.map((entry) => (entry.id === closed.id ? closed : entry));
      setTimeEntries(await persistStaffTimeEntries(next));
    } finally {
      setClockBusy(false);
    }
  };

  const handleConfirmAdjustments = async (preview: StaffCompensationPreview) => {
    const payout = preview.existingPayout;
    if (!canConfirm || !payout || !isPayoutAwaitingAdjustments(payout)) return;

    const input = buildAdjustmentInput(preview);
    if (input.choice === 'custom' && input.includeHourlyPay && preview.trackedHours <= 0 && input.manualAdjustment <= 0) {
      return;
    }

    setConfirmingId(preview.staffId);
    try {
      const updated = applyStaffPayoutAdjustments(payout, input, {
        id: currentUser.id,
        email: currentUser.email,
      });
      const next = await persistStaffCompensationPayout(updated);
      setPayouts(next);
      await writeAuditLog(
        currentUser,
        'staff_compensation_adjustments_confirmed',
        'staff_compensation',
        updated.id,
        {
          staffId: updated.staffId,
          staffName: updated.staffName,
          adjustmentChoice: updated.adjustmentChoice,
          hourlyAmount: updated.hourlyAmount,
          manualAdjustmentAmount: updated.manualAdjustmentAmount,
          finalAmount: updated.finalAmount,
          periodLabel,
        },
      );
      setAdjustmentState((prev) => {
        const copy = { ...prev };
        delete copy[preview.staffId];
        return copy;
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const renderAdjustmentControls = (preview: StaffCompensationPreview) => {
    const state = getAdjustmentForPreview(preview);
    const extras = computeStaffPayoutAdjustment(buildAdjustmentInput(preview));

    return (
      <div className="space-y-2 min-w-[11rem]">
        <label className="flex items-center gap-2 text-xs text-brand-text/80">
          <input
            type="radio"
            name={`adj-choice-${preview.staffId}`}
            checked={state.choice === 'none'}
            onChange={() =>
              setAdjustmentState((prev) => ({
                ...prev,
                [preview.staffId]: { ...defaultAdjustmentState(), choice: 'none' },
              }))
            }
          />
          No adjustments
        </label>
        <label className="flex items-center gap-2 text-xs text-brand-text/80">
          <input
            type="radio"
            name={`adj-choice-${preview.staffId}`}
            checked={state.choice === 'custom'}
            onChange={() =>
              setAdjustmentState((prev) => ({
                ...prev,
                [preview.staffId]: { ...getAdjustmentForPreview(preview), choice: 'custom' },
              }))
            }
          />
          Apply adjustments
        </label>
        {state.choice === 'custom' && (
          <div className="space-y-2 pl-4 border-l border-brand-border">
            <label className="flex items-center gap-2 text-xs text-brand-text/80">
              <input
                type="checkbox"
                checked={state.includeHourlyPay}
                onChange={(e) =>
                  setAdjustmentState((prev) => ({
                    ...prev,
                    [preview.staffId]: {
                      ...getAdjustmentForPreview(preview),
                      choice: 'custom',
                      includeHourlyPay: e.target.checked,
                    },
                  }))
                }
              />
              Add hourly pay ({formatCompensationMoney(extras.hourlyAmount)})
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="uber-input w-full"
              value={state.manualAdjustment === 0 ? '' : state.manualAdjustment}
              placeholder="Manual bonus (add only)"
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                setAdjustmentState((prev) => ({
                  ...prev,
                  [preview.staffId]: {
                    ...getAdjustmentForPreview(preview),
                    choice: 'custom',
                    manualAdjustment: value,
                  },
                }));
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderPayoutStatus = (preview: StaffCompensationPreview) => {
    const payout = preview.existingPayout;
    if (!payout) {
      return <span className="text-xs text-brand-text/60">Processing instant payout…</span>;
    }
    if (isPayoutAwaitingAdjustments(payout)) {
      return (
        <span className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
          Base paid · Awaiting adjustments
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        Finalized
      </span>
    );
  };

  const timeTrackerBlock = currentStaffMember && (
    <div className="rounded-lg border border-brand-border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-text">Active time tracker</p>
          <p className="text-xs text-brand-text/60">
            Clock in when you start work and clock out when finished. Tracked hours can be added to pay by a
            Director or Founder after your instant revenue-share payout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {myActiveEntry ? (
            <>
              <span className="text-sm font-mono text-emerald-700 dark:text-emerald-300">
                On duty · {formatElapsedDuration(elapsedActiveSessionSeconds(myActiveEntry, new Date(nowTick)))}
              </span>
              <GuardrButton kind="secondary" size="compact" disabled={clockBusy} onClick={() => void handleClockOut()}>
                {clockBusy ? 'Clocking out…' : 'Clock out'}
              </GuardrButton>
            </>
          ) : (
            <GuardrButton kind="primary" size="compact" disabled={clockBusy} onClick={() => void handleClockIn()}>
              {clockBusy ? 'Clocking in…' : 'Clock in'}
            </GuardrButton>
          )}
        </div>
      </div>
      <p className="text-sm text-brand-text/75">
        Your tracked hours this period:{' '}
        <strong className="text-brand-text">
          {formatTrackedHours(trackedHoursByStaffId[currentUser.id] ?? 0)}
        </strong>
        {viewerStaffRole ? (
          <>
            {' '}
            · Hourly rate:{' '}
            <strong className="text-brand-text">{formatCompensationMoney(previews[0]?.hourlyPayRate ?? 0)}/hr</strong>
          </>
        ) : null}
      </p>
      {canManage && activeStaffSessions.length > 0 && (
        <div className="text-xs text-brand-text/60 space-y-1">
          <p className="font-semibold uppercase tracking-wide text-brand-text/65">Currently on duty</p>
          {activeStaffSessions.map((entry) => (
            <p key={entry.id}>
              {entry.staffName} · {formatElapsedDuration(elapsedActiveSessionSeconds(entry, new Date(nowTick)))}
            </p>
          ))}
        </div>
      )}
    </div>
  );

  const summaryBlock = (
    <div className="space-y-2 text-sm text-brand-text/75 leading-relaxed">
      <p>
        <strong className="text-brand-text">Revenue-share compensation</strong> — contractor-style payouts (not W-2
        payroll) from <strong className="text-brand-text">collected platform fees</strong>. Revenue-share base pay
        is released <strong className="text-brand-text">instantly</strong> when earned.
      </p>
      <p>
        Current {config.cadence} period: <strong className="text-brand-text">{periodLabel}</strong>
      </p>
      <p>
        Platform fees this period: <strong className="text-brand-text">{formatCompensationMoney(periodFees)}</strong>
        {' · '}
        Total role allocation: <strong className="text-brand-text">{formatCompensationPercent(rolePercentTotal)}</strong>
      </p>
      {!config.enabled && (
        <p className="text-amber-700 dark:text-amber-300">Staff compensation is currently disabled in payment settings.</p>
      )}
      {canManage ? (
        <p className="text-xs text-brand-text/60">
          After instant base pay, confirm adjustments per staff member: choose <strong>No adjustments</strong>, or
          apply tracked hourly pay and/or a manual bonus. Deductions are not permitted (Prop 22–ready add-only model).
        </p>
      ) : (
        <p className="text-xs text-brand-text/60">
          Your revenue share pays out instantly. Clock in/out above to track hours. Directors or Founders review
          optional add-ons afterward.
        </p>
      )}
    </div>
  );

  const renderPreviewRow = (preview: StaffCompensationPreview) => {
    const payout = preview.existingPayout;
    const total = computePreviewTotal(preview);
    const busy = confirmingId === preview.staffId;
    const awaiting = payout ? isPayoutAwaitingAdjustments(payout) : false;

    return (
      <tr key={preview.staffId}>
        <td>
          <div className="font-medium text-brand-text">{preview.staffName}</div>
          <div className="text-xs text-brand-text/60">{preview.staffEmail}</div>
        </td>
        <td>{preview.staffRole}</td>
        <td>
          <div>{formatCompensationPercent(preview.rolePercent)}</div>
          <div className="text-xs text-brand-text/60">
            {formatTrackedHours(preview.trackedHours)} @ {formatCompensationMoney(preview.hourlyPayRate)}/hr
          </div>
        </td>
        <td>{formatCompensationMoney(payout?.baseAmount ?? preview.cappedBaseAmount)}</td>
        <td>
          {canConfirm && awaiting ? (
            renderAdjustmentControls(preview)
          ) : payout && resolvePayoutStatus(payout) === 'finalized' ? (
            <div className="text-xs space-y-1">
              {payout.adjustmentChoice === 'none' ? <div>No adjustments</div> : null}
              {(payout.hourlyAmount ?? 0) > 0 ? <div>Hourly: {formatCompensationMoney(payout.hourlyAmount ?? 0)}</div> : null}
              {(payout.manualAdjustmentAmount ?? 0) > 0 ? (
                <div>Bonus: {formatCompensationMoney(payout.manualAdjustmentAmount ?? 0)}</div>
              ) : null}
            </div>
          ) : (
            <span className="text-xs text-brand-text/60">—</span>
          )}
        </td>
        <td className="font-medium">{formatCompensationMoney(total)}</td>
        <td>
          <div className="space-y-2">
            {renderPayoutStatus(preview)}
            {canConfirm && awaiting ? (
              <GuardrButton
                kind="primary"
                size="compact"
                disabled={!config.enabled || busy}
                onClick={() => void handleConfirmAdjustments(preview)}
              >
                {busy ? 'Confirming…' : 'Confirm adjustments'}
              </GuardrButton>
            ) : null}
          </div>
        </td>
      </tr>
    );
  };

  const payoutTable = (
    <div className="adm-table-wrap rounded-lg border border-brand-border overflow-x-auto">
      <table className="adm-table w-full text-sm min-w-[54rem]">
        <thead>
          <tr>
            <th>Staff</th>
            <th>Role</th>
            <th>Share / hours</th>
            <th>Instant base</th>
            <th>Adjustments</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="text-brand-text/60">
                Loading payout data…
              </td>
            </tr>
          ) : previews.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-brand-text/60">
                {viewerStaffRole ? 'No compensation preview for this period.' : 'No eligible staff found.'}
              </td>
            </tr>
          ) : (
            previews.map(renderPreviewRow)
          )}
        </tbody>
      </table>
    </div>
  );

  const historyTable = history.length > 0 && (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-brand-text">Recent payouts</h4>
      <div className="adm-table-wrap rounded-lg border border-brand-border overflow-x-auto">
        <table className="adm-table w-full text-sm min-w-[44rem]">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Period</th>
              <th>Instant base</th>
              <th>Hourly</th>
              <th>Bonus</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="font-medium text-brand-text">{row.staffName}</div>
                  <div className="text-xs text-brand-text/60">{row.staffRole}</div>
                </td>
                <td>{formatCompensationPeriodLabel(row.periodStart, row.periodEnd, config.cadence)}</td>
                <td>{formatCompensationMoney(row.baseAmount)}</td>
                <td>{formatCompensationMoney(row.hourlyAmount ?? 0)}</td>
                <td>{formatCompensationMoney(row.manualAdjustmentAmount ?? 0)}</td>
                <td className="font-medium">{formatCompensationMoney(row.finalAmount)}</td>
                <td className="text-xs text-brand-text/60">
                  {resolvePayoutStatus(row) === 'finalized' ? 'Finalized' : 'Base paid'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const body = (
    <div className="space-y-6">
      {timeTrackerBlock ? <StaffMgmtSection title="Time tracker">{timeTrackerBlock}</StaffMgmtSection> : null}
      <StaffMgmtSection title="Current period">{summaryBlock}</StaffMgmtSection>
      <StaffMgmtSection title={canManage ? 'Staff payouts' : 'Your compensation'} fullWidth>
        {payoutTable}
      </StaffMgmtSection>
      {historyTable ? <StaffMgmtSection title="Payout history">{historyTable}</StaffMgmtSection> : null}
    </div>
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-compensation-panel adm-finance-page"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Finance"
            subtitle="Instant revenue-share, tracked hourly pay, and post-payout adjustments."
          />
        }
      >
        {body}
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell className="staff-compensation-panel staff-mgmt-panel">
      <div className="staff-payment-settings-scroll min-w-0 space-y-4">
        {timeTrackerBlock ? <AppFormSection title="Time tracker">{timeTrackerBlock}</AppFormSection> : null}
        <AppFormSection title="Current period">{summaryBlock}</AppFormSection>
        <AppFormSection title={canManage ? 'Staff payouts' : 'Your compensation'}>{payoutTable}</AppFormSection>
        {historyTable ? <AppFormSection title="Payout history">{historyTable}</AppFormSection> : null}
      </div>
    </StaffOpsPageShell>
  );
}
