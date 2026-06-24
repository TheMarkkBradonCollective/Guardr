import React from 'react';
import { SecurityGuard, SecurityRequest, JobGuardSlot } from '../../types';
import { teamRosterSummary } from '../../lib/guardTeams';
import { confirmApproveFullTeam, confirmDenyFullTeam } from '../../lib/importantActionConfirm';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
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
  onApproveFullTeam?: () => void | Promise<void>;
  onDenyFullTeam?: () => void | Promise<void>;
}

export function JobTeamRoster({
  job,
  guards,
  variant = 'client',
  currentGuardId,
  showFullTeamActions = false,
  onApproveFullTeam,
  onDenyFullTeam,
}: JobTeamRosterProps) {
  const guardsNeeded = job.guardsNeeded ?? 1;
  if (guardsNeeded <= 1 && !(job.guardSlots?.length ?? 0)) return null;

  const slots = job.guardSlots ?? [];
  const summary = teamRosterSummary(slots, guardsNeeded);

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface-elevated/40 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-text">
          {variant === 'client' && showFullTeamActions ? 'Full crew request' : 'Team roster'}
        </p>
        <WfBadge tone={summary.open > 0 ? 'warning' : 'primary'}>
          {summary.filled}/{summary.total} filled
          {summary.open > 0 ? ` · ${summary.open} open` : ''}
        </WfBadge>
      </div>

      {variant === 'client' && showFullTeamActions && (
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Every guard on this coordinated crew has confirmed. Approve or decline the full team as one request.
        </p>
      )}

      <div className="space-y-2">
        {Array.from({ length: guardsNeeded }, (_, i) => {
          const slotIndex = i + 1;
          const slot =
            slots.find((s) => s.slotIndex === slotIndex) ??
            ({
              slotIndex,
              status: 'open',
              isLead: slotIndex === 1,
            } as JobGuardSlot);
          const guard = slot.guardId ? guards.find((g) => g.id === slot.guardId) : undefined;
          const isSelf = currentGuardId && slot.guardId === currentGuardId;

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
                  {slot.isLead && guard && <WfBadge tone="primary">Coordinator</WfBadge>}
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
              </div>
            </div>
          );
        })}
      </div>

      {showFullTeamActions && onApproveFullTeam && onDenyFullTeam && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-brand-border">
          <button
            type="button"
            onClick={() => {
              void (async () => {
                if (!(await confirmApproveFullTeam(job.title, guardsNeeded))) return;
                await onApproveFullTeam();
              })();
            }}
            className="app-button-primary app-btn-sm"
          >
            Approve full crew
          </button>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                if (!(await confirmDenyFullTeam(job.title, guardsNeeded))) return;
                await onDenyFullTeam();
              })();
            }}
            className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
          >
            Decline full crew
          </button>
        </div>
      )}
    </div>
  );
}
