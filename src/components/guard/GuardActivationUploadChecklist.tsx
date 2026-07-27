import { Check, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Certification, GuardInsurancePolicy, SecurityGuard } from '../../types';
import { isGuardAccountApproved, isGuardAccountPending } from '../../lib/accountStatus';
import { getGuardActivationChecklist, getGuardCardCertifications } from '../../lib/guardAccountActivation';
import { resolveCertCatalogId } from '../../lib/certCatalog';
import { findRejectedCertForCatalog } from '../../lib/certResubmit';
import {
  isContinuingEducationCatalogId,
  isPtaUofCatalogId,
} from '../../lib/guardQualification';
import { guardHasSubmittedItemsForStaffReview } from '../../lib/approvalSubmissions';
import {
  guardCoiCanGuardEdit,
  guardInsuranceActivationDetail,
} from '../../lib/guardInsurance';
import {
  guardIdVerificationCanEdit,
  guardIdVerificationResubmitPending,
} from '../../lib/guardIdentityVerification';
import {
  guardHasVerifiedIdForWork,
  guardMeetsContinuingEducation,
  guardMeetsLevel1,
  guardMeetsMandatoryTraining,
} from '../../lib/guardQualification';
import {
  guardActivationCeStepDetail,
  guardActivationGuardCardStepDetail,
  guardActivationIdStepDetail,
  guardActivationMandatoryTrainingStepDetail,
} from '../../lib/guardActivationStepCopy';
import { certImageIsLocked } from '../../lib/certImagePolicy';
import { beginActivationUploadSession, endActivationUploadSession } from '../../lib/dbMutationGuard';
import type {
  GuardIdentityVerificationPayload,
  IdentityVerificationSubmitResult,
} from '../profile/GuardIdentityVerificationPanel';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { GuardIdDetailModal } from '../profile/GuardIdDetailModal';
import { GuardCoiUploadSheet } from '../profile/GuardCoiUploadSheet';
import { GuardCardPanel } from '../profile/GuardCardPanel';
import { GuardPtaUofPanel } from './GuardPtaUofPanel';
import { GuardThirtyTwoHourPanel } from './GuardThirtyTwoHourPanel';
import { GuardOptionalCredentialAddSheet } from './GuardOptionalCredentialAddSheet';
import { getSupplementalCredentialsOnFile } from '../../lib/certMatching';

type UploadKind = 'id' | 'coi' | 'guardCard' | 'mandatoryTraining' | 'ce' | 'optional';

interface GuardActivationUploadChecklistProps {
  guard: SecurityGuard;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  onSubmitIdentityVerification?: (
    payload: GuardIdentityVerificationPayload
  ) => Promise<IdentityVerificationSubmitResult>;
  onSaveInsurance?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
}

function StepRow({
  done,
  label,
  detail,
  actionLabel,
  onAction,
}: {
  done: boolean;
  label: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-0.5">
        {done ? (
          <span className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </span>
        ) : (
          <span className="w-5 h-5 rounded-full border-2 border-brand-border block" />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-bold tracking-tight leading-snug ${done ? 'text-brand-text' : 'text-brand-text-muted'}`}
        >
          {label}
        </p>
        {detail && <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{detail}</p>}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="app-button-primary !w-full !h-11 !text-sm gap-2 mt-3"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function guardCardAwaitingReview(guard: SecurityGuard): boolean {
  return getGuardCardCertifications(guard).some(
    (cert) => cert.status === 'pending' && certImageIsLocked(cert)
  );
}

export function GuardActivationUploadChecklist({
  guard,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onSubmitIdentityVerification,
  onSaveInsurance,
}: GuardActivationUploadChecklistProps) {
  const [openUpload, setOpenUpload] = useState<UploadKind | null>(null);
  const checklist = getGuardActivationChecklist(guard);
  const coi = guardInsuranceActivationDetail(guard);

  const closeUpload = () => setOpenUpload(null);

  useEffect(() => {
    if (!openUpload) return;
    beginActivationUploadSession();
    return () => endActivationUploadSession();
  }, [openUpload]);

  const idDone = guardHasVerifiedIdForWork(guard) || checklist.idSubmitted;
  const idCanUpload = !!onSubmitIdentityVerification && guardIdVerificationCanEdit(guard);
  const idAction = guardIdVerificationResubmitPending(guard)
    ? 'Resubmit government ID'
    : 'Add government ID';

  const coiDone = coi.done || checklist.insuranceSubmitted;
  const coiCanUpload = !!onSaveInsurance && guardCoiCanGuardEdit(guard);

  const guardCardRejected = findRejectedCertForCatalog(guard, 'bsis-guard-card');
  const mandatoryRejected = guard.certifications.some(
    (cert) => cert.status === 'rejected' && isPtaUofCatalogId(resolveCertCatalogId(cert))
  );
  const ceRejected = guard.certifications.some(
    (cert) => cert.status === 'rejected' && isContinuingEducationCatalogId(resolveCertCatalogId(cert))
  );

  const guardCardDone = guardMeetsLevel1(guard) || checklist.guardCardVerified;
  const guardCardCanUpload = !!onAddCertification && !guardMeetsLevel1(guard) && !guardCardAwaitingReview(guard);

  const mandatoryDone = guardMeetsMandatoryTraining(guard);
  const mandatoryCanUpload = !!onAddCertification && !mandatoryDone;

  const ceDone = guardMeetsContinuingEducation(guard);
  const ceCanUpload = !!onAddCertification && !ceDone;

  const optionalOnFile = getSupplementalCredentialsOnFile(guard);
  const optionalCanUpload = !!onAddCertification;
  const optionalDetail =
    optionalOnFile.length > 0
      ? `${optionalOnFile.length} on file — 8-hr refresher and extras. Not required for activation.`
      : '8-hr refresher, firearms, medical, FEMA, and more. Not required for activation.';

  return (
    <>
      <div className="app-checklist-panel">
        <div className="app-checklist-steps">
          <StepRow
            done={idDone}
            label="1. Government ID — required to work"
            detail={guardActivationIdStepDetail(guard)}
            actionLabel={!guardHasVerifiedIdForWork(guard) && idCanUpload ? idAction : undefined}
            onAction={!guardHasVerifiedIdForWork(guard) && idCanUpload ? () => setOpenUpload('id') : undefined}
          />
          <StepRow
            done={coiDone}
            label="2. Certificate of Insurance (COI) — required for profile approval"
            detail={coi.detail}
            actionLabel={!coi.done && coiCanUpload ? 'Add COI' : undefined}
            onAction={!coi.done && coiCanUpload ? () => setOpenUpload('coi') : undefined}
          />
          <StepRow
            done={guardCardDone}
            label="3. BSIS Guard Card — required to work"
            detail={guardActivationGuardCardStepDetail(guard)}
            actionLabel={guardCardCanUpload ? (guardCardRejected ? 'Resubmit guard card' : 'Add guard card') : undefined}
            onAction={guardCardCanUpload ? () => setOpenUpload('guardCard') : undefined}
          />
          <StepRow
            done={mandatoryDone}
            label="4. Mandatory training (PTA/UOF) — required to work"
            detail={guardActivationMandatoryTrainingStepDetail(guard)}
            actionLabel={
              mandatoryCanUpload
                ? mandatoryRejected
                  ? 'Resubmit PTA/UOF'
                  : 'Add PTA/UOF'
                : undefined
            }
            onAction={mandatoryCanUpload ? () => setOpenUpload('mandatoryTraining') : undefined}
          />
          <StepRow
            done={ceDone}
            label="5. Continuing Education (32-hour BSIS CE package) — required to work"
            detail={guardActivationCeStepDetail(guard)}
            actionLabel={
              ceCanUpload
                ? ceRejected
                  ? 'Resubmit Continuing Education'
                  : 'Add Continuing Education'
                : undefined
            }
            onAction={ceCanUpload ? () => setOpenUpload('ce') : undefined}
          />
          <div className="flex items-start gap-3 pt-3">
            <span className="shrink-0 mt-0.5">
              {optionalOnFile.length > 0 ? (
                <span className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-brand-primary" strokeWidth={2.5} />
                </span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-tight text-brand-text">Optional credentials</p>
              <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{optionalDetail}</p>
              {optionalCanUpload && (
                <button
                  type="button"
                  onClick={() => setOpenUpload('optional')}
                  className="app-button-primary !w-full !h-11 !text-sm gap-2 mt-3"
                >
                  <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  {optionalOnFile.length > 0 ? 'Add another credential' : 'Add optional credential'}
                </button>
              )}
            </div>
          </div>
        </div>
        {isGuardAccountPending(guard) && (
          <p className="text-xs text-brand-text-muted pt-3 border-t border-brand-border mt-3 leading-relaxed">
            Upload these credentials now — they are attached to your application. Staff verification
            begins after your application is approved.
          </p>
        )}
        {isGuardAccountApproved(guard) && guardHasSubmittedItemsForStaffReview(guard) && (
          <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
            Staff is reviewing your credentials. Submitted items are locked until review finishes.
          </p>
        )}
      </div>

      {openUpload === 'id' && onSubmitIdentityVerification && (
        <GuardIdDetailModal
          guard={guard}
          canEdit={guardIdVerificationCanEdit(guard)}
          initialEditMode
          onSubmit={onSubmitIdentityVerification}
          onClose={closeUpload}
        />
      )}

      {openUpload === 'coi' && onSaveInsurance && (
        <GuardCoiUploadSheet
          guard={guard}
          open
          onClose={closeUpload}
          onSave={onSaveInsurance}
        />
      )}

      {openUpload === 'guardCard' && (
        <GuardCardPanel
          guard={guard}
          editing
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          activationFormOnly={{ open: true, onClose: closeUpload }}
        />
      )}

      {openUpload === 'mandatoryTraining' && (
        <GuardPtaUofPanel
          guard={guard}
          editing
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          activationFormOnly={{ open: true, onClose: closeUpload }}
        />
      )}

      {openUpload === 'ce' && (
        <GuardThirtyTwoHourPanel
          guard={guard}
          editing
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          activationFormOnly={{ open: true, onClose: closeUpload }}
        />
      )}

      {openUpload === 'optional' && (
        <GuardOptionalCredentialAddSheet
          guard={guard}
          open
          onClose={closeUpload}
          onAddCertification={onAddCertification}
        />
      )}
    </>
  );
}
