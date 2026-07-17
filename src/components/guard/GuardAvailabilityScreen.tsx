import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';
import { useDevice } from '../../lib/platform';
import { WorkbenchBody, WorkbenchPage, WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  const { formFactor } = useDevice();
  const calendar = <GuardAvailabilityCalendar guardId={guard.id} />;

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage className="adm-availability-workbench">
        <WorkbenchToolbar
          eyebrow="Schedule"
          subtitle="Weekly availability — jobs and alerts only match your enabled days and hours."
        />
        <WorkbenchBody>{calendar}</WorkbenchBody>
      </WorkbenchPage>
    );
  }

  return (
    <ResponsivePage screenClassName="guard-tiered-screen" className="adm-page--calendar">
      {calendar}
    </ResponsivePage>
  );
}
