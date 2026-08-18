import React from 'react';
import { SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import { canAccessFinancialControls } from '../../lib/permissions';
import { useDevice } from '../../lib/platform';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { StaffCompensationSection } from './StaffCompensationPanel';
import { StaffCompensationSettings } from './StaffCompensationSettings';

interface StaffCompensationPageProps {
  currentUser: SessionUser;
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
}

export function StaffCompensationPage({
  currentUser,
  guards,
  requests,
  platformSettings,
  onUpdatePlatformSettings,
}: StaffCompensationPageProps) {
  const { formFactor } = useDevice();
  const showPayRules = canAccessFinancialControls(currentUser);

  const payouts = (
    <StaffCompensationSection
      embedded
      currentUser={currentUser}
      guards={guards}
      requests={requests}
      platformSettings={platformSettings}
    />
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-compensation-panel adm-finance-page"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Finance"
            subtitle="Revenue-share rules, instant payouts, and post-payout adjustments."
          />
        }
      >
        <div className="space-y-6 min-w-0">
          {showPayRules ? (
            <StaffCompensationSettings
              currentUser={currentUser}
              platformSettings={platformSettings}
              onUpdatePlatformSettings={onUpdatePlatformSettings}
            />
          ) : null}
          {payouts}
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell className="staff-compensation-panel staff-mgmt-panel staff-payment-settings-panel">
      <div className="staff-payment-settings-scroll min-w-0 space-y-4">
        {showPayRules ? (
          <StaffCompensationSettings
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdatePlatformSettings={onUpdatePlatformSettings}
          />
        ) : null}
        {payouts}
      </div>
    </StaffOpsPageShell>
  );
}
