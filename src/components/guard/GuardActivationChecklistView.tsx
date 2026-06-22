import React from 'react';
import { SecurityGuard } from '../../types';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import {
  guardHasVerifiedIdForWork,
  guardHasCredentialListed,
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
        {approved && <WfBadge tone="primary">Profile approved</WfBadge>}
        {checklist.canActivate && !approved && <WfBadge tone="primary">Ready for approval</WfBadge>}
      </div>
    );
  }

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">{approved ? 'Awaiting account activation' : 'Your application'}</p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
        Upload your government ID, BSIS Guard Card, and other credentials in your profile — you can add everything at
        once. Staff reviews in order: verified ID to approve your profile, then your guard card to activate your
        account.
      </p>
      <div className="app-checklist-steps">
        <StepRow
          done={approved || guardHasVerifiedIdForWork(guard)}
          label="1. Government ID — profile approval"
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
          label="2. BSIS Guard Card — account activation"
          detail={
            guardMeetsLevel1(guard)
              ? approved
                ? 'Valid guard card on file — staff can activate your account'
                : 'Valid guard card on file — staff will verify at activation'
              : guardHasCredentialListed(guard, 'bsis-guard-card')
                ? approved
                  ? 'Guard card listed — upload document photo so staff can activate your account'
                  : 'Guard card listed — add document photo before activation'
                : checklist.guardCardSubmitted
                  ? approved
                    ? 'On file — staff must confirm valid before activation'
                    : 'On file — verified after profile approval'
                  : 'Upload in the Guard Card section of your profile'
          }
        />
        <StepRow
          done={guardMeetsPtaUofTraining(guard)}
          label="Power to Arrest & Appropriate Use of Force (8 hr)"
          detail={
            guardMeetsPtaUofTraining(guard)
              ? 'PTA/UOF training on file'
              : `Required to work field jobs — upload in Credentials. ${PTA_UOF_UPLOAD_GUIDANCE}`
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
          {guardHasCredentialListed(guard, 'bsis-guard-card')
            ? 'Your guard card is listed but not on file — upload a document photo so staff can activate your account.'
            : 'Upload a valid BSIS Guard Card so staff can activate your account.'}
        </p>
      )}
    </div>
  );
}
