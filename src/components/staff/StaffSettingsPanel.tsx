import React, { useEffect, useState } from 'react';
import { SessionUser, StaffRole } from '../../types';
import { PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import {
  PlatformSettings,
  platformPaymentModeDescription,
  platformPaymentModeLabel,
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
}

export function StaffSettingsPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
  showStaffOnboard,
  onAddStaffProfile,
}: StaffSettingsPanelProps) {
  const assignableRoles = getAssignableStaffRoles(currentUser.role);
  const canEditPaymentModes = canManagePlatformSettings(currentUser);
  const [cashEnabled, setCashEnabled] = useState(platformSettings.paymentCashEnabled);
  const [stripeEnabled, setStripeEnabled] = useState(platformSettings.paymentStripeEnabled);
  const [savingModes, setSavingModes] = useState(false);

  useEffect(() => {
    setCashEnabled(platformSettings.paymentCashEnabled);
    setStripeEnabled(platformSettings.paymentStripeEnabled);
  }, [platformSettings.paymentCashEnabled, platformSettings.paymentStripeEnabled]);

  const persistPaymentModes = async (nextCash: boolean, nextStripe: boolean) => {
    if (!onUpdatePlatformSettings) return;
    if (!nextCash && !nextStripe) {
      showAppToast('Enable at least one payment method.', { tone: 'error' });
      return;
    }
    setSavingModes(true);
    try {
      await onUpdatePlatformSettings({
        paymentCashEnabled: nextCash,
        paymentStripeEnabled: nextStripe,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingModes(false);
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

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <AppFormSection title="Payment methods">
        <div className="pb-6 space-y-4">
          <p className="text-sm text-brand-text-muted leading-relaxed">
            {platformPaymentModeDescription(platformSettings)}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
            Current mode: {platformPaymentModeLabel(platformSettings)}
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
                checked={cashEnabled}
                onChange={() => void toggleCash()}
                disabled={!canEditPaymentModes || savingModes}
              />
              <span>
                <span className="block text-sm font-semibold">Cash</span>
                <span className="block text-xs text-brand-text-muted mt-1 leading-relaxed">
                  Client requests pay-in-cash; staff approves when payment is received.
                </span>
              </span>
            </label>
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
              <span>
                <span className="block text-sm font-semibold">Card (Stripe)</span>
                <span className="block text-xs text-brand-text-muted mt-1 leading-relaxed">
                  Automatic online checkout — no staff approval needed for payment.
                </span>
              </span>
            </label>
          </div>
          {!canEditPaymentModes && (
            <p className="text-xs text-brand-text-muted">
              Only the Owner can change payment methods.
            </p>
          )}
        </div>
      </AppFormSection>

      <AppFormSection title="Platform Fees">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
          <div>
            <label className="uber-label block mb-1">Fee per hour</label>
            <input
              type="number"
              defaultValue={PLATFORM_FEE_PER_HOUR}
              readOnly={!hasExecutivePaymentControls(currentUser)}
              className="uber-input w-full"
            />
          </div>
          <div>
            <label className="uber-label block mb-1">Approval rules</label>
            <select className="uber-input w-full" defaultValue="staff-all">
              <option value="staff-all">All jobs require staff review</option>
              <option value="trusted">Trusted clients auto-open</option>
            </select>
          </div>
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
              Owners manage staff below their tier; Directors manage Moderators and Administrators.
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
