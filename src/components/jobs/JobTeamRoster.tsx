import React from 'react';
import { SecurityGuard, SecurityRequest, JobGuardSlot } from '../../types';
import { teamRosterSummary, getCrewDisplayName } from '../../lib/guardTeams';
import { CrewDetailsEditor } from '../guard/CrewDetailsEditor';
import { confirmApproveFullTeam, confirmApproveTeamSlot, confirmDenyFullTeam, confirmDenyTeamSlot } from '../../lib/importantActionConfirm';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { Check, Clock, UserPlus } from 'lucide-react';

const SLOT_STATUS_LABEL: Record<JobGuardSlot['status'], string> = {
  open: 'Open slot',
  invited: 'Invited — awaiting response',
  pending_staff: 'Awaiting Guardr review',
  crew_confirmed: 'Confirmed on crew — waiting for full roster',
  pending_client: 'Awaiting client approval',
  approved: 'Approved',
  declined: 'Declined',
  expired: 'Invite expired',
  withdrawn: 'Withdrawn',
};

interface JobTeamRosterProps {
  job: SecurityRequest;
  guards: SecurityGuard[];
  variant?: 'client' | 'guard' | 'staff';
  currentGuardId?: string;
  onApproveSlot?: (slotId: string) => void | Promise<void>;
  onDenySlot?: (slotId: string) => void | Promise<void>;
  showFullTeamActions?: boolean;
  showIndependentSlotActions?: boolean;
  onApproveFullTeam?: () => void | Promise<void>;
  onDenyFullTeam?: () => void | Promise<void>;
  onStaffApproveSlot?: (guardId: string) => void | Promise<void>;
  onStaffDenySlot?: (guardId: string) => void | Promise<void>;
  onStaffRemoveFromCrew?: (guardId: string) => void | Promise<void>;
  /** When set, only render these slot indices (for independent pending view). */
  slotFilter?: (slot: JobGuardSlot) => boolean;
  title?: string;
}

export function JobTeamRoster({
  job,
  guards,
  variant = 'client',
  currentGuardId,
  onApproveSlot,
  onDenySlot,
  showFullTeamActions = false,
  showIndependentSlotActions = false,
  onApproveFullTeam,
  onDenyFullTeam,
  onStaffApproveSlot,
  onStaffDenySlot,
  onStaffRemoveFromCrew,
  slotFilter,
  title,
}: JobTeamRosterProps) {
  const guardsNeeded = job.guardsNeeded ?? 1;
  if (guardsNeeded <= 1 && !(job.guardSlots?.length ?? 0)) return null;

  const slots = job.guardSlots ?? [];
  const summary = teamRosterSummary(slots, guardsNeeded);
  const heading =
    title ??
    (variant === 'client' && showFullTeamActions
      ? 'Full crew request'
      : variant === 'client' && showIndependentSlotActions
        ? 'Independent guard requests'
        : 'Team roster');

  const slotIndices = Array.from({ length: guardsNeeded }, (_, i) => i + 1).filter((slotIndex) => {
    const slot =
      slots.find((s) => s.slotIndex === slotIndex) ??
      ({ slotIndex, status: 'open' as const, isLead: slotIndex === 1 } as JobGuardSlot);
    return slotFilter ? slotFilter(slot) : true;
  });

  if (slotIndices.length === 0) return null;

  const coordinator = guards.find((g) => g.id === job.teamLeadId);
  const crewTitle = getCrewDisplayName(job, coordinator?.name);

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface-elevated/40 px-3 py-3 space-y-3">
      {(job.crewName?.trim() || job.crewDescription?.trim()) && (
        <CrewDetailsEditor
          jobTitle={job.title}
          coordinatorName={coordinator?.name ?? 'Crew coordinator'}
          crewName={job.crewName}
          crewDescription={job.crewDescription}
        />
      )}
      {variant === 'client' && showFullTeamActions && !job.crewName?.trim() && !job.crewDescription?.trim() && (
        <p className="text-sm font-semibold text-brand-text">{crewTitle}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-text">
          {title ?? (variant === 'client' && showFullTeamActions ? 'Full crew request' : heading)}
        </p>
        {!slotFilter && (
          <WfBadge tone={summary.open > 0 ? 'warning' : 'primary'}>
            {summary.filled}/{summary.total} filled
            {summary.open > 0 ? ` · ${summary.open} open` : ''}
          </WfBadge>
        )}
      </div>

      {variant === 'client' && showFullTeamActions && (
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Every guard on this coordinated crew has confirmed. Approve or decline the full team as one request.
        </p>
      )}

      {variant === 'client' && showIndependentSlotActions && (
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Approve guards individually to build your roster, or choose a full coordinated crew if one is also ready.
        </p>
      )}

      <div className="space-y-2">
        {slotIndices.map((slotIndex) => {
          const slot =
            slots.find((s) => s.slotIndex === slotIndex) ??
            ({
              slotIndex,
              status: 'open',
              isLead: slotIndex === 1,
            } as JobGuardSlot);
          const guard = slot.guardId ? guards.find((g) => g.id === slot.guardId) : undefined;
          const isSelf = currentGuardId && slot.guardId === currentGuardId;
          const showClientActions =
            variant === 'client' &&
            showIndependentSlotActions &&
            slot.status === 'pending_client' &&
            !!onApproveSlot &&
            !!onDenySlot &&
            !!guard;
          const showStaffReviewActions =
            variant === 'staff' &&
            slot.status === 'pending_staff' &&
            !!guard &&
            !!onStaffApproveSlot &&
            !!onStaffDenySlot;
          const showStaffRemoveAction =
            variant === 'staff' &&
            !!guard &&
            !!onStaffRemoveFromCrew &&
            ['invited', 'pending_staff', 'crew_confirmed'].includes(slot.status) &&
            slot.guardId !== job.teamLeadId &&
            !slot.isLead;

          return (
            <div
              key={slot.id ?? `slot-${slotIndex}`}
              className="flex items-start gap-3 rounded-lg border border-brand-border/80 bg-brand-surface px-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-brand-surface-elevated flex items-center justify-center shrink-0 text-xs font-bold text-brand-text-muted">
                {slotIndex}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {guard ? (
                    <>
                      <ProfileAvatar src={guard.avatar} name={guard.name} size="xs" />
                      <span className="text-sm font-semibold text-brand-text">
                        {guard.name}
                        {isSelf ? ' (you)' : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-brand-text-muted inline-flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      Open slot — needs a guard
                    </span>
                  )}
                  {slot.isLead && guard && showFullTeamActions && (
                    <WfBadge tone="primary">Coordinator</WfBadge>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted">{SLOT_STATUS_LABEL[slot.status]}</p>
                {slot.status === 'invited' && slot.inviteExpiresAt && (
                  <p className="text-xs text-amber-500/90 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires {new Date(slot.inviteExpiresAt).toLocaleString()}
                  </p>
                )}
                {slot.status === 'approved' && (
                  <p className="text-xs text-emerald-500 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Confirmed for this job
                  </p>
                )}
                {showClientActions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        void (async () => {
                          if (!(await confirmApproveTeamSlot(guard.name, job.title))) return;
                          await onApproveSlot!(slot.id!);
                        })();
                      }}
                    >
                      Approve {guard.name}
                    </AppButton>
                    <AppButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        void (async () => {
                          if (!(await confirmDenyTeamSlot(guard.name, job.title))) return;
                          await onDenySlot!(slot.id!);
                        })();
                      }}
                    >
                      Decline
                    </AppButton>
                  </div>
                )}
                {showStaffReviewActions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={() => void onStaffApproveSlot!(guard!.id)}
                    >
                      Approve for crew
                    </AppButton>
                    <AppButton
                      variant="danger"
                      size="sm"
                      onClick={() => void onStaffDenySlot!(guard!.id)}
                    >
                      Decline
                    </AppButton>
                  </div>
                )}
                {showStaffRemoveAction && (
                  <div className="pt-1">
                    <AppButton
                      variant="danger"
                      size="sm"
                      onClick={() => void onStaffRemoveFromCrew!(guard!.id)}
                    >
                      Remove from crew
                    </AppButton>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showFullTeamActions && onApproveFullTeam && onDenyFullTeam && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-brand-border">
          <AppButton
            variant="primary"
            size="sm"
            onClick={() => {
              void (async () => {
                if (!(await confirmApproveFullTeam(job.title, guardsNeeded))) return;
                await onApproveFullTeam();
              })();
            }}
          >
            Approve full crew
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            onClick={() => {
              void (async () => {
                if (!(await confirmDenyFullTeam(job.title, guardsNeeded))) return;
                await onDenyFullTeam();
              })();
            }}
          >
            Decline full crew
          </AppButton>
        </div>
      )}
    </div>
  );
}
