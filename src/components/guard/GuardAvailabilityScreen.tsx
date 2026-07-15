import React from 'react';
import type { SecurityGuard } from '../../types';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';

interface GuardAvailabilityScreenProps {
  guard: SecurityGuard;
}

export function GuardAvailabilityScreen({ guard }: GuardAvailabilityScreenProps) {
  return (
    <AppScreen>
      <AppFormSection title="Weekly availability">
        <p className="text-xs text-brand-text-muted leading-relaxed mb-3 -mt-1">
          Let clients and matching know when you are generally available for shifts.
        </p>
        <GuardAvailabilityCalendar guardId={guard.id} />
      </AppFormSection>
    </AppScreen>
  );
}
