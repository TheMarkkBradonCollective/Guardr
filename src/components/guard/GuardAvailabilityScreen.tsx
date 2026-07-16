import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  return (
    <ResponsivePage screenClassName="guard-tiered-screen" className="adm-page--calendar">
      <GuardAvailabilityCalendar guardId={guard.id} />
    </ResponsivePage>
  );
}
