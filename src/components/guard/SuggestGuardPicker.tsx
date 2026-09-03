import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { findGuardScheduleConflict, type ScheduleJob } from '../../lib/guardSchedule';
import { guardHasJobTeamAssociation } from '../../lib/guardTeams';
import { pendingGuardSuggestions } from '../../lib/guardSuggestions';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { Lightbulb, Star } from 'lucide-react';

interface SuggestGuardPickerProps {
  job: GuardJobView;
  currentGuardId: string;
  guards: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onSuggest: (guardId: string) => void | Promise<void>;
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

export function SuggestGuardPicker({
  job,
  currentGuardId,
  guards,
  scheduleRequests = [],
  onSuggest,
}: SuggestGuardPickerProps) {
  const [search, setSearch] = useState('');
  const [suggestingId, setSuggestingId] = useState<string | null>(null);

  const slots = job.guardSlots ?? [];
  const pendingSuggestions = pendingGuardSuggestions(job);
  const suggestedIds = useMemo(
    () => new Set(pendingSuggestions.map((s) => s.suggestedGuardId)),
    [pendingSuggestions]
  );

  const candidates = useMemo(() => {
    return guards
      .filter((g) => {
        if (g.id === currentGuardId) return false;
        if (job.applicants.includes(g.id)) return false;
        if (suggestedIds.has(g.id)) return false;
        if (g.userStatus !== 'active' || !g.verified) return false;
        if (findGuardScheduleConflict(g.id, job, scheduleRequests)) return false;
        if (guardHasJobTeamAssociation(slots, g.id)) return false;
        return guardMatchesSearch(g, search);
      })
      .sort((a, b) => b.rating - a.rating || b.jobsCompleted - a.jobsCompleted);
  }, [guards, job, currentGuardId, scheduleRequests, search, slots, suggestedIds]);

  const handleSuggest = async (guardId: string) => {
    setSuggestingId(guardId);
    try {
      await onSuggest(guardId);
    } finally {
      setSuggestingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-text">Suggest a guard</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Recommend someone for this job. The guard and client will both be notified — the client
            still approves before anyone is booked.
          </p>
        </div>
      </div>
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search guards to suggest…"
        aria-label="Search guards to suggest"
      />
      <div className="max-h-48 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface divide-y divide-brand-border/80">
        {candidates.length === 0 ? (
          <p className="text-xs text-brand-text-muted px-3 py-4 text-center">
            {search.trim() ? 'No guards match your search.' : 'No guards available to suggest.'}
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
                disabled={suggestingId === g.id}
                onClick={() => void handleSuggest(g.id)}
                className="app-button-outline app-btn-sm shrink-0"
              >
                {suggestingId === g.id ? 'Sending…' : 'Suggest'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
