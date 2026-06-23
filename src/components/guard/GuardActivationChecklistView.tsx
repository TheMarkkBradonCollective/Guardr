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
    <div className="flex items-start gap-3 py-0.5">
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
    <div className="flex items-start gap-3 pt-3 mt-2 border-t border-brand-border">
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
      <p className="text-base font-black tracking-tight">{approved ? 'Awaiting account activation' : 'Your application'}</p>
      <p className="text-sm text-brand-text-muted leading-relaxed mt-1.5 font-medium">
        All four items below are required to work field jobs. Upload your government ID, BSIS Guard Card, PTA/UOF
        training, and 32-hour BSIS courses in your profile — you can add everything at once. Staff reviews your
        guard card and certs to activate your account.
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
          Staff is reviewing your credentials. You can keep uploading your guard card and certs while you wait.
        </p>
      )}
      {approved && !guardMeetsLevel1(guard) && (
        <p className="text-xs text-brand-primary font-bold pt-3 border-t border-brand-border mt-3 tracking-tight">
          Upload your guard card and required certs with document photos in Credentials so staff can activate your
          account.
        </p>
      )}
    </div>
  );
}
