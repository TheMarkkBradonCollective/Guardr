import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';
import { useLayoutFormFactor } from '../../surfaces';
import { WorkbenchBody, WorkbenchPage, WorkbenchPanel } from '../baseui/layout/WorkbenchLayout';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  const formFactor = useLayoutFormFactor();
  const calendar = <GuardAvailabilityCalendar guardId={guard.id} />;

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage className="adm-availability-workbench">
        <WorkbenchPanel>
          <WorkbenchBody>{calendar}</WorkbenchBody>
        </WorkbenchPanel>
      </WorkbenchPage>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <ResponsivePage
        screenClassName="guard-tiered-screen"
        className="adm-page--calendar guard-availability-tablet"
      >
        {calendar}
      </ResponsivePage>
    );
  }

  return (
    <ResponsivePage screenClassName="guard-tiered-screen" className="adm-page--calendar">
      {calendar}
    </ResponsivePage>
  );
}
