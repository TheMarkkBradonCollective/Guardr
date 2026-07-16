import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';
import { useDevice } from '../../lib/platform';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  const { formFactor } = useDevice();
  const calendar = <GuardAvailabilityCalendar guardId={guard.id} />;

  if (formFactor === 'desktop') {
    return (
      <div className="adm-workbench adm-availability-workbench">
        <div className="adm-workbench-toolbar">
          <div>
            <p className="adm-card-eyebrow">Schedule</p>
            <p className="adm-workbench-subtitle">
              Weekly availability — jobs and alerts only match your enabled days and hours.
            </p>
          </div>
        </div>
        {calendar}
      </div>
    );
  }

  return (
    <ResponsivePage screenClassName="guard-tiered-screen" className="adm-page--calendar">
      {calendar}
    </ResponsivePage>
  );
}
