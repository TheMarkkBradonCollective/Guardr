import React, { useState } from 'react';
import { Certification, GuardInsurancePolicy, SecurityGuard } from '../../types';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { getGuardActivationChecklist, getGuardCardCertifications } from '../../lib/guardAccountActivation';
import {
  guardCoiCanGuardEdit,
  guardInsuranceActivationDetail,
} from '../../lib/guardInsurance';
import {
  guardIdVerificationCanEdit,
  guardIdVerificationResubmitPending,
} from '../../lib/guardIdentityVerification';
import {
  formatThirtyTwoHourCourseProgressCounts,
  getQualificationProgress,
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  PTA_UOF_UPLOAD_GUIDANCE,
  BSIS_PTA_UOF_COMBINED_ID,
  THIRTY_TWO_HOUR_ROLLUP_IDS,
} from '../../lib/guardQualification';
import { certImageIsLocked } from '../../lib/certImagePolicy';
import { Check, Plus } from 'lucide-react';
import { GuardIdDetailModal } from '../profile/GuardIdDetailModal';
import { GuardCoiDetailModal } from '../profile/GuardCoiDetailModal';
import { GuardCardPanel } from '../profile/GuardCardPanel';
import { GuardPtaUofPanel } from './GuardPtaUofPanel';
import { GuardThirtyTwoHourPanel } from './GuardThirtyTwoHourPanel';
import type {
  GuardIdentityVerificationPayload,
  IdentityVerificationSubmitResult,
} from '../profile/GuardIdentityVerificationPanel';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';

type UploadKind = 'id' | 'coi' | 'guardCard' | 'pta' | 'thirtyTwoHour';

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
          <button type="button" onClick={onAction} className="app-button-secondary !h-9 !text-xs !px-3 mt-2.5">
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
  const approved = isGuardAccountApproved(guard);
  const progress = getQualificationProgress(guard);
  const coi = guardInsuranceActivationDetail(guard);

  const closeUpload = () => setOpenUpload(null);

  const idDone = approved || guardHasVerifiedIdForWork(guard);
  const idCanUpload = !!onSubmitIdentityVerification && guardIdVerificationCanEdit(guard);
  const idAction = guardIdVerificationResubmitPending(guard)
    ? 'Resubmit government ID'
    : 'Add government ID';

  const coiDone = coi.done;
  const coiCanUpload = !!onSaveInsurance && guardCoiCanGuardEdit(guard);

  const guardCardDone = guardMeetsLevel1(guard);
  const guardCardCanUpload = !!onAddCertification && !guardCardDone && !guardCardAwaitingReview(guard);

  const ptaDone = guardMeetsPtaUofTraining(guard);
  const ptaCanUpload = !!onAddCertification && !ptaDone;

  const blockDone = guardMeets32HourBlock(guard);
  const blockCanUpload = !!onAddCertification && !blockDone;

  return (
    <>
      <div className="app-checklist-panel">
        <div className="app-checklist-steps">
          <StepRow
            done={idDone}
            label="1. Government ID — required to work"
            detail={
              idDone
                ? approved
                  ? 'Verified by staff'
                  : 'Submitted — awaiting staff verification'
                : checklist.idSubmitted
                  ? 'Submitted — awaiting staff verification'
                  : 'Upload front, back, and identity selfie'
            }
            actionLabel={!idDone && idCanUpload ? idAction : undefined}
            onAction={!idDone && idCanUpload ? () => setOpenUpload('id') : undefined}
          />
          <StepRow
            done={coiDone}
            label="2. Certificate of Insurance (COI) — required for profile approval"
            detail={coi.detail}
            actionLabel={!coiDone && coiCanUpload ? 'Add COI' : undefined}
            onAction={!coiDone && coiCanUpload ? () => setOpenUpload('coi') : undefined}
          />
          <StepRow
            done={guardCardDone}
            label="3. BSIS Guard Card — required to work"
            detail={
              guardCardDone
                ? 'On file — staff will verify at activation'
                : guardCardAwaitingReview(guard)
                  ? 'Submitted — awaiting staff verification'
                  : 'Upload your guard card document photo'
            }
            actionLabel={guardCardCanUpload ? 'Add guard card' : undefined}
            onAction={guardCardCanUpload ? () => setOpenUpload('guardCard') : undefined}
          />
          <StepRow
            done={ptaDone}
            label="4. Power to Arrest & Appropriate Use of Force (8 hr) — required to work"
            detail={
              ptaDone ? 'PTA/UOF training on file' : `Upload your PTA/UOF certificate. ${PTA_UOF_UPLOAD_GUIDANCE}`
            }
            actionLabel={ptaCanUpload ? 'Add PTA/UOF' : undefined}
            onAction={ptaCanUpload ? () => setOpenUpload('pta') : undefined}
          />
          <StepRow
            done={blockDone}
            label="5. 32-hour BSIS course block — required to work"
            detail={
              blockDone
                ? progress.thirtyTwoHourRollup
                  ? '32-hour completion certificate on file'
                  : `All ${progress.total32HourCourses} courses on file`
                : progress.thirtyTwoHourRollup || progress.uploaded32HourCount > 0
                  ? `${formatThirtyTwoHourCourseProgressCounts(progress)} — keep uploading courses`
                  : 'Upload all 9 course certificates or one 32-hour completion certificate'
            }
            actionLabel={blockCanUpload ? 'Add 32-hour training' : undefined}
            onAction={blockCanUpload ? () => setOpenUpload('thirtyTwoHour') : undefined}
          />
          <div className="flex items-start gap-3 pt-3">
            <span className="w-5 h-5 rounded-full bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center shrink-0 mt-0.5">
              <Plus className="w-3 h-3 text-brand-primary" strokeWidth={2.5} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-tight text-brand-text">Optional credentials</p>
              <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                Firearms, medical, FEMA, and more can be added after activation from your profile.
              </p>
            </div>
          </div>
        </div>
        {!approved && checklist.canStaffApprove && (
          <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
            Staff is reviewing your credentials. Verified and pending items are locked until review finishes.
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
        <GuardCoiDetailModal
          guard={guard}
          canEdit={guardCoiCanGuardEdit(guard)}
          initialEditMode
          onSave={onSaveInsurance}
          onClose={closeUpload}
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

      {openUpload === 'pta' && (
        <GuardPtaUofPanel
          guard={guard}
          editing
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          activationFormOnly={{ open: true, onClose: closeUpload, catalogId: BSIS_PTA_UOF_COMBINED_ID }}
        />
      )}

      {openUpload === 'thirtyTwoHour' && (
        <GuardThirtyTwoHourPanel
          guard={guard}
          editing
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          activationFormOnly={{
            open: true,
            onClose: closeUpload,
            catalogId: THIRTY_TWO_HOUR_ROLLUP_IDS[0] ?? 'bsis-32-hour-completed',
          }}
        />
      )}
    </>
  );
}
