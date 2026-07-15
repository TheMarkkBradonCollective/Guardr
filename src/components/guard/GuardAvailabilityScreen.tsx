import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { AppScreen } from '../ui/app/AppPrimitives';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  return (
    <AppScreen className="guard-tiered-screen">
      <GuardAvailabilityCalendar guardId={guard.id} />
    </AppScreen>
  );
}
