import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import {
  buildStaffCompensationPreviews,
  formatCompensationMoney,
  formatCompensationPercent,
  formatCompensationPeriodLabel,
  getCompensationPeriodBounds,
  totalRolePercent,
  type StaffCompensationPayout,
  type StaffCompensationPreview,
} from '../../lib/staffCompensation';
import {
  loadStaffCompensationPayouts,
  persistStaffCompensationPayout,
} from '../../lib/staffCompensationStorage';
import { PlatformSettings } from '../../lib/platformSettings';
import {
  canConfirmStaffCompensationPayout,
  canManageStaffCompensation,
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

function finalPayoutAmount(preview: StaffCompensationPreview, adjustment: number): number {
  return Math.round((preview.cappedBaseAmount + adjustment) * 100) / 100;
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

  const [payouts, setPayouts] = useState<StaffCompensationPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { periodStart, periodEnd } = useMemo(
    () => getCompensationPeriodBounds(config.cadence),
    [config.cadence],
  );

  useEffect(() => {
    let active = true;
    void loadStaffCompensationPayouts().then((rows) => {
      if (active) {
        setPayouts(rows);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const allPreviews = useMemo(
    () =>
      buildStaffCompensationPreviews({
        guards,
        requests,
        config,
        payouts,
        periodStart,
        periodEnd,
      }),
    [guards, requests, config, payouts, periodStart, periodEnd],
  );

  const previews = useMemo(() => {
    if (canManage) return allPreviews;
    return allPreviews.filter((preview) => preview.staffId === currentUser.id);
  }, [allPreviews, canManage, currentUser.id]);

  const periodLabel = formatCompensationPeriodLabel(periodStart, periodEnd, config.cadence);
  const periodFees = allPreviews[0]?.platformFeesInPeriod ?? 0;
  const rolePercentTotal = totalRolePercent(config);

  const history = useMemo(() => {
    const rows = canManage
      ? payouts
      : payouts.filter((p) => p.staffId === currentUser.id);
    return rows.slice(0, 20);
  }, [payouts, canManage, currentUser.id]);

  const handleConfirm = async (preview: StaffCompensationPreview) => {
    if (!canConfirm || preview.existingPayout) return;
    const adjustment = adjustments[preview.staffId] ?? 0;
    const finalAmount = finalPayoutAmount(preview, adjustment);
    if (finalAmount < 0) return;

    setConfirmingId(preview.staffId);
    try {
      const payout: StaffCompensationPayout = {
        id: `scpay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        staffId: preview.staffId,
        staffName: preview.staffName,
        staffEmail: preview.staffEmail,
        staffRole: preview.staffRole,
        periodStart,
        periodEnd,
        platformFeesInPeriod: preview.platformFeesInPeriod,
        baseAmount: preview.cappedBaseAmount,
        adjustmentAmount: adjustment,
        finalAmount,
        confirmedById: currentUser.id,
        confirmedByEmail: currentUser.email,
        confirmedAt: new Date().toISOString(),
        note: notes[preview.staffId]?.trim() || undefined,
      };
      const next = await persistStaffCompensationPayout(payout);
      setPayouts(next);
      await writeAuditLog(currentUser, 'staff_compensation_payout_confirmed', 'staff_compensation', payout.id, {
        staffId: payout.staffId,
        staffName: payout.staffName,
        finalAmount: payout.finalAmount,
        periodLabel,
      });
      setAdjustments((prev) => {
        const copy = { ...prev };
        delete copy[preview.staffId];
        return copy;
      });
      setNotes((prev) => {
        const copy = { ...prev };
        delete copy[preview.staffId];
        return copy;
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const summaryBlock = (
    <div className="space-y-2 text-sm text-brand-text/75 leading-relaxed">
      <p>
        <strong className="text-brand-text">Revenue-share compensation</strong> — contractor-style payouts
        (not W-2 payroll) drawn from <strong className="text-brand-text">collected platform fees</strong> only.
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
        <p className="text-amber-700 dark:text-amber-300">
          Staff compensation is currently disabled in payment settings.
        </p>
      )}
      {canManage ? (
        <p className="text-xs text-brand-text/60">
          Review each staff member below and click Confirm payment to release their share. Use the adjustment field
          to add or subtract from the calculated amount.
        </p>
      ) : (
        <p className="text-xs text-brand-text/60">
          Your share is calculated from your role&apos;s percentage of this period&apos;s platform fees.
          Payouts are released when a Director or Founder confirms payment.
        </p>
      )}
    </div>
  );

  const renderPreviewRow = (preview: StaffCompensationPreview) => {
    const adjustment = adjustments[preview.staffId] ?? 0;
    const total = finalPayoutAmount(preview, adjustment);
    const paid = Boolean(preview.existingPayout);
    const busy = confirmingId === preview.staffId;

    return (
      <tr key={preview.staffId}>
        <td>
          <div className="font-medium text-brand-text">{preview.staffName}</div>
          <div className="text-xs text-brand-text/60">{preview.staffEmail}</div>
        </td>
        <td>{preview.staffRole}</td>
        <td>{formatCompensationPercent(preview.rolePercent)}</td>
        <td>{formatCompensationMoney(preview.cappedBaseAmount)}</td>
        <td>
          {canConfirm && !paid ? (
            <input
              type="number"
              step={0.01}
              className="uber-input w-24"
              value={adjustment === 0 ? '' : adjustment}
              placeholder="0.00"
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                setAdjustments((prev) => ({ ...prev, [preview.staffId]: value }));
              }}
            />
          ) : (
            formatCompensationMoney(preview.existingPayout?.adjustmentAmount ?? 0)
          )}
        </td>
        <td className="font-medium">{paid ? formatCompensationMoney(preview.alreadyPaidAmount) : formatCompensationMoney(total)}</td>
        <td>
          {paid ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Paid
            </span>
          ) : canConfirm ? (
            <GuardrButton
              kind="primary"
              size="compact"
              disabled={!config.enabled || busy || total < 0}
              onClick={() => void handleConfirm(preview)}
            >
              {busy ? 'Confirming…' : 'Confirm payment'}
            </GuardrButton>
          ) : (
            <span className="text-xs text-brand-text/60">Awaiting confirmation</span>
          )}
        </td>
      </tr>
    );
  };

  const payoutTable = (
    <div className="adm-table-wrap rounded-lg border border-brand-border overflow-x-auto">
      <table className="adm-table w-full text-sm min-w-[48rem]">
        <thead>
          <tr>
            <th>Staff</th>
            <th>Role</th>
            <th>Share</th>
            <th>Calculated</th>
            <th>Adjustment</th>
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
        <table className="adm-table w-full text-sm min-w-[40rem]">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Period</th>
              <th>Base</th>
              <th>Adjustment</th>
              <th>Paid</th>
              <th>Confirmed</th>
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
                <td>{formatCompensationMoney(row.adjustmentAmount)}</td>
                <td className="font-medium">{formatCompensationMoney(row.finalAmount)}</td>
                <td className="text-xs text-brand-text/60">
                  {new Date(row.confirmedAt).toLocaleString()}
                  <div>{row.confirmedByEmail}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-compensation-panel adm-finance-page"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Finance"
            subtitle="Staff revenue-share payouts from collected platform fees."
          />
        }
      >
        <div className="space-y-6">
          <StaffMgmtSection title="Current period">{summaryBlock}</StaffMgmtSection>
          <StaffMgmtSection title={canManage ? 'Staff payouts' : 'Your compensation'} fullWidth>
            {payoutTable}
          </StaffMgmtSection>
          {historyTable ? <StaffMgmtSection title="Payout history">{historyTable}</StaffMgmtSection> : null}
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell className="staff-compensation-panel staff-mgmt-panel">
      <div className="staff-payment-settings-scroll min-w-0 space-y-4">
        <AppFormSection title="Current period">{summaryBlock}</AppFormSection>
        <AppFormSection title={canManage ? 'Staff payouts' : 'Your compensation'}>{payoutTable}</AppFormSection>
        {historyTable ? <AppFormSection title="Payout history">{historyTable}</AppFormSection> : null}
      </div>
    </StaffOpsPageShell>
  );
}
