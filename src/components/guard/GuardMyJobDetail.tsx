import React, { useState } from 'react';
import { JobChatThread, SecurityGuard, SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import type { ScheduleJob } from '../../lib/guardSchedule';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { canGuardApproveOvertime } from '../../lib/shiftBilling';
import { buildIncidentReportViews, listIncidentReportsForRequest } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { GuardJobCard } from './GuardJobCard';
import { ViewPreShiftBriefingButton } from './ViewPreShiftBriefingButton';
import { guardCanOpenPreShiftBriefing } from '../../lib/preShiftBriefing';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';

export interface GuardMyJobDetailProps {
  job: GuardJobView;
  guard: SecurityGuard;
  jobChatThreads: JobChatThread[];
  coworkerGuards?: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onOpenMessages?: (jobId: string) => void;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onApplyAsLead?: (jobId: string) => void | Promise<void>;
  onInviteGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onRemoveGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (
    jobId: string,
    patch: { crewName: string; crewDescription: string }
  ) => void | Promise<void>;
  onAcceptInvite?: (jobId: string) => void | Promise<void>;
  onDeclineInvite?: (jobId: string) => void | Promise<void>;
  onViewBriefing?: (jobId: string) => void;
}

export function GuardMyJobDetail({
  job,
  guard,
  jobChatThreads,
  coworkerGuards,
  scheduleRequests,
  onOpenMessages,
  onApproveOvertime,
  onApplyAsLead,
  onInviteGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
  onViewBriefing,
}: GuardMyJobDetailProps) {
  const [overtimeApproveId, setOvertimeApproveId] = useState<string | null>(null);
  const chatEligible = isJobChatEligible(job);
  const hasChat = chatEligible || threadForRequest(jobChatThreads, job.id);
  const jobAsRequest = job as unknown as SecurityRequest;
  const jobIncidents = buildIncidentReportViews([jobAsRequest], [guard]);
  const hasIncidents = listIncidentReportsForRequest(jobAsRequest).length > 0;
  const showViewBriefing = guardCanOpenPreShiftBriefing(job, guard.id) && !!onViewBriefing;

  return (
    <div className="px-5 pb-8 space-y-4">
      <GuardJobCard
        job={job}
        guard={guard}
        coworkerGuards={coworkerGuards}
        scheduleRequests={scheduleRequests}
        onApplyAsLead={
          onApplyAsLead && job.status === 'open'
            ? () => void onApplyAsLead(job.id)
            : undefined
        }
        onInviteGuard={
          onInviteGuard && job.status === 'open'
            ? (guardId) => void onInviteGuard(job.id, guardId)
            : undefined
        }
        onRemoveGuard={
          onRemoveGuard && job.status === 'open'
            ? (guardId) => void onRemoveGuard(job.id, guardId)
            : undefined
        }
        onUpdateCrewProfile={
          onUpdateCrewProfile && job.status === 'open'
            ? (patch) => void onUpdateCrewProfile(job.id, patch)
            : undefined
        }
        onAcceptInvite={
          onAcceptInvite && job.status === 'open'
            ? () => void onAcceptInvite(job.id)
            : undefined
        }
        onDeclineInvite={
          onDeclineInvite && job.status === 'open'
            ? () => void onDeclineInvite(job.id)
            : undefined
        }
      />
      {showViewBriefing && (
        <ViewPreShiftBriefingButton onClick={() => onViewBriefing!(job.id)} />
      )}
      {hasIncidents && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Incident reports filed</p>
          {jobIncidents.map((incident) => (
            <div key={incident.id} className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
              <IncidentReportDetailView report={incident} compact />
            </div>
          ))}
        </div>
      )}
      {canGuardApproveOvertime(job) && onApproveOvertime && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 space-y-3">
          <p className="text-sm font-semibold text-amber-300">Late clock-out overtime</p>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            You clocked out {(job.overtimeHours ?? 0)}h after scheduled end.
            Confirm to request ${(job.overtimeGuardEarnings ?? 0).toFixed(2)} in additional pay.
          </p>
          <button
            type="button"
            onClick={async () => {
              setOvertimeApproveId(job.id);
              try {
                await onApproveOvertime(job.id);
              } finally {
                setOvertimeApproveId(null);
              }
            }}
            disabled={overtimeApproveId === job.id}
            className="w-full app-button-primary !h-10 gap-1.5 disabled:opacity-50"
          >
            {overtimeApproveId === job.id ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Approve overtime</>
            )}
          </button>
        </div>
      )}
      {onOpenMessages && hasChat && (
        <button
          type="button"
          onClick={() => onOpenMessages(job.id)}
          className="w-full app-button-outline !h-11 flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {chatEligible ? 'Message client' : 'View job chat'}
        </button>
      )}
    </div>
  );
}
