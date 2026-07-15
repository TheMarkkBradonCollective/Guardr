import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { GuardAvailabilityDatesPanel } from './GuardAvailabilityDatesPanel';
import { AppScreen } from '../ui/app/AppPrimitives';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  return (
    <AppScreen className="guard-availability-screen">
      <GuardAvailabilityCalendar guardId={guard.id} />
      <div className="guard-pref-body availability-dates-wrap">
        <GuardAvailabilityDatesPanel guardId={guard.id} />
      </div>
    </AppScreen>
  );
}
