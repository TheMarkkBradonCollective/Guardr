import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { filterGuardsByQuery, getBrowsableGuards } from '../../lib/guardDirectory';
import { getGuardDisplayHeadline, getGuardDisplaySummary } from '../../lib/guardResume';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack, AppScreen, AppSection, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import {
  GUARD_APPROVED_BADGE_LABEL,
  GUARD_TRUSTED_BADGE_LABEL,
  isGuardProfileApproved,
  isGuardTrusted,
} from '../../lib/guardTrust';
import { Heart, Star } from 'lucide-react';

interface GuardDirectoryScreenProps {
  guards: SecurityGuard[];
  onSelectGuard: (guard: SecurityGuard) => void;
  onBack?: () => void;
  favoriteGuardIds?: string[];
  onToggleFavorite?: (guardId: string) => void | Promise<void>;
}

export function GuardDirectoryScreen({
  guards,
  onSelectGuard,
  onBack,
  favoriteGuardIds = [],
  onToggleFavorite,
}: GuardDirectoryScreenProps) {
  const [query, setQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const browseable = useMemo(() => getBrowsableGuards(guards), [guards]);

  const filtered = useMemo(() => {
    const base = filterGuardsByQuery(browseable, query);
    if (showFavoritesOnly) return base.filter((g) => favoriteGuardIds.includes(g.id));
    // Favourites bubble to the top of the full list
    const favs = base.filter((g) => favoriteGuardIds.includes(g.id));
    const rest = base.filter((g) => !favoriteGuardIds.includes(g.id));
    return [...favs, ...rest];
  }, [browseable, query, showFavoritesOnly, favoriteGuardIds]);

  const favCount = useMemo(
    () => browseable.filter((g) => favoriteGuardIds.includes(g.id)).length,
    [browseable, favoriteGuardIds]
  );

  return (
    <AppScreen>
      {onBack && <AppSubScreenHeader title="Find a guard" onBack={onBack} />}

      <div className="px-5 pb-3 space-y-2 border-b border-brand-border">
        <WfSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, skills, or experience…"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-brand-text-muted">
            {filtered.length} guard{filtered.length !== 1 ? 's' : ''}
            {showFavoritesOnly ? ' favourited' : ' available'}
          </p>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                showFavoritesOnly
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-500'
                  : 'border-brand-border text-brand-text-muted hover:border-rose-500/40 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-rose-500' : ''}`} />
              Favourites{favCount > 0 ? ` (${favCount})` : ''}
            </button>
          )}
        </div>
      </div>

      <AppSection title="Guards">
        {filtered.length === 0 ? (
          <p className="app-empty-state">
            {showFavoritesOnly
              ? 'No favourites yet. Tap the heart on any guard to save them here.'
              : 'No guards match your search. Try a general security request instead.'}
          </p>
        ) : (
          <AppItemCardStack>
            {filtered.map((guard) => {
              const isFav = favoriteGuardIds.includes(guard.id);
              return (
                <div key={guard.id} className="relative">
                  <WfListCard
                    avatar={
                      <ProfileAvatar src={guard.avatar} name={guard.name} size="md" rounded="xl" className="w-14 h-14 text-base" />
                    }
                    title={guard.name}
                    subtitle={getGuardDisplayHeadline(guard)}
                    meta={
                      <div>
                        <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                          {guard.isStaff && <WfBadge tone="primary">Staff</WfBadge>}
                          {isGuardProfileApproved(guard) && <WfBadge tone="success">{GUARD_APPROVED_BADGE_LABEL}</WfBadge>}
                          {isGuardTrusted(guard) && <WfBadge tone="primary">{GUARD_TRUSTED_BADGE_LABEL}</WfBadge>}
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
                  {onToggleFavorite && (
                    <button
                      type="button"
                      aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                      onClick={(e) => {
                        e.stopPropagation();
                        void onToggleFavorite(guard.id);
                      }}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-brand-text-muted hover:text-rose-500 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </AppItemCardStack>
        )}
      </AppSection>
    </AppScreen>
  );
}
