import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { GuardAvailabilityDatesPanel } from './GuardAvailabilityDatesPanel';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  return (
    <AppScreen>
      <AppFormSection title="Availability">
        <GuardAvailabilityCalendar guardId={guard.id} />
        <div className="mt-6 pt-6 border-t border-brand-border">
          <GuardAvailabilityDatesPanel guardId={guard.id} />
        </div>
      </AppFormSection>
    </AppScreen>
  );
}
