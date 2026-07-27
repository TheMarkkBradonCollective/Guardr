import React from 'react';
import { SecurityGuard } from '../../types';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import {
  guardHasValidInsurance,
  guardInsuranceActivationDetail,
} from '../../lib/guardInsurance';
import {
  getQualificationProgress,
  guardHasVerifiedIdForWork,
  guardMeetsContinuingEducation,
  guardMeetsLevel1,
  guardMeetsMandatoryTraining,
  PTA_UOF_UPLOAD_GUIDANCE,
} from '../../lib/guardQualification';
import { WfBadge } from '../ui/wireframe';
import { Check, Plus } from 'lucide-react';

interface GuardActivationChecklistProps {
  guard: SecurityGuard;
  compact?: boolean;
}

function StepRow({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
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
        <p className={`text-sm font-bold tracking-tight leading-snug ${done ? 'text-brand-text' : 'text-brand-text-muted'}`}>{label}</p>
        {detail && <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{detail}</p>}
      </div>
    </div>
  );
}

function OptionalNote({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 pt-3">
      <span className="w-5 h-5 rounded-full bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center shrink-0 mt-0.5">
        <Plus className="w-3 h-3 text-brand-primary" strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold tracking-tight text-brand-text">{label}</p>
        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

export function GuardActivationChecklistView({ guard, compact = false }: GuardActivationChecklistProps) {
  const checklist = getGuardActivationChecklist(guard);
  const approved = isGuardAccountApproved(guard);
  const progress = getQualificationProgress(guard);
  const coi = guardInsuranceActivationDetail(guard);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <WfBadge tone={checklist.idSubmitted ? 'success' : 'default'}>
          ID {checklist.idSubmitted ? 'on file' : 'needed'}
        </WfBadge>
        <WfBadge tone={checklist.guardCardVerified ? 'success' : checklist.guardCardSubmitted ? 'warning' : 'default'}>
          Guard card {checklist.guardCardVerified ? 'verified' : checklist.guardCardSubmitted ? 'pending' : 'needed'}
        </WfBadge>
        <WfBadge tone={guardHasValidInsurance(guard) ? 'success' : guard.insurancePolicy?.documentUrl ? 'warning' : 'default'}>
          COI {guardHasValidInsurance(guard) ? 'verified' : guard.insurancePolicy?.documentUrl ? 'pending' : 'needed'}
        </WfBadge>
        <WfBadge tone={guardMeetsMandatoryTraining(guard) ? 'success' : 'default'}>
          PTA/UOF {guardMeetsMandatoryTraining(guard) ? 'on file' : 'needed'}
        </WfBadge>
        <WfBadge tone={guardMeetsContinuingEducation(guard) ? 'success' : 'default'}>
          CE courses {guardMeetsContinuingEducation(guard) ? 'on file' : 'needed'}
        </WfBadge>
        {approved && <WfBadge tone="primary">Profile approved</WfBadge>}
        {checklist.canActivate && !approved && <WfBadge tone="primary">Ready for approval</WfBadge>}
      </div>
    );
  }

  return (
    <div className="app-checklist-panel">
      <p className="text-base font-black tracking-tight">{approved ? 'Activation checklist' : 'Your application'}</p>
      <div className="app-checklist-steps">
        <StepRow
          done={approved || guardHasVerifiedIdForWork(guard)}
          label="1. Government ID — required to work"
          detail={
            approved
              ? 'Profile approved — ID verified'
              : checklist.idVerified
                ? guardHasVerifiedIdForWork(guard)
                  ? 'Verified by staff — awaiting profile approval'
                  : 'Verified but expired — update in Credentials'
                : checklist.idSubmitted
                  ? 'Submitted — awaiting staff verification'
                  : 'Upload in Credentials — tap Government ID'
          }
        />
        <StepRow
          done={coi.done}
          label="2. Certificate of Insurance (COI) — required for profile approval"
          detail={coi.detail}
        />
        <StepRow
          done={guardMeetsLevel1(guard)}
          label="3. BSIS Guard Card — required to work"
          detail={
            guardMeetsLevel1(guard)
              ? approved
                ? 'Valid guard card on file — account activates once all credentials are verified'
                : 'Valid guard card on file — staff will verify at activation'
              : checklist.guardCardSubmitted
                ? approved
                  ? 'On file — staff must confirm valid before activation'
                  : 'On file — verified after profile approval'
                : 'Upload in the Guard Card section of your profile'
          }
        />
        <StepRow
          done={guardMeetsMandatoryTraining(guard)}
          label="4. Mandatory training (PTA/UOF) — required to work"
          detail={
            guardMeetsMandatoryTraining(guard)
              ? 'PTA/UOF mandatory training on file'
              : `Upload in Credentials. ${PTA_UOF_UPLOAD_GUIDANCE}`
          }
        />
        <StepRow
          done={guardMeetsContinuingEducation(guard)}
          label="5. Continuing Education (4 mandatory courses) — required to work"
          detail={
            guardMeetsContinuingEducation(guard)
              ? progress.thirtyTwoHourRollup
                ? 'Continuing Education on file (completion certificate)'
                : `All ${progress.totalMandatoryCourses} Continuing Education courses on file`
              : `Upload the 4 BSIS mandatory courses (${progress.uploadedMandatoryCount} of ${progress.totalMandatoryCourses} on file)`
          }
        />
        <OptionalNote
          label="Electives, 8-hr refresher & extras (optional)"
          detail="Elective BSIS courses, annual 8-hour refresher (staff may request later), firearms, medical, FEMA — not required for activation."
        />
      </div>
      {!approved && checklist.canStaffApprove && (
        <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
          Staff is reviewing your credentials. You can keep uploading your guard card and certs while you wait.
        </p>
      )}
    </div>
  );
}
