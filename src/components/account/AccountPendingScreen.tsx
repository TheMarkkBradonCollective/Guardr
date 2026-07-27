import React from 'react';
import { Certification, GuardInsurancePolicy, SecurityGuard } from '../../types';
import { isGuardAccountApproved, isGuardAccountPending, isGuardAccountPreActive, isGuardUserStatusActive } from '../../lib/accountStatus';
import { getGuardApplicationProgress } from '../../lib/guardApplicationProgress';
import {
  guardCredentialRestrictedDetail,
  isGuardCredentialExpiryRestricted,
} from '../../lib/guardCredentialExpiryEnforcement';
import { AlertTriangle, Clock, Check, LifeBuoy, User } from 'lucide-react';
import { GuardActivationUploadChecklist } from '../guard/GuardActivationUploadChecklist';
import {
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from '../profile/GuardIdentityVerificationPanel';
import { AppScreen } from '../ui/app/AppPrimitives';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { AppNoticeChip } from '../ui/app/AppBlockedAccess';

interface AccountPendingScreenProps {
  role: 'guard' | 'client';
  guard?: SecurityGuard | null;
  client?: Pick<
    import('../../types').Client,
    'applicationRevisionRequestedAt' | 'applicationRevisionNote' | 'accountStatus' | 'approved'
  > | null;
  onOpenProfile: () => void;
  onOpenApplicationProfile?: () => void;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  onSubmitIdentityVerification?: (
    payload: GuardIdentityVerificationPayload
  ) => Promise<IdentityVerificationSubmitResult>;
  onSaveInsurance?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
  onContactSupport?: () => void;
  hasActivationSupportChat?: boolean;
}

function guardActivationSubtitle(approved: boolean, percent: number): string {
  if (!approved) {
    return 'Your application is with Guardr staff. Credentials you add now are saved on the application package. Uploads after approval go to your live profile for activation and do not rewrite what staff reviewed.';
  }
  if (percent >= 100) {
    return 'All requirements are in — Guardr staff will manually activate your account when ready.';
  }
  return 'Application approved — upload and complete each credential below for staff verification.';
}

export function AccountPendingScreen({
  role,
  guard,
  client,
  onOpenProfile,
  onOpenApplicationProfile,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onSubmitIdentityVerification,
  onSaveInsurance,
  onContactSupport,
  hasActivationSupportChat = false,
}: AccountPendingScreenProps) {
  const isGuard = role === 'guard';
  const approved = isGuard && guard ? isGuardAccountApproved(guard) : false;
  const pending = isGuard && guard ? isGuardAccountPending(guard) : false;
  const active = isGuard && guard ? isGuardUserStatusActive(guard) : false;
  const canUploadCredentials =
    isGuard && guard ? isGuardAccountPreActive(guard) && !isGuardCredentialExpiryRestricted(guard) : false;
  const restricted = isGuard && guard ? isGuardCredentialExpiryRestricted(guard) : false;
  const applicationProgress = isGuard && guard ? getGuardApplicationProgress(guard) : null;
  const revisionOpen = Boolean(
    guard?.applicationRevisionRequestedAt || client?.applicationRevisionRequestedAt
  );
  const revisionNote =
    guard?.applicationRevisionNote?.trim() || client?.applicationRevisionNote?.trim();

  const title = isGuard
    ? restricted
      ? 'Account restricted'
      : revisionOpen
        ? 'Update your application'
        : approved
          ? 'Upload activation credentials'
          : active
            ? 'Complete activation credentials'
            : 'Application under review'
    : revisionOpen
      ? 'Update your application'
      : 'Account pending approval';

  const subtitle = isGuard && restricted
    ? guardCredentialRestrictedDetail(guard!)
    : revisionOpen
    ? revisionNote ||
      'Staff requested updates to your application. Open Profile to edit the locked application details, then save.'
    : isGuard && active
    ? 'Your account is active — finish any missing credentials in Profile so marketplace access stays uninterrupted.'
    : isGuard && applicationProgress
    ? guardActivationSubtitle(approved, applicationProgress.percent)
    : 'Your account is pending staff approval. Application details stay locked after submission unless staff requests an update.';

  return (
    <ResponsivePage screenClassName="flex flex-col min-h-full overflow-y-auto overscroll-contain" className="adm-pending-page">
      <div className="px-5 pt-8 pb-6 border-b border-brand-border shrink-0 text-center">
        {isGuard && restricted ? (
          <span className="w-14 h-14 rounded-full border-2 border-red-500/40 bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </span>
        ) : isGuard && approved && !revisionOpen ? (
          <span className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center mx-auto mb-5 shadow-[0_4px_20px_color-mix(in_srgb,var(--brand-primary)_30%,transparent)]">
            <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
          </span>
        ) : (
          <span className="w-14 h-14 rounded-full border-2 border-brand-border bg-brand-bg-sec flex items-center justify-center mx-auto mb-5">
            <Clock className="w-7 h-7 text-brand-primary" />
          </span>
        )}
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-2">
          {restricted ? 'Credential expired' : revisionOpen ? 'Revision requested' : 'Marketplace eligibility'}
        </p>
        <h1 className="text-2xl font-black tracking-tight text-brand-text">{title}</h1>
        <p className="text-sm text-brand-text-muted mt-2 leading-relaxed text-left font-medium">{subtitle}</p>

        {revisionOpen && (
          <div className="mt-4 text-left space-y-3">
            <AppNoticeChip
              tone="warning"
              label="Application unlocked for updates"
              title="Revision requested"
              message="Staff asked you to update your application. Open Profile, edit the application details, and save. Details lock again after you save."
            />
            {onOpenApplicationProfile && (
              <button
                type="button"
                onClick={onOpenApplicationProfile}
                className="app-button-primary !w-full !h-11 gap-2"
              >
                <User className="w-4 h-4" />
                Edit application details
              </button>
            )}
          </div>
        )}

        {applicationProgress && !revisionOpen && (
          <div className="mt-5 text-left">
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

        {isGuard && approved && !revisionOpen && onContactSupport && (
          <div className="mt-5 text-left">
            <button
              type="button"
              onClick={onContactSupport}
              className="app-button-outline !w-full !h-11 gap-2"
            >
              <LifeBuoy className="w-4 h-4" />
              {hasActivationSupportChat ? 'Open activation support chat' : 'Contact support'}
            </button>
            <p className="text-xs text-brand-text-muted mt-2 leading-relaxed">
              Guardr staff can reach out here to help you finish activation and get on the marketplace.
            </p>
          </div>
        )}
      </div>

      {isGuard && guard && canUploadCredentials && onSubmitIdentityVerification && (
        <div className="px-5 py-6">
          <GuardActivationUploadChecklist
            guard={guard}
            onAddCertification={onAddCertification}
            onDeleteCertification={onDeleteCertification}
            onAttachCertificationImage={onAttachCertificationImage}
            onUpdateCertification={onUpdateCertification}
            onSubmitIdentityVerification={onSubmitIdentityVerification}
            onSaveInsurance={onSaveInsurance}
          />
        </div>
      )}

      {isGuard && guard && pending && !canUploadCredentials && (
        <div className="px-5 py-6 text-sm text-brand-text-muted leading-relaxed">
          <p>
            Your account is restricted until expired credentials are updated. Contact Guardr support if
            you need help.
          </p>
        </div>
      )}

      {!isGuard && (
        <div className="px-5 py-6 space-y-3">
          {revisionOpen && (
            <AppNoticeChip
              tone="warning"
              label="Application unlocked for updates"
              title="Revision requested"
              message="Staff asked you to update your application. Edit your profile details and save. Details lock again after you save."
            />
          )}
          <button type="button" onClick={onOpenProfile} className="app-button-primary !w-full !h-11 gap-2">
            <User className="w-4 h-4" />
            {revisionOpen ? 'Edit application details' : 'View profile'}
          </button>
        </div>
      )}
    </ResponsivePage>
  );
}
