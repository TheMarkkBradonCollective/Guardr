import React from 'react';
import { SecurityGuard } from '../../types';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { guardHasValidInsurance } from '../../lib/guardInsurance';
import {
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
} from '../../lib/guardQualification';
import { Clock, Check, User } from 'lucide-react';
import { GuardActivationChecklistView } from '../guard/GuardActivationChecklistView';
import { AppPageLead, AppScreen } from '../ui/app/AppPrimitives';

interface AccountPendingScreenProps {
  role: 'guard' | 'client';
  guard?: SecurityGuard | null;
  onOpenProfile: () => void;
}

function guardMarketplaceEligibilityLead(guard: SecurityGuard, approved: boolean): string {
  if (!approved) {
    return 'Upload your government ID, BSIS guard card, Certificate of Insurance (COI), and other credentials. Staff verifies them for marketplace eligibility — not employment onboarding.';
  }

  const verified: string[] = [];
  if (guardHasVerifiedIdForWork(guard)) verified.push('government ID');
  if (guardMeetsLevel1(guard)) verified.push('guard card');
  if (guardHasValidInsurance(guard)) verified.push('COI');

  const missing: string[] = [];
  if (!guardHasValidInsurance(guard)) missing.push('Certificate of Insurance (COI)');
  if (!guardMeetsPtaUofTraining(guard)) missing.push('PTA/UOF training');
  if (!guardMeets32HourBlock(guard)) missing.push('32-hour BSIS block');

  let message =
    verified.length > 0
      ? `Your ${verified.join(', ')} ${verified.length === 1 ? 'is' : 'are'} verified.`
      : 'Staff is reviewing your credentials.';

  if (missing.length > 0) {
    message += ` Upload ${missing.join(', ')} and any remaining items so staff can confirm marketplace eligibility.`;
  } else {
    message += ' Staff will confirm marketplace eligibility when all requirements are verified.';
  }

  return message;
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
          kicker="Marketplace eligibility"
          title={approved ? 'Credentials verified' : 'Eligibility review'}
        />
        <p className="text-sm text-brand-text-muted leading-relaxed mt-4 text-left font-medium">
          {isGuard && guard
            ? guardMarketplaceEligibilityLead(guard, approved)
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
