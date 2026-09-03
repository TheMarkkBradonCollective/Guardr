import React, { useMemo, useState } from 'react';
import { Client, SecurityGuard } from '../../types';
import { activeRosterEntries } from '../../lib/securityCompanyRoster';
import { AppButton } from '../ui/AppButton';
import { AppEmptyState, AppScreen, AppSection, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { getGuardDisplayHeadline } from '../../lib/guardResume';
import { Star, UserMinus, UserPlus } from 'lucide-react';

interface SecurityCompanyRosterScreenProps {
  client: Client;
  guards: SecurityGuard[];
  marketplaceGuards: SecurityGuard[];
  onAddToRoster: (guardId: string) => void | Promise<void>;
  onRemoveFromRoster: (guardId: string) => void | Promise<void>;
  onRequestGuard?: (guard: SecurityGuard) => void;
  onBack?: () => void;
}

export function SecurityCompanyRosterScreen({
  client,
  guards,
  marketplaceGuards,
  onAddToRoster,
  onRemoveFromRoster,
  onRequestGuard,
  onBack,
}: SecurityCompanyRosterScreenProps) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const rosterEntries = activeRosterEntries(client);
  const rosterGuards = useMemo(() => {
    const byId = new Map(guards.map((g) => [g.id, g]));
    return rosterEntries
      .map((e) => ({ entry: e, guard: byId.get(e.guardId) }))
      .filter((row) => row.guard) as { entry: (typeof rosterEntries)[0]; guard: SecurityGuard }[];
  }, [guards, rosterEntries]);

  const rosterIds = new Set(rosterEntries.map((e) => e.guardId));
  const addCandidates = marketplaceGuards
    .filter((g) => !rosterIds.has(g.id))
    .filter((g) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return g.name.toLowerCase().includes(q) || g.badgeNumber.toLowerCase().includes(q);
    })
    .slice(0, 20);

  return (
    <AppScreen>
      <AppSubScreenHeader title="Company roster" onBack={onBack} />
      <div className="px-4 pb-8 space-y-4">
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Independent marketplace guards you book repeatedly. This is not employment — each job still
          goes through Guardr booking and client approval.
        </p>

      <AppSection title={`On roster (${rosterGuards.length})`}>
        {rosterGuards.length === 0 ? (
          <AppEmptyState
            title="No roster guards yet"
            message="Guards you complete jobs with can be added here, or browse the marketplace below."
          />
        ) : (
          <div className="space-y-2">
            {rosterGuards.map(({ entry, guard }) => (
              <div
                key={entry.id}
                className="rounded-xl border border-brand-border bg-brand-surface px-3 py-3 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <ProfileAvatar src={guard.avatar} name={guard.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-text">{guard.name}</p>
                    <p className="text-xs text-brand-text-muted">{getGuardDisplayHeadline(guard)}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <WfBadge tone="default">#{guard.badgeNumber}</WfBadge>
                      {guard.rating > 0 && (
                        <span className="text-xs text-brand-text-muted inline-flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                          {guard.rating.toFixed(1)}
                        </span>
                      )}
                      <WfBadge tone="primary">{entry.source === 'marketplace' ? 'Marketplace' : 'Manual'}</WfBadge>
                    </div>
                    <CertBadgeRow guard={guard} max={4} className="mt-2" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {onRequestGuard && (
                    <AppButton variant="primary" size="sm" onClick={() => onRequestGuard(guard)}>
                      Post overflow job
                    </AppButton>
                  )}
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() => void onRemoveFromRoster(guard.id)}
                    startEnhancer={<UserMinus className="w-3.5 h-3.5" />}
                  >
                    Remove
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppSection>

      <AppSection
        title="Add from marketplace"
        actionLabel={showAdd ? 'Hide' : 'Browse'}
        onAction={() => setShowAdd((v) => !v)}
      >
        {showAdd && (
          <div className="space-y-3">
            <WfSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search guards…"
              aria-label="Search marketplace guards for roster"
            />
            <div className="space-y-2">
              {addCandidates.length === 0 ? (
                <p className="text-xs text-brand-text-muted text-center py-4">No guards match.</p>
              ) : (
                addCandidates.map((guard) => (
                  <div
                    key={guard.id}
                    className="flex items-center gap-3 rounded-lg border border-brand-border px-3 py-2.5"
                  >
                    <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{guard.name}</p>
                      <p className="text-xs text-brand-text-muted">#{guard.badgeNumber}</p>
                    </div>
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={() => void onAddToRoster(guard.id)}
                      startEnhancer={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      Add
                    </AppButton>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </AppSection>
      </div>
    </AppScreen>
  );
}
