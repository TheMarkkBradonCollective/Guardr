import React from 'react';
import { SecurityGuard } from '../../types';
import { Clock, User } from 'lucide-react';
import { GuardActivationChecklistView } from '../guard/GuardActivationChecklistView';
import { AppPageLead, AppScreen } from '../ui/app/AppPrimitives';

interface AccountPendingScreenProps {
  role: 'guard' | 'client';
  guard?: SecurityGuard | null;
  onOpenProfile: () => void;
}

export function AccountPendingScreen({ role, guard, onOpenProfile }: AccountPendingScreenProps) {
  const isGuard = role === 'guard';

  return (
    <AppScreen className="flex flex-col justify-center min-h-full">
      <div className="px-5 py-8 text-center border-b border-brand-border">
        <Clock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <AppPageLead
          kicker="Application status"
          title="Pending approval"
        />
        <p className="text-sm text-brand-text-muted leading-relaxed mt-4 text-left">
          {isGuard
            ? 'Submit your government ID and BSIS Guard Card in your profile — each has its own section. Guardr staff verifies both before activating your account. After activation you can add other credentials and accept jobs.'
            : 'Your client account is waiting for Guardr staff approval. You can update your profile now, but posting jobs and hiring guards unlocks after approval.'}
        </p>
      </div>

      {isGuard && guard && <GuardActivationChecklistView guard={guard} />}

      <div className="px-5 py-6">
        <button type="button" onClick={onOpenProfile} className="app-button-primary !w-full !h-11 gap-2">
          <User className="w-4 h-4" />
          {isGuard ? 'Complete your application' : 'View profile'}
        </button>
      </div>
    </AppScreen>
  );
}
