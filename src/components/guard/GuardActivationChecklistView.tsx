import React from 'react';
import { SecurityGuard } from '../../types';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import {
  formatThirtyTwoHourCourseProgressCounts,
  getQualificationProgress,
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  PTA_UOF_UPLOAD_GUIDANCE,
} from '../../lib/guardQualification';
import { WfBadge } from '../ui/wireframe';
import { Check, Circle, Plus } from 'lucide-react';

interface GuardActivationChecklistProps {
  guard: SecurityGuard;
  compact?: boolean;
}

function StepRow({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {done ? (
        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <Circle className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
      )}
      <div>
        <span className={done ? 'text-brand-text' : 'text-brand-text-muted'}>{label}</span>
        {detail && <p className="text-xs text-brand-text-muted mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function OptionalNote({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 text-sm pt-3 mt-1 border-t border-brand-border">
      <Plus className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
      <div>
        <span className="text-brand-text">{label}</span>
        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

export function GuardActivationChecklistView({ guard, compact = false }: GuardActivationChecklistProps) {
  const checklist = getGuardActivationChecklist(guard);
  const approved = isGuardAccountApproved(guard);
  const progress = getQualificationProgress(guard);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <WfBadge tone={checklist.idSubmitted ? 'success' : 'default'}>
          ID {checklist.idSubmitted ? 'on file' : 'needed'}
        </WfBadge>
        <WfBadge tone={checklist.guardCardVerified ? 'success' : checklist.guardCardSubmitted ? 'warning' : 'default'}>
          Guard card {checklist.guardCardVerified ? 'verified' : checklist.guardCardSubmitted ? 'pending' : 'needed'}
        </WfBadge>
        <WfBadge tone={guardMeetsPtaUofTraining(guard) ? 'success' : 'default'}>
          PTA/UOF {guardMeetsPtaUofTraining(guard) ? 'on file' : 'needed'}
        </WfBadge>
        <WfBadge tone={guardMeets32HourBlock(guard) ? 'success' : 'default'}>
          32-hr {guardMeets32HourBlock(guard) ? 'on file' : 'needed'}
        </WfBadge>
        {approved && <WfBadge tone="primary">Profile approved</WfBadge>}
        {checklist.canActivate && !approved && <WfBadge tone="primary">Ready for approval</WfBadge>}
      </div>
    );
  }

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">{approved ? 'Awaiting account activation' : 'Your application'}</p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
        All four items below are required to work field jobs. Upload your government ID, BSIS Guard Card, PTA/UOF
        training, and 32-hour BSIS courses in your profile — you can add everything at once. Staff reviews in order:
        verified ID to approve your profile, then your guard card to activate your account.
      </p>
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
          done={guardMeetsLevel1(guard)}
          label="2. BSIS Guard Card — required to work"
          detail={
            guardMeetsLevel1(guard)
              ? approved
                ? 'Valid guard card on file — staff can activate your account'
                : 'Valid guard card on file — staff will verify at activation'
              : checklist.guardCardSubmitted
                ? approved
                  ? 'On file — staff must confirm valid before activation'
                  : 'On file — verified after profile approval'
                : 'Upload in the Guard Card section of your profile'
          }
        />
        <StepRow
          done={guardMeetsPtaUofTraining(guard)}
          label="3. Power to Arrest & Appropriate Use of Force (8 hr) — required to work"
          detail={
            guardMeetsPtaUofTraining(guard)
              ? 'PTA/UOF training on file'
              : `Upload in Credentials. ${PTA_UOF_UPLOAD_GUIDANCE}`
          }
        />
        <StepRow
          done={guardMeets32HourBlock(guard)}
          label="4. 32-hour BSIS course block — required to work"
          detail={
            guardMeets32HourBlock(guard)
              ? progress.thirtyTwoHourRollup
                ? '32-hour completion certificate on file'
                : `All ${progress.total32HourCourses} courses on file`
              : progress.thirtyTwoHourRollup || progress.uploaded32HourCount > 0
                ? `${formatThirtyTwoHourCourseProgressCounts(progress)} — finish in Credentials under 32-Hour BSIS Course Block`
                : 'Upload in Credentials — all 9 individual course certificates or one 32-hour completion certificate.'
          }
        />
        <OptionalNote
          label="Add extra credentials (optional)"
          detail="Firearms permits, medical certs, FEMA, and more can be added anytime — not required for profile approval or activation."
        />
      </div>
      {!approved && checklist.canStaffApprove && (
        <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
          ID verified — staff can approve your profile. You can keep uploading guard card and other credentials while
          you wait.
        </p>
      )}
      {approved && !guardMeetsLevel1(guard) && (
        <p className="text-xs text-amber-400 font-medium pt-3 border-t border-brand-border mt-3">
          Upload a valid BSIS Guard Card with document photos in Credentials so staff can activate your account.
        </p>
      )}
    </div>
  );
}
