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
      <div className="px-5 py-10 text-center border-b border-brand-border">
        {approved ? (
          <span className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center mx-auto mb-5 shadow-[0_4px_20px_color-mix(in_srgb,var(--brand-primary)_30%,transparent)]">
            <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
          </span>
        ) : (
          <span className="w-14 h-14 rounded-full border-2 border-brand-border bg-brand-bg-sec flex items-center justify-center mx-auto mb-5">
            <Clock className="w-7 h-7 text-brand-primary" />
          </span>
        )}
        <AppPageLead
          kicker="Application status"
          title={approved ? 'Profile approved' : 'Pending approval'}
        />
        <p className="text-sm text-brand-text-muted leading-relaxed mt-4 text-left font-medium">
          {isGuard
            ? approved
              ? 'Profile approved — upload your credentials in your profile so staff can activate your account.'
              : 'Upload your credentials in your profile. Staff reviews and activates your account.'
            : 'Your account is pending staff approval.'}
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
