import React, { useEffect, useMemo, useState } from 'react';
import { SessionUser, StaffRole } from '../../types';
import {
  feePreviewRates,
  platformFeeModelLabel,
  resolvePlatformFeePerHour,
  type PlatformFeeConfig,
  type PlatformFeeModel,
} from '../../lib/payments';
import {
  PlatformSettings,
  platformPaymentModeDescription,
  platformPaymentModeLabel,
  TIERED_PLATFORM_FEE_PRESET,
} from '../../lib/platformSettings';
import {
  canManagePlatformSettings,
  getAssignableStaffRoles,
  hasExecutivePaymentControls,
} from '../../lib/permissions';
import { StaffRolesReference } from './RolePermissionsGuide';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { StaffAddStaffForm } from './StaffAddStaffForm';
import { showAppToast } from '../ui/AppToast';
import { StaffLegalCompliancePanel } from './StaffLegalCompliancePanel';
import type { LegalAcceptanceRecord } from '../../lib/legalAcceptance';
import type { Client, SecurityGuard } from '../../types';

interface StaffSettingsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
  showStaffOnboard: boolean;
  onAddStaffProfile: (
    name: string,
    email: string,
    badgeNumber: string,
    staffRole: StaffRole
  ) => Promise<string>;
  guards: SecurityGuard[];
  clients: Client[];
  legalAcceptances: LegalAcceptanceRecord[];
}

function FeePreviewTable({ config }: { config: PlatformFeeConfig }) {
  const rates = feePreviewRates();
  return (
    <div className="rounded-xl border border-brand-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand-surface-elevated text-left text-xs uppercase tracking-wide text-brand-text-muted">
            <th className="px-3 py-2 font-semibold">Client rate</th>
            <th className="px-3 py-2 font-semibold">Platform fee</th>
            <th className="px-3 py-2 font-semibold">Guard receives</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => {
            const fee = resolvePlatformFeePerHour(rate, config);
            return (
              <tr key={rate} className="border-t border-brand-border">
                <td className="px-3 py-2">${rate}/hr</td>
                <td className="px-3 py-2 font-medium text-brand-primary">${fee}/hr</td>
                <td className="px-3 py-2">${Math.max(0, rate - fee)}/hr</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StaffSettingsPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
  showStaffOnboard,
  onAddStaffProfile,
  guards,
  clients,
  legalAcceptances,
}: StaffSettingsPanelProps) {
  const assignableRoles = getAssignableStaffRoles(currentUser.role);
  const canEditPaymentModes = canManagePlatformSettings(currentUser);
  const canEditFees = hasExecutivePaymentControls(currentUser);
  const [cashEnabled, setCashEnabled] = useState(platformSettings.paymentCashEnabled);
  const [stripeEnabled, setStripeEnabled] = useState(platformSettings.paymentStripeEnabled);
  const [savingModes, setSavingModes] = useState(false);
  const [feeDraft, setFeeDraft] = useState<PlatformFeeConfig>(platformSettings.feeConfig);
  const [savingFees, setSavingFees] = useState(false);
  const [crewPayBumpRate, setCrewPayBumpRate] = useState(
    platformSettings.crewTeamPayBumpPerHour ?? platformSettings.teamLeadBonusPerGuardPerHour ?? 1
  );
  const [savingCrewPayBump, setSavingCrewPayBump] = useState(false);

  useEffect(() => {
    setCashEnabled(platformSettings.paymentCashEnabled);
    setStripeEnabled(platformSettings.paymentStripeEnabled);
  }, [platformSettings.paymentCashEnabled, platformSettings.paymentStripeEnabled]);

  useEffect(() => {
    setFeeDraft(platformSettings.feeConfig);
  }, [platformSettings.feeConfig]);

  useEffect(() => {
    setCrewPayBumpRate(
      platformSettings.crewTeamPayBumpPerHour ?? platformSettings.teamLeadBonusPerGuardPerHour ?? 1
    );
  }, [platformSettings.crewTeamPayBumpPerHour, platformSettings.teamLeadBonusPerGuardPerHour]);

  const crewPayBumpDirty =
    crewPayBumpRate !==
    (platformSettings.crewTeamPayBumpPerHour ?? platformSettings.teamLeadBonusPerGuardPerHour ?? 1);

  const feeDirty = useMemo(
    () => JSON.stringify(feeDraft) !== JSON.stringify(platformSettings.feeConfig),
    [feeDraft, platformSettings.feeConfig]
  );

  const persistPaymentModes = async (nextCash: boolean, nextStripe: boolean) => {
    if (!onUpdatePlatformSettings) return;
    if (!nextCash && !nextStripe) {
      showAppToast('Enable at least one payment method.', { tone: 'error' });
      return;
    }
    setSavingModes(true);
    try {
      await onUpdatePlatformSettings({
        ...platformSettings,
        paymentCashEnabled: nextCash,
        paymentStripeEnabled: nextStripe,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingModes(false);
    }
  };

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

  const toggleCash = async () => {
    if (!canEditPaymentModes || savingModes) return;
    const next = !cashEnabled;
    setCashEnabled(next);
    await persistPaymentModes(next, stripeEnabled);
  };

  const toggleStripe = async () => {
    if (!canEditPaymentModes || savingModes) return;
    const next = !stripeEnabled;
    setStripeEnabled(next);
    await persistPaymentModes(cashEnabled, next);
  };

  const setFeeModel = (model: PlatformFeeModel) => {
    setFeeDraft((prev) => ({ ...prev, model }));
  };

  const updateTier = (index: number, field: 'minHourlyRate' | 'feePerHour', value: number) => {
    setFeeDraft((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)),
    }));
  };

  const canViewLegalCompliance = hasExecutivePaymentControls(currentUser);

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      {canViewLegalCompliance && (
        <StaffLegalCompliancePanel
          guards={guards}
          clients={clients}
          legalAcceptances={legalAcceptances}
        />
      )}

      <AppFormSection title="Payment methods">
        <div className="pb-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
            Current mode: {platformPaymentModeLabel(platformSettings)}
          </p>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            {platformPaymentModeDescription(platformSettings)}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 rounded-xl border border-brand-border p-4 ${
                canEditPaymentModes ? 'cursor-pointer' : 'opacity-90'
              }`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={stripeEnabled}
                onChange={() => void toggleStripe()}
                disabled={!canEditPaymentModes || savingModes}
              />
              <span className="text-sm font-semibold">Card (Stripe)</span>
            </label>
          </div>
          {!canEditPaymentModes && (
            <p className="text-xs text-brand-text-muted">
              Only the Founder can change payment methods.
            </p>
          )}
        </div>
      </AppFormSection>

      <AppFormSection title="Platform fees">
        <div className="pb-6 space-y-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="uber-label block mb-1">Fee model</label>
              <select
                className="uber-input w-full"
                value={feeDraft.model}
                onChange={(e) => setFeeModel(e.target.value as PlatformFeeModel)}
                disabled={!canEditFees}
              >
                <option value="flat">Flat rate ($/hr)</option>
                <option value="tiered">Tiered by client hourly rate</option>
                <option value="percent">Percentage with min/max cap</option>
              </select>
              <p className="text-xs text-brand-text-muted mt-1">
                {platformFeeModelLabel(feeDraft.model)}
              </p>
            </div>

            {feeDraft.model === 'flat' && (
              <div>
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
              <>
                <div>
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
                <div>
                  <label className="uber-label block mb-1">Min fee / hr ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={feeDraft.minFeePerHour}
                    onChange={(e) =>
                      setFeeDraft((prev) => ({
                        ...prev,
                        minFeePerHour: Math.max(0, parseFloat(e.target.value) || 0),
                      }))
                    }
                    readOnly={!canEditFees}
                    className="uber-input w-full"
                  />
                </div>
                <div>
                  <label className="uber-label block mb-1">Max fee / hr ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={feeDraft.maxFeePerHour}
                    onChange={(e) =>
                      setFeeDraft((prev) => ({
                        ...prev,
                        maxFeePerHour: Math.max(prev.minFeePerHour, parseFloat(e.target.value) || 0),
                      }))
                    }
                    readOnly={!canEditFees}
                    className="uber-input w-full"
                  />
                </div>
              </>
            )}
          </div>

          {feeDraft.model === 'tiered' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                  Rate tiers (highest matching band wins)
                </p>
                {canEditFees && (
                  <button
                    type="button"
                    className="text-xs text-brand-primary font-semibold"
                    onClick={() => setFeeDraft({ ...TIERED_PLATFORM_FEE_PRESET })}
                  >
                    Reset to recommended tiers
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {feeDraft.tiers.map((tier, index) => (
                  <div key={`tier-${index}`} className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="uber-label block mb-1">From client rate ($/hr)</label>
                        <input
                          type="number"
                          min={0}
                          value={tier.minHourlyRate}
                          onChange={(e) =>
                            updateTier(index, 'minHourlyRate', Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          readOnly={!canEditFees}
                          className="uber-input w-full"
                        />
                      </div>
                      <div>
                        <label className="uber-label block mb-1">Platform fee ($/hr)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={tier.feePerHour}
                          onChange={(e) =>
                            updateTier(index, 'feePerHour', Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          readOnly={!canEditFees}
                          className="uber-input w-full"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted mb-2">
              Preview at common client rates
            </p>
            <FeePreviewTable config={feeDraft} />
          </div>

          {canEditFees ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="app-button-primary !w-auto !h-10 !px-5"
                disabled={!feeDirty || savingFees}
                onClick={() => void persistFeeConfig()}
              >
                {savingFees ? 'Saving…' : 'Save fee settings'}
              </button>
              {feeDirty && (
                <button
                  type="button"
                  className="app-button-outline !w-auto !h-10 !px-5"
                  onClick={() => setFeeDraft(platformSettings.feeConfig)}
                >
                  Discard changes
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-brand-text-muted">
              Only Directors and Founders can edit platform fees.
            </p>
          )}
        </div>
      </AppFormSection>

      <AppFormSection title="Crew team pay bump">
        <div className="pb-6 space-y-4">
          <p className="text-sm text-brand-text-muted">
            Each guard rostered on a coordinated crew for that specific job earns this extra amount per hour. Independent applicants and guards on other jobs do not receive it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <label className="block space-y-1">
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
            <button
              type="button"
              className="app-button-primary !w-auto !h-10 !px-5"
              disabled={!crewPayBumpDirty || savingCrewPayBump}
              onClick={() => void persistCrewPayBumpSettings()}
            >
              {savingCrewPayBump ? 'Saving…' : 'Save crew pay bump'}
            </button>
          ) : (
            <p className="text-xs text-brand-text-muted">Only Directors and Founders can edit crew pay settings.</p>
          )}
        </div>
      </AppFormSection>

      <AppFormSection title="Homepage messages">
        <div className="pb-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="uber-label">Founder message (Markeith White)</span>
            <textarea
              value={platformSettings.ownerMessage ?? ''}
              disabled={currentUser.role !== 'owner'}
              onChange={(e) =>
                canEditPaymentModes &&
                onUpdatePlatformSettings?.({
                  ...platformSettings,
                  ownerMessage: e.target.value,
                  ownerMessageUpdatedAt: new Date().toISOString(),
                })
              }
              rows={4}
              className="uber-input w-full resize-y"
              placeholder="Message shown on the public homepage from the Founder account."
            />
          </label>
          <label className="block space-y-1.5">
            <span className="uber-label">Director message (Tyrone Johnson)</span>
            <textarea
              value={platformSettings.directorMessage ?? ''}
              disabled={currentUser.role !== 'owner' && currentUser.role !== 'director'}
              onChange={(e) =>
                (currentUser.role === 'owner' || currentUser.role === 'director') &&
                onUpdatePlatformSettings?.({
                  ...platformSettings,
                  directorMessage: e.target.value,
                  directorMessageUpdatedAt: new Date().toISOString(),
                })
              }
              rows={4}
              className="uber-input w-full resize-y"
              placeholder="Message shown on the public homepage from the Director account."
            />
          </label>
          {currentUser.role !== 'owner' && currentUser.role !== 'director' && (
            <p className="text-xs text-brand-text-muted">Homepage leadership messages are read-only for your role.</p>
          )}
        </div>
      </AppFormSection>

      <AppFormSection title="Approval rules">
        <div className="pb-6">
          <label className="uber-label block mb-1">Job posting review</label>
          <select className="uber-input w-full max-w-lg" defaultValue="staff-all" disabled aria-describedby="job-review-note">
            <option value="staff-all">All jobs require staff review before going live</option>
          </select>
          <p id="job-review-note" className="text-xs text-brand-text-muted mt-2">
            Trusted-client auto-publish is planned for a future release. Every job offer is reviewed by staff today.
          </p>
        </div>
      </AppFormSection>

      <AppFormSection title="Role Permissions">
        <div className="pb-6">
          <StaffRolesReference />
        </div>
      </AppFormSection>

      {showStaffOnboard && assignableRoles.length > 0 && (
        <AppFormSection title="Onboard staff">
          <div className="pb-6">
            <p className="text-sm text-brand-text-muted mb-4">
              You can also manage staff from the Staff section in the sidebar — add accounts and change roles there.
              Founders manage staff below their tier; Directors manage Moderators and Administrators.
            </p>
            <StaffAddStaffForm
              assignableRoles={assignableRoles}
              onAdd={(input) =>
                onAddStaffProfile(input.name, input.email, input.badgeNumber, input.staffRole)
              }
            />
          </div>
        </AppFormSection>
      )}
    </div>
  );
}
