import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { filterGuardsByQuery, getBrowsableGuards } from '../../lib/guardDirectory';
import { getGuardDisplayHeadline, getGuardDisplaySummary } from '../../lib/guardResume';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { Star } from 'lucide-react';

interface GuardDirectoryScreenProps {
  guards: SecurityGuard[];
  onSelectGuard: (guard: SecurityGuard) => void;
  onBack?: () => void;
}

export function GuardDirectoryScreen({ guards, onSelectGuard, onBack }: GuardDirectoryScreenProps) {
  const [query, setQuery] = useState('');

  const browseable = useMemo(() => getBrowsableGuards(guards), [guards]);
  const filtered = useMemo(() => filterGuardsByQuery(browseable, query), [browseable, query]);

  return (
    <div className="h-full flex flex-col overflow-hidden client-content-shell">
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
        {onBack && (
          <button type="button" onClick={onBack} className="text-sm font-medium text-brand-primary">
            ← Back
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Find a guard</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Read full resumes, licenses, and experience — or post a general job from Home.
          </p>
        </div>
        <WfSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, skills, or experience…"
        />
        <p className="text-xs text-brand-text-muted">{filtered.length} guard{filtered.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="guard-scroll-panel flex-1 px-4 pb-8">
        {filtered.length === 0 ? (
          <p className="app-empty-state text-sm">
            No guards match your search. Try a general security request instead.
          </p>
        ) : (
          <AppItemCardStack>
            {filtered.map((guard) => (
              <WfListCard
                key={guard.id}
                avatar={
                  <ProfileAvatar src={guard.avatar} name={guard.name} size="md" rounded="xl" className="w-14 h-14 text-base" />
                }
                title={guard.name}
                subtitle={getGuardDisplayHeadline(guard)}
                meta={
                  <div>
                    <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                      {guard.isStaff && <WfBadge tone="primary">Staff</WfBadge>}
                      <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
                      <span>{guard.rating.toFixed(1)}</span>
                      <span>·</span>
                      <span>{guard.jobsCompleted} jobs</span>
                      {guard.yearsExperience != null && guard.yearsExperience > 0 && (
                        <>
                          <span>·</span>
                          <span>{guard.yearsExperience}yr exp</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-brand-text-muted mt-1 line-clamp-2">{getGuardDisplaySummary(guard)}</p>
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <CertBadgeRow guard={guard} showCaBaseline={false} />
                    </div>
                  </div>
                }
                onClick={() => onSelectGuard(guard)}
              />
            ))}
          </AppItemCardStack>
        )}
      </div>
    </div>
  );
}
