import React, { useEffect, useMemo, useState } from 'react';
import { SessionUser } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import { canManageStaffCompensation, canEditStaffHourlyPayRates } from '../../lib/permissions';
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
import { useLayoutFormFactor } from '../../surfaces';
import { StaffMgmtSection } from './StaffMgmtSection';
import { FinanceSettingsSaveRow } from './staffFinanceSettingsControls';

interface StaffCompensationSettingsProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
}

export function StaffCompensationSettings({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
}: StaffCompensationSettingsProps) {
  const formFactor = useLayoutFormFactor();
  const canEditCompensation = canManageStaffCompensation(currentUser);
  const canEditHourlyRates = canEditStaffHourlyPayRates(currentUser);
  const [compDraft, setCompDraft] = useState<StaffCompensationConfig>(
    normalizeStaffCompensationConfig(platformSettings.staffCompensation),
  );
  const [savingCompensation, setSavingCompensation] = useState(false);

  useEffect(() => {
    setCompDraft(normalizeStaffCompensationConfig(platformSettings.staffCompensation));
  }, [platformSettings.staffCompensation]);

  const compDirty = useMemo(
    () =>
      JSON.stringify(compDraft) !==
      JSON.stringify(normalizeStaffCompensationConfig(platformSettings.staffCompensation)),
    [compDraft, platformSettings.staffCompensation],
  );

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

  const updateRoleRule = (
    role: (typeof COMPENSATABLE_STAFF_ROLES)[number],
    patch: Partial<StaffRoleCompensationRule>,
  ) => {
    setCompDraft((prev) => ({
      ...prev,
      roleRules: {
        ...prev.roleRules,
        [role]: { ...prev.roleRules[role], ...patch },
      },
    }));
  };

  const body = (
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

      {canEditCompensation || canEditHourlyRates ? (
        <FinanceSettingsSaveRow
          label={canEditCompensation ? 'Save staff compensation' : 'Save hourly pay rates'}
          busyLabel="Saving…"
          busy={savingCompensation}
          disabled={!compDirty}
          dirty={compDirty}
          onSave={() => void persistCompensationSettings()}
          onDiscard={() =>
            setCompDraft(normalizeStaffCompensationConfig(platformSettings.staffCompensation))
          }
        />
      ) : (
        <p className="text-xs text-brand-text/60">
          Revenue-share rules require Director or Founder. Hourly pay rates require Manager or above.
        </p>
      )}
    </div>
  );

  if (formFactor === 'desktop') {
    return <StaffMgmtSection title="Pay rules">{body}</StaffMgmtSection>;
  }

  return <AppFormSection title="Pay rules">{body}</AppFormSection>;
}
