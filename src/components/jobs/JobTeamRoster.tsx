import React from 'react';
import { SecurityGuard, SecurityRequest, JobGuardSlot } from '../../types';
import type { GuardJobView } from '../../lib/guardJobView';
import { teamRosterSummary } from '../../lib/guardTeams';
import { confirmApproveTeamSlot, confirmDenyTeamSlot } from '../../lib/importantActionConfirm';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { Check, Clock, UserPlus } from 'lucide-react';

const SLOT_STATUS_LABEL: Record<JobGuardSlot['status'], string> = {
  open: 'Open slot',
  invited: 'Invited — awaiting response',
  pending_staff: 'Awaiting Guardr review',
  crew_confirmed: 'Confirmed — waiting for roster',
  pending_client: 'Awaiting client approval',
  approved: 'Approved',
  declined: 'Declined',
  expired: 'Invite expired',
  withdrawn: 'Withdrawn',
};

interface JobTeamRosterProps {
  job: SecurityRequest | GuardJobView;
  guards: SecurityGuard[];
  variant?: 'client' | 'guard' | 'staff';
  currentGuardId?: string;
  onApproveSlot?: (slotId: string) => void | Promise<void>;
  onDenySlot?: (slotId: string) => void | Promise<void>;
  showIndependentSlotActions?: boolean;
  onStaffApproveSlot?: (guardId: string) => void | Promise<void>;
  onStaffDenySlot?: (guardId: string) => void | Promise<void>;
  onStaffRemoveFromSlot?: (guardId: string) => void | Promise<void>;
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
  showIndependentSlotActions = false,
  onStaffApproveSlot,
  onStaffDenySlot,
  onStaffRemoveFromSlot,
  slotFilter,
  title,
}: JobTeamRosterProps) {
  const guardsNeeded = job.guardsNeeded ?? 1;
  if (guardsNeeded <= 1 && !(job.guardSlots?.length ?? 0)) return null;

  const slots = job.guardSlots ?? [];
  const summary = teamRosterSummary(slots, guardsNeeded);
  const heading = title ?? (variant === 'client' && showIndependentSlotActions ? 'Guard requests' : 'Guards on this job');

  const slotIndices = Array.from({ length: guardsNeeded }, (_, i) => i + 1).filter((slotIndex) => {
    const slot =
      slots.find((s) => s.slotIndex === slotIndex) ??
      ({ slotIndex, status: 'open' as const, isLead: slotIndex === 1 } as JobGuardSlot);
    return slotFilter ? slotFilter(slot) : true;
  });

  if (slotIndices.length === 0) return null;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface-elevated/40 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-text">{heading}</p>
        {!slotFilter && (
          <WfBadge tone={summary.open > 0 ? 'warning' : 'primary'}>
            {summary.filled}/{summary.total} filled
            {summary.open > 0 ? ` · ${summary.open} open` : ''}
          </WfBadge>
        )}
      </div>

      {variant === 'client' && showIndependentSlotActions && (
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Approve guards individually to build your roster for this multi-guard job.
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
            !!onStaffRemoveFromSlot &&
            ['invited', 'pending_staff', 'crew_confirmed'].includes(slot.status) &&
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
                  {slot.isLead && guard && (
                    <WfBadge tone="primary">Lead slot</WfBadge>
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
                      Approve guard
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
                      onClick={() => void onStaffRemoveFromSlot!(guard!.id)}
                    >
                      Remove from slot
                    </AppButton>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
