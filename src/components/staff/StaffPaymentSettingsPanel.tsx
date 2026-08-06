import React, { useEffect, useMemo, useState } from 'react';
import { SessionUser } from '../../types';
import {
  feePreviewRates,
  platformFeeModelLabel,
  resolvePlatformFeePerHour,
  type PlatformFeeConfig,
  type PlatformFeeModel,
} from '../../lib/payments';
import {
  PlatformSettings,
} from '../../lib/platformSettings';
import { hasExecutivePaymentControls, canManageStaffCompensation, canEditStaffHourlyPayRates } from '../../lib/permissions';
import {
  COMPENSATABLE_STAFF_ROLES,
  formatCompensationPercent,
  normalizeStaffCompensationConfig,
  totalRolePercent,
  type StaffCompensationCadence,
  type StaffCompensationConfig,
  type StaffRoleCompensationRule,
} from '../../lib/staffCompensation';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';
import { GuardrButton } from '../baseui/GuardrButton';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { StaffMgmtSection } from './StaffMgmtSection';
import { StaffOpsPageShell } from './StaffOpsPageShell';

interface StaffPaymentSettingsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
}

function FeePreviewTable({ config }: { config: PlatformFeeConfig }) {
  const rates = feePreviewRates();
  return (
    <div className="adm-table-wrap staff-payment-settings-table rounded-lg border border-brand-border overflow-x-auto">
      <table className="adm-table w-full text-sm min-w-[18rem]">
        <thead>
          <tr>
            <th>Client rate</th>
            <th>Platform fee</th>
            <th>Guard receives</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => {
            const fee = resolvePlatformFeePerHour(rate, config);
            return (
              <tr key={rate}>
                <td>${rate}/hr</td>
                <td className="font-medium text-brand-text">${fee}/hr</td>
                <td>${Math.max(0, rate - fee)}/hr</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DesktopSettingsCard({
  title,
  children,
  className = '',
  fullWidth = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <StaffMgmtSection title={title} className={className} fullWidth={fullWidth}>
      {children}
    </StaffMgmtSection>
  );
}

function MobileSaveButton({
  label,
  busyLabel,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="staff-payment-settings-save"
      disabled={disabled || busy}
      onClick={onClick}
    >
      {busy ? busyLabel : label}
    </button>
  );
}

export function StaffPaymentSettingsPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
}: StaffPaymentSettingsPanelProps) {
  const { formFactor } = useDevice();
  const canEditFees = hasExecutivePaymentControls(currentUser);
  const canEditCompensation = canManageStaffCompensation(currentUser);
  const canEditHourlyRates = canEditStaffHourlyPayRates(currentUser);
  const [feeDraft, setFeeDraft] = useState<PlatformFeeConfig>(platformSettings.feeConfig);
  const [savingFees, setSavingFees] = useState(false);
  const [crewPayBumpRate, setCrewPayBumpRate] = useState(
    platformSettings.crewTeamPayBumpPerHour ?? platformSettings.teamLeadBonusPerGuardPerHour ?? 1
  );
  const [savingCrewPayBump, setSavingCrewPayBump] = useState(false);
  const [compDraft, setCompDraft] = useState<StaffCompensationConfig>(
    normalizeStaffCompensationConfig(platformSettings.staffCompensation),
  );
  const [savingCompensation, setSavingCompensation] = useState(false);

  useEffect(() => {
    setFeeDraft(platformSettings.feeConfig);
  }, [platformSettings.feeConfig]);

  useEffect(() => {
    setCompDraft(normalizeStaffCompensationConfig(platformSettings.staffCompensation));
  }, [platformSettings.staffCompensation]);

  useEffect(() => {
    setCrewPayBumpRate(
      platformSettings.crewTeamPayBumpPerHour ?? platformSettings.teamLeadBonusPerGuardPerHour ?? 1
    );
  }, [platformSettings.crewTeamPayBumpPerHour, platformSettings.teamLeadBonusPerGuardPerHour]);

  const crewPayBumpDirty =
    crewPayBumpRate !==
    (platformSettings.crewTeamPayBumpPerHour ?? platformSettings.teamLeadBonusPerGuardPerHour ?? 1);

  const compDirty = useMemo(
    () => JSON.stringify(compDraft) !== JSON.stringify(normalizeStaffCompensationConfig(platformSettings.staffCompensation)),
    [compDraft, platformSettings.staffCompensation],
  );

  const feeDirty = useMemo(
    () => JSON.stringify(feeDraft) !== JSON.stringify(platformSettings.feeConfig),
    [feeDraft, platformSettings.feeConfig]
  );

  const persistFeeConfig = async () => {
    if (!onUpdatePlatformSettings || !canEditFees) return;
    setSavingFees(true);
    try {
      await onUpdatePlatformSettings({
        ...platformSettings,
        feeConfig: feeDraft,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingFees(false);
    }
  };

  const persistCrewPayBumpSettings = async () => {
    if (!onUpdatePlatformSettings || !canEditFees) return;
    setSavingCrewPayBump(true);
    try {
      const rate = Math.max(0, crewPayBumpRate);
      await onUpdatePlatformSettings({
        ...platformSettings,
        crewTeamPayBumpPerHour: rate,
        teamLeadBonusPerGuardPerHour: rate,
        teamLeadBonusClientSharePercent: 100,
        teamLeadBonusPlatformSharePercent: 0,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingCrewPayBump(false);
    }
  };

  const persistCompensationSettings = async () => {
    if (!onUpdatePlatformSettings) return;
    if (!canEditCompensation && !canEditHourlyRates) return;
    setSavingCompensation(true);
    try {
      const current = normalizeStaffCompensationConfig(platformSettings.staffCompensation);
      const nextConfig = canEditCompensation
        ? normalizeStaffCompensationConfig(compDraft)
        : normalizeStaffCompensationConfig({
            ...current,
            roleRules: Object.fromEntries(
              COMPENSATABLE_STAFF_ROLES.map((role) => [
                role,
                {
                  ...current.roleRules[role],
                  hourlyPayRate: compDraft.roleRules[role].hourlyPayRate,
                },
              ]),
            ) as StaffCompensationConfig['roleRules'],
          });
      await onUpdatePlatformSettings({
        ...platformSettings,
        staffCompensation: nextConfig,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingCompensation(false);
    }
  };

  const updateRoleRule = (role: typeof COMPENSATABLE_STAFF_ROLES[number], patch: Partial<StaffRoleCompensationRule>) => {
    setCompDraft((prev) => ({
      ...prev,
      roleRules: {
        ...prev.roleRules,
        [role]: { ...prev.roleRules[role], ...patch },
      },
    }));
  };

  const setFeeModel = (model: PlatformFeeModel) => {
    setFeeDraft((prev) => ({ ...prev, model }));
  };

  const platformFeesBody = (
    <div className="space-y-4 min-w-0">
      <p className="text-sm text-brand-text/70 leading-relaxed">
        Platform fees are based on the client charge — either a flat dollar amount per hour or a percentage
        of the hourly rate. Open-contract jobs can override these defaults per agreement.
      </p>

      <div className="grid grid-cols-1 gap-4 min-w-0">
        <div className="min-w-0">
          <label className="uber-label block mb-1">Fee type</label>
          <select
            className="uber-input w-full"
            value={feeDraft.model}
            onChange={(e) => setFeeModel(e.target.value as PlatformFeeModel)}
            disabled={!canEditFees}
          >
            <option value="flat">Flat rate ($/hr)</option>
            <option value="percent">Percentage of client charge</option>
          </select>
          <p className="text-xs text-brand-text/60 mt-1">{platformFeeModelLabel(feeDraft.model)}</p>
        </div>

        {feeDraft.model === 'flat' && (
          <div className="min-w-0">
            <label className="uber-label block mb-1">Fee per hour ($)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={feeDraft.flatFeePerHour}
              onChange={(e) =>
                setFeeDraft((prev) => ({
                  ...prev,
                  flatFeePerHour: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              readOnly={!canEditFees}
              className="uber-input w-full"
            />
          </div>
        )}

        {feeDraft.model === 'percent' && (
          <div className="min-w-0">
            <label className="uber-label block mb-1">Platform take (%)</label>
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={Math.round(feeDraft.percentRate * 1000) / 10}
              onChange={(e) =>
                setFeeDraft((prev) => ({
                  ...prev,
                  percentRate: Math.min(0.5, Math.max(0, (parseFloat(e.target.value) || 0) / 100)),
                }))
              }
              readOnly={!canEditFees}
              className="uber-input w-full"
            />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/65 mb-2">
          Preview at common client rates
        </p>
        <FeePreviewTable config={feeDraft} />
      </div>

      {canEditFees ? (
        <div className="staff-payment-settings-actions">
          {formFactor === 'desktop' ? (
            <>
              <GuardrButton
                kind="primary"
                size="compact"
                disabled={!feeDirty || savingFees}
                onClick={() => void persistFeeConfig()}
              >
                {savingFees ? 'Saving…' : 'Save fee settings'}
              </GuardrButton>
              {feeDirty && (
                <GuardrButton
                  kind="secondary"
                  size="compact"
                  onClick={() => setFeeDraft(platformSettings.feeConfig)}
                >
                  Discard changes
                </GuardrButton>
              )}
            </>
          ) : (
            <>
              <MobileSaveButton
                label="Save fee settings"
                busyLabel="Saving…"
                busy={savingFees}
                disabled={!feeDirty}
                onClick={() => void persistFeeConfig()}
              />
              {feeDirty && (
                <button
                  type="button"
                  className="staff-payment-settings-discard"
                  onClick={() => setFeeDraft(platformSettings.feeConfig)}
                >
                  Discard changes
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <p className="text-xs text-brand-text/60">Only Directors and Founders can edit platform fees.</p>
      )}
    </div>
  );

  const staffCompensationBody = (
    <div className="space-y-4 min-w-0">
      <p className="text-sm text-brand-text/70 leading-relaxed">
        Staff revenue-share is paid from collected platform fees only (contractor-style, not W-2 payroll).
        Revenue-share base pay is released instantly. Directors and Founders then confirm optional add-ons:
        tracked hourly pay and manual bonuses (add-only). Hourly rates are editable by Manager and above.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <label className="block space-y-1">
          <span className="uber-label">Compensation enabled</span>
          <select
            className="uber-input w-full"
            value={compDraft.enabled ? 'yes' : 'no'}
            disabled={!canEditCompensation}
            onChange={(e) => setCompDraft((prev) => ({ ...prev, enabled: e.target.value === 'yes' }))}
          >
            <option value="yes">Enabled</option>
            <option value="no">Disabled</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="uber-label">Payout cadence</span>
          <select
            className="uber-input w-full"
            value={compDraft.cadence}
            disabled={!canEditCompensation}
            onChange={(e) =>
              setCompDraft((prev) => ({ ...prev, cadence: e.target.value as StaffCompensationCadence }))
            }
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-brand-text/60">
        Total role allocation: {formatCompensationPercent(totalRolePercent(compDraft))}
      </p>

      <div className="adm-table-wrap rounded-lg border border-brand-border overflow-x-auto">
        <table className="adm-table w-full text-sm min-w-[36rem]">
          <thead>
            <tr>
              <th>Role</th>
              <th>% of fees</th>
              <th>Floor / period</th>
              <th>Cap / period</th>
              <th>Hourly pay</th>
            </tr>
          </thead>
          <tbody>
            {COMPENSATABLE_STAFF_ROLES.map((role) => {
              const rule = compDraft.roleRules[role];
              return (
                <tr key={role}>
                  <td>{role}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className="uber-input w-24"
                      disabled={!canEditCompensation}
                      value={Math.round(rule.percentOfFees * 1000) / 10}
                      onChange={(e) =>
                        updateRoleRule(role, {
                          percentOfFees: Math.min(1, Math.max(0, (parseFloat(e.target.value) || 0) / 100)),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="uber-input w-24"
                      disabled={!canEditCompensation}
                      value={rule.floorPerPeriod}
                      onChange={(e) =>
                        updateRoleRule(role, { floorPerPeriod: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="uber-input w-24"
                      disabled={!canEditCompensation}
                      value={rule.capPerPeriod}
                      onChange={(e) =>
                        updateRoleRule(role, { capPerPeriod: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={0.25}
                      className="uber-input w-24"
                      disabled={!canEditHourlyRates}
                      value={rule.hourlyPayRate}
                      onChange={(e) =>
                        updateRoleRule(role, { hourlyPayRate: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(canEditCompensation || canEditHourlyRates) ? (
        formFactor === 'desktop' ? (
          <div className="staff-payment-settings-actions">
            <GuardrButton
              kind="primary"
              size="compact"
              disabled={!compDirty || savingCompensation}
              onClick={() => void persistCompensationSettings()}
            >
              {savingCompensation ? 'Saving…' : canEditCompensation ? 'Save staff compensation' : 'Save hourly pay rates'}
            </GuardrButton>
            {compDirty && (
              <GuardrButton
                kind="secondary"
                size="compact"
                onClick={() =>
                  setCompDraft(normalizeStaffCompensationConfig(platformSettings.staffCompensation))
                }
              >
                Discard changes
              </GuardrButton>
            )}
          </div>
        ) : (
          <div className="staff-payment-settings-actions">
            <MobileSaveButton
              label={canEditCompensation ? 'Save staff compensation' : 'Save hourly pay rates'}
              busyLabel="Saving…"
              busy={savingCompensation}
              disabled={!compDirty}
              onClick={() => void persistCompensationSettings()}
            />
          </div>
        )
      ) : (
        <p className="text-xs text-brand-text/60">
          Revenue-share rules require Director or Founder. Hourly pay rates require Manager or above.
        </p>
      )}
    </div>
  );

  const crewPayBumpBody = (
    <div className="space-y-4 min-w-0">
      <p className="text-sm text-brand-text/70 leading-relaxed">
        Each guard rostered on a coordinated crew for that specific job earns this extra amount per hour.
        Independent applicants and guards on other jobs do not receive it.
      </p>
      <div className="grid grid-cols-1 gap-4 max-w-lg min-w-0">
        <label className="block space-y-1 min-w-0">
          <span className="uber-label">Extra pay per crew guard / hour</span>
          <input
            type="number"
            min={0}
            step={0.25}
            value={crewPayBumpRate}
            disabled={!canEditFees}
            onChange={(e) => setCrewPayBumpRate(Number(e.target.value))}
            className="uber-input w-full"
          />
        </label>
      </div>
      {canEditFees ? (
        formFactor === 'desktop' ? (
          <GuardrButton
            kind="primary"
            size="compact"
            disabled={!crewPayBumpDirty || savingCrewPayBump}
            onClick={() => void persistCrewPayBumpSettings()}
          >
            {savingCrewPayBump ? 'Saving…' : 'Save crew pay bump'}
          </GuardrButton>
        ) : (
          <div className="staff-payment-settings-actions">
            <MobileSaveButton
              label="Save crew pay bump"
              busyLabel="Saving…"
              busy={savingCrewPayBump}
              disabled={!crewPayBumpDirty}
              onClick={() => void persistCrewPayBumpSettings()}
            />
          </div>
        )
      ) : (
        <p className="text-xs text-brand-text/60">Only Directors and Founders can edit crew pay settings.</p>
      )}
    </div>
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-finance-page adm-payment-settings-page"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Finance"
            subtitle="Platform fees, staff compensation, and crew pay defaults."
          />
        }
      >
        <div className="adm-payment-settings-grid adm-payment-settings-grid--split">
          <DesktopSettingsCard title="Platform fees">
            {platformFeesBody}
          </DesktopSettingsCard>
          <DesktopSettingsCard title="Staff compensation" fullWidth>
            {staffCompensationBody}
          </DesktopSettingsCard>
          <DesktopSettingsCard title="Crew team pay bump" fullWidth>
            {crewPayBumpBody}
          </DesktopSettingsCard>
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell className="staff-payment-settings-panel staff-mgmt-panel staff-roster-panel">
      <div className="staff-payment-settings-scroll min-w-0">
        <AppFormSection title="Platform fees">{platformFeesBody}</AppFormSection>
        <AppFormSection title="Staff compensation">{staffCompensationBody}</AppFormSection>
        <AppFormSection title="Crew team pay bump">{crewPayBumpBody}</AppFormSection>
      </div>
    </StaffOpsPageShell>
  );
}
