import React from 'react';
import { Certification, GuardInsurancePolicy, SecurityGuard } from '../../types';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { getGuardApplicationProgress } from '../../lib/guardApplicationProgress';
import { User } from 'lucide-react';
import { GuardCredentialsPanel } from '../profile/GuardCredentialsPanel';
import {
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from '../profile/GuardIdentityVerificationPanel';
import { AppScreen } from '../ui/app/AppPrimitives';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';

interface AccountPendingScreenProps {
  role: 'guard' | 'client';
  guard?: SecurityGuard | null;
  onOpenProfile: () => void;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  onSubmitIdentityVerification?: (
    payload: GuardIdentityVerificationPayload
  ) => Promise<IdentityVerificationSubmitResult>;
  onSaveInsurance?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
}

function guardActivationSubtitle(approved: boolean, percent: number): string {
  if (approved) {
    return percent >= 100
      ? 'All requirements are in — Guardr staff will activate your account when ready.'
      : 'Your profile is approved — upload any remaining credentials below.';
  }
  if (percent >= 100) {
    return 'Requirements submitted — staff is reviewing your credentials for marketplace eligibility.';
  }
  return 'Upload each item below. Staff verifies them for marketplace eligibility — not employment onboarding.';
}

export function AccountPendingScreen({
  role,
  guard,
  onOpenProfile,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onSubmitIdentityVerification,
  onSaveInsurance,
}: AccountPendingScreenProps) {
  const isGuard = role === 'guard';
  const approved = isGuard && guard ? isGuardAccountApproved(guard) : false;
  const applicationProgress = isGuard && guard ? getGuardApplicationProgress(guard) : null;

  const title = isGuard
    ? approved
      ? 'Awaiting account activation'
      : 'Complete your application'
    : 'Account pending approval';

  const subtitle = isGuard && applicationProgress
    ? guardActivationSubtitle(approved, applicationProgress.percent)
    : 'Your account is pending staff approval.';

  return (
    <AppScreen className="flex flex-col min-h-full overflow-y-auto overscroll-contain">
      <div className="px-5 pt-8 pb-6 border-b border-brand-border shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-brand-text text-left">{title}</h1>
        <p className="text-sm text-brand-text-muted mt-2 text-left leading-relaxed">{subtitle}</p>

        {applicationProgress && (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-brand-text-muted">
                {applicationProgress.requirementLabel}
              </span>
              <span className="text-xs font-bold text-brand-primary tabular-nums">
                {applicationProgress.percent}%
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden bg-brand-border"
              role="progressbar"
              aria-valuenow={applicationProgress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Application progress"
            >
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-300"
                style={{ width: `${applicationProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isGuard && guard && onSubmitIdentityVerification && (
        <div className="px-5 py-6">
          <GuardCredentialsPanel
            guard={guard}
            editing
            onAddCertification={onAddCertification}
            onDeleteCertification={onDeleteCertification}
            onAttachCertificationImage={onAttachCertificationImage}
            onUpdateCertification={onUpdateCertification}
            onSubmitIdentityVerification={onSubmitIdentityVerification}
            onSaveInsurance={onSaveInsurance}
          />
        </div>
      )}

      {!isGuard && (
        <div className="px-5 py-6">
          <button type="button" onClick={onOpenProfile} className="app-button-primary !w-full !h-11 gap-2">
            <User className="w-4 h-4" />
            View profile
          </button>
        </div>
      )}
    </AppScreen>
  );
}
