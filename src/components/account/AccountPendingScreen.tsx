import React from 'react';
import { SecurityGuard } from '../../types';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { Clock, Check, User } from 'lucide-react';
import { GuardActivationChecklistView } from '../guard/GuardActivationChecklistView';
import { AppPageLead, AppScreen } from '../ui/app/AppPrimitives';

interface AccountPendingScreenProps {
  role: 'guard' | 'client';
  guard?: SecurityGuard | null;
  onOpenProfile: () => void;
}

export function AccountPendingScreen({ role, guard, onOpenProfile }: AccountPendingScreenProps) {
  const isGuard = role === 'guard';
  const approved = isGuard && guard ? isGuardAccountApproved(guard) : false;

  return (
    <AppScreen className="flex flex-col justify-center min-h-full">
      <div className="px-5 py-8 text-center border-b border-brand-border">
        {approved ? (
          <Check className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
        ) : (
          <Clock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        )}
        <AppPageLead
          kicker="Application status"
          title={approved ? 'Profile approved' : 'Pending approval'}
        />
        <p className="text-sm text-brand-text-muted leading-relaxed mt-4 text-left">
          {isGuard
            ? approved
              ? 'Your profile is approved. Upload your BSIS Guard Card, PTA/UOF training, 32-hour BSIS courses, and any other credentials in your profile if you have not already — staff will verify your guard card and activate your account so you can work jobs.'
              : 'Upload your government ID, BSIS Guard Card, PTA/UOF training, 32-hour BSIS courses, and any other credentials in your profile — you can add everything at once. Staff verifies your ID first to approve your profile, then your guard card and other documents before activating your account.'
            : 'Your client account is waiting for Guardr staff approval. You can update your profile now, but posting jobs and hiring guards unlocks after approval.'}
        </p>
      </div>

      {isGuard && guard && <GuardActivationChecklistView guard={guard} />}

      <div className="px-5 py-6">
        <button type="button" onClick={onOpenProfile} className="app-button-primary !w-full !h-11 gap-2">
          <User className="w-4 h-4" />
          {isGuard ? (approved ? 'View profile & credentials' : 'Complete your application') : 'View profile'}
        </button>
      </div>
    </AppScreen>
  );
}
