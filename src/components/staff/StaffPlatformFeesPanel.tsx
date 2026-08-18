import React, { useEffect, useMemo, useState } from 'react';
import { SessionUser } from '../../types';
import {
  normalizeClientPlatformFeeSchedules,
  type ClientFeeAccountKind,
  type ClientPlatformFeeSchedules,
} from '../../lib/payments';
import { PlatformSettings } from '../../lib/platformSettings';
import { hasExecutivePaymentControls } from '../../lib/permissions';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useLayoutFormFactor } from '../../surfaces';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { StaffMgmtSection } from './StaffMgmtSection';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { PlatformFeeScheduleEditor } from './PlatformFeeScheduleEditor';
import { FinanceSettingsSaveRow } from './staffFinanceSettingsControls';

interface StaffPlatformFeesPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
}

export function StaffPlatformFeesPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
}: StaffPlatformFeesPanelProps) {
  const formFactor = useLayoutFormFactor();
  const canEditFees = hasExecutivePaymentControls(currentUser);
  const [scheduleDraft, setScheduleDraft] = useState<ClientPlatformFeeSchedules>(
    platformSettings.clientFeeSchedules,
  );
  const [feeAccountKind, setFeeAccountKind] = useState<ClientFeeAccountKind>('personal');
  const [savingFees, setSavingFees] = useState(false);

  useEffect(() => {
    setScheduleDraft(platformSettings.clientFeeSchedules);
  }, [platformSettings.clientFeeSchedules]);

  const feeDirty = useMemo(
    () => JSON.stringify(scheduleDraft) !== JSON.stringify(platformSettings.clientFeeSchedules),
    [scheduleDraft, platformSettings.clientFeeSchedules],
  );

  const persistFeeConfig = async () => {
    if (!onUpdatePlatformSettings || !canEditFees) return;
    setSavingFees(true);
    try {
      const nextSchedules = normalizeClientPlatformFeeSchedules(
        scheduleDraft,
        platformSettings.feeConfig,
      );
      await onUpdatePlatformSettings({
        ...platformSettings,
        clientFeeSchedules: nextSchedules,
        feeConfig: {
          model: nextSchedules.business.model,
          flatFeePerHour: nextSchedules.business.flatFeePerHour,
          percentRate: nextSchedules.business.percentRate,
        },
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingFees(false);
    }
  };

  const body = (
    <div className="space-y-4 min-w-0">
      <p className="text-sm text-brand-text/70 leading-relaxed">
        Personal and business accounts have separate platform fee tables. Within each table, every guard
        type can use the account default or its own rate. These rates apply to <strong>new jobs only</strong>.
        Posted, approved, and contracted jobs keep the prices already saved on that job. Open-contract
        jobs can still negotiate a different take on that specific agreement.
      </p>

      <div className="segmented-control segmented-control-full">
        <button
          type="button"
          className={`segmented-control-btn flex-1 py-3 text-sm ${
            feeAccountKind === 'personal' ? 'segmented-control-btn-active' : ''
          }`}
          onClick={() => setFeeAccountKind('personal')}
        >
          Personal
        </button>
        <button
          type="button"
          className={`segmented-control-btn flex-1 py-3 text-sm ${
            feeAccountKind === 'business' ? 'segmented-control-btn-active' : ''
          }`}
          onClick={() => setFeeAccountKind('business')}
        >
          Business
        </button>
      </div>

      <PlatformFeeScheduleEditor
        accountKind={feeAccountKind}
        schedule={scheduleDraft[feeAccountKind]}
        disabled={!canEditFees}
        onChange={(next) =>
          setScheduleDraft((prev) => ({
            ...prev,
            [feeAccountKind]: next,
          }))
        }
      />

      {canEditFees ? (
        <FinanceSettingsSaveRow
          label="Save fee settings"
          busyLabel="Saving…"
          busy={savingFees}
          disabled={!feeDirty}
          dirty={feeDirty}
          onSave={() => void persistFeeConfig()}
          onDiscard={() => setScheduleDraft(platformSettings.clientFeeSchedules)}
        />
      ) : (
        <p className="text-xs text-brand-text/60">Only Directors and Founders can edit platform fees.</p>
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
            subtitle="Personal and business platform fee tables for new jobs."
          />
        }
      >
        <StaffMgmtSection title="Platform fees">{body}</StaffMgmtSection>
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <StaffOpsPageShell className="staff-payment-settings-panel staff-mgmt-panel staff-roster-panel staff-fees-tablet">
        <div className="staff-payment-settings-scroll min-w-0">{body}</div>
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell className="staff-payment-settings-panel staff-mgmt-panel staff-roster-panel">
      <div className="staff-payment-settings-scroll min-w-0">
        <AppFormSection title="Platform fees">{body}</AppFormSection>
      </div>
    </StaffOpsPageShell>
  );
}
