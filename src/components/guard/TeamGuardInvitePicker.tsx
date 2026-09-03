import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { findGuardScheduleConflict, type ScheduleJob } from '../../lib/guardSchedule';
import { guardHasJobTeamAssociation } from '../../lib/guardTeams';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { Star, UserPlus } from 'lucide-react';

interface TeamGuardInvitePickerProps {
  job: GuardJobView;
  currentGuardId: string;
  guards: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onInvite: (guardId: string) => void | Promise<void>;
}

function guardMatchesSearch(guard: SecurityGuard, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    guard.name.toLowerCase().includes(q) ||
    guard.badgeNumber.toLowerCase().includes(q) ||
    (guard.email ?? '').toLowerCase().includes(q)
  );
}

export function TeamGuardInvitePicker({
  job,
  currentGuardId,
  guards,
  scheduleRequests = [],
  onInvite,
}: TeamGuardInvitePickerProps) {
  const [search, setSearch] = useState('');
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const slots = job.guardSlots ?? [];
  const taken = useMemo(
    () => new Set(slots.map((s) => s.guardId).filter(Boolean) as string[]),
    [slots]
  );

  const candidates = useMemo(() => {
    return guards
      .filter((g) => {
        if (g.id === currentGuardId || taken.has(g.id)) return false;
        if (g.userStatus !== 'active' || !g.verified) return false;
        if (findGuardScheduleConflict(g.id, job, scheduleRequests)) return false;
        if (guardHasJobTeamAssociation(slots, g.id)) return false;
        return guardMatchesSearch(g, search);
      })
      .sort((a, b) => b.rating - a.rating || b.jobsCompleted - a.jobsCompleted);
  }, [guards, job, currentGuardId, scheduleRequests, search, slots, taken]);

  const handleInvite = async (guardId: string) => {
    setInvitingId(guardId);
    try {
      await onInvite(guardId);
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
        Invite a guard to this job
      </label>
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or badge…"
        aria-label="Search guards to invite"
      />
      <div className="max-h-56 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface divide-y divide-brand-border/80">
        {candidates.length === 0 ? (
          <p className="text-xs text-brand-text-muted px-3 py-4 text-center">
            {search.trim()
              ? 'No guards match your search.'
              : 'No available guards to invite right now.'}
          </p>
        ) : (
          candidates.map((g) => (
            <div key={g.id} className="flex items-center gap-3 px-3 py-2.5">
              <ProfileAvatar src={g.avatar} name={g.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-text truncate">{g.name}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-brand-text-muted">#{g.badgeNumber}</span>
                  {g.rating > 0 && (
                    <span className="text-xs text-brand-text-muted inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                      {g.rating.toFixed(1)}
                    </span>
                  )}
                  {g.jobsCompleted > 0 && (
                    <WfBadge tone="default">{g.jobsCompleted} jobs</WfBadge>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={invitingId === g.id}
                onClick={() => void handleInvite(g.id)}
                className="app-button-primary app-btn-sm shrink-0 inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {invitingId === g.id ? 'Sending…' : 'Invite'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
