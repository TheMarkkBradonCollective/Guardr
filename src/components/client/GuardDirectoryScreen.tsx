import React, { useEffect, useMemo, useState } from 'react';
import {
  SecurityGuard,
  SecurityRequest,
  GUARD_SPECIALTY_OPTIONS,
  GuardSpecialty,
  type GuardStandingCrewMember,
} from '../../types';
import {
  applyGuardFilters,
  countActiveFilters,
  DEFAULT_GUARD_FILTERS,
  getBrowsableGuards,
  getClientRehireableGuards,
  GuardDirectoryFilters,
  GuardSortKey,
} from '../../lib/guardDirectory';
import { getBrowsableClientCrews } from '../../lib/guardTeams';
import { getActiveStandingCrewMembers } from '../../lib/guardStandingCrew';
import { formatShiftRange } from '../../lib/dates';
import { getGuardDisplayHeadline, getGuardDisplaySummary } from '../../lib/guardResume';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack, AppEmptyState, AppScreen, AppSection, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import {
  GUARD_APPROVED_BADGE_LABEL,
  GUARD_TRUSTED_BADGE_LABEL,
  isGuardProfileApproved,
  isGuardTrusted,
} from '../../lib/guardTrust';
import {
  Award,
  ChevronDown,
  Filter,
  Heart,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface GuardDirectoryScreenProps {
  guards: SecurityGuard[];
  onSelectGuard: (guard: SecurityGuard) => void;
  onBack?: () => void;
  favoriteGuardIds?: string[];
  onToggleFavorite?: (guardId: string) => void | Promise<void>;
  clientId?: string;
  requests?: SecurityRequest[];
  standingCrewMembers?: GuardStandingCrewMember[];
  /** Called when the client taps "Hire" directly from the directory */
  onRequestGuard?: (guard: SecurityGuard) => void;
  onTeamDetailOpenChange?: (open: boolean) => void;
}

const SORT_OPTIONS: { id: GuardSortKey; label: string }[] = [
  { id: 'rating', label: 'Top Rated' },
  { id: 'jobs', label: 'Most Experienced' },
  { id: 'experience', label: 'Most Years' },
  { id: 'name', label: 'Name A–Z' },
];

const MIN_RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 3.5, label: '3.5+ stars' },
  { value: 4.0, label: '4.0+ stars' },
  { value: 4.5, label: '4.5+ stars' },
];

const MIN_EXP_OPTIONS = [
  { value: 0, label: 'Any experience' },
  { value: 1, label: '1+ year' },
  { value: 3, label: '3+ years' },
  { value: 5, label: '5+ years' },
  { value: 10, label: '10+ years' },
];

type DirectoryTab = 'guards' | 'teams';

export function GuardDirectoryScreen({
  guards,
  onSelectGuard,
  onBack,
  favoriteGuardIds = [],
  onToggleFavorite,
  clientId,
  requests = [],
  standingCrewMembers = [],
  onRequestGuard,
  onTeamDetailOpenChange,
}: GuardDirectoryScreenProps) {
  const [directoryTab, setDirectoryTab] = useState<DirectoryTab>('guards');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  useEffect(() => {
    onTeamDetailOpenChange?.(selectedListingId != null);
  }, [selectedListingId, onTeamDetailOpenChange]);
  const [filters, setFilters] = useState<GuardDirectoryFilters>(DEFAULT_GUARD_FILTERS);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const browseable = useMemo(() => getBrowsableGuards(guards), [guards]);

  const previouslyWorkedIds = useMemo(() => {
    if (!clientId) return new Set<string>();
    return new Set(getClientRehireableGuards(clientId, requests, guards).map((g) => g.id));
  }, [clientId, requests, guards]);

  const filtered = useMemo(() => {
    const results = applyGuardFilters(browseable, filters, favoriteGuardIds, previouslyWorkedIds);
    if (!filters.favoritesOnly) {
      const favs = results.filter((g) => favoriteGuardIds.includes(g.id));
      const rest = results.filter((g) => !favoriteGuardIds.includes(g.id));
      return [...favs, ...rest];
    }
    return results;
  }, [browseable, filters, favoriteGuardIds, previouslyWorkedIds]);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const favCount = useMemo(
    () => browseable.filter((g) => favoriteGuardIds.includes(g.id)).length,
    [browseable, favoriteGuardIds]
  );

  const hasPreviouslyWorked = previouslyWorkedIds.size > 0;

  const clientCrews = useMemo(
    () => getBrowsableClientCrews(requests, guards, standingCrewMembers),
    [requests, guards, standingCrewMembers]
  );

  const filteredTeams = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    if (!q) return clientCrews;
    return clientCrews.filter(
      (crew) =>
        crew.crewName.toLowerCase().includes(q) ||
        (crew.crewDescription ?? '').toLowerCase().includes(q) ||
        crew.coordinatorName.toLowerCase().includes(q) ||
        (crew.jobTitle ?? '').toLowerCase().includes(q) ||
        (crew.location ?? '').toLowerCase().includes(q)
    );
  }, [clientCrews, filters.query]);

  const selectedTeam = selectedListingId
    ? clientCrews.find((c) => c.listingId === selectedListingId) ?? null
    : null;
  const selectedTeamJob =
    selectedTeam?.kind === 'job' && selectedTeam.jobId
      ? requests.find((r) => r.id === selectedTeam.jobId) ?? null
      : null;
  const selectedStandingRoster = useMemo(() => {
    if (!selectedTeam || selectedTeam.kind !== 'standing') return [];
    return getActiveStandingCrewMembers(standingCrewMembers, selectedTeam.coordinatorId)
      .map((row) => guards.find((g) => g.id === row.memberGuardId))
      .filter(Boolean) as SecurityGuard[];
  }, [selectedTeam, standingCrewMembers, guards]);

  function updateFilter<K extends keyof GuardDirectoryFilters>(key: K, value: GuardDirectoryFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSpecialty(spec: GuardSpecialty) {
    setFilters((prev) => {
      const has = prev.specialties.includes(spec);
      return {
        ...prev,
        specialties: has ? prev.specialties.filter((s) => s !== spec) : [...prev.specialties, spec],
      };
    });
  }

  function clearAllFilters() {
    setFilters(DEFAULT_GUARD_FILTERS);
  }

  function removeSpecialtyChip(spec: GuardSpecialty) {
    setFilters((prev) => ({ ...prev, specialties: prev.specialties.filter((s) => s !== spec) }));
  }

  const currentSort = SORT_OPTIONS.find((s) => s.id === filters.sortBy) ?? SORT_OPTIONS[0];

  if (selectedTeam && (selectedTeamJob || selectedTeam.kind === 'standing')) {
    const coordinator = guards.find((g) => g.id === selectedTeam.coordinatorId);
    const rosterIds =
      selectedTeamJob?.guardSlots?.map((s) => s.guardId).filter(Boolean) as string[] | undefined;
    const rosterGuards =
      selectedTeam.kind === 'standing'
        ? selectedStandingRoster
        : (rosterIds ?? [])
            .map((id) => guards.find((g) => g.id === id))
            .filter(Boolean) as SecurityGuard[];

    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader title={selectedTeam.crewName} onBack={() => setSelectedListingId(null)} backLabel="Find Guards" />
        <div className="app-section-body pb-8 space-y-4">
          {selectedTeam.crewDescription && (
            <p className="text-sm text-brand-text-muted leading-relaxed whitespace-pre-wrap">
              {selectedTeam.crewDescription}
            </p>
          )}
          {selectedTeamJob && (
            <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-3 py-3 space-y-2 text-sm">
              <p className="font-semibold text-brand-text">{selectedTeam.jobTitle}</p>
              <p className="text-brand-text-muted">
                {formatShiftRange(selectedTeamJob.startDate, selectedTeamJob.endDate)}
              </p>
              <p className="text-brand-text-muted">{selectedTeam.location}</p>
              <p className="text-brand-text-muted">
                {selectedTeam.memberCount}/{selectedTeam.guardsNeeded} guards on roster
                {selectedTeam.armedRequired ? ' · Armed' : ''}
              </p>
            </div>
          )}
          {selectedTeam.kind === 'standing' && (
            <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-3 py-3 space-y-1 text-sm">
              <p className="font-semibold text-brand-text">Standing team</p>
              <p className="text-brand-text-muted">
                {selectedTeam.memberCount} member{selectedTeam.memberCount !== 1 ? 's' : ''} including
                coordinator
              </p>
            </div>
          )}
          {coordinator && onRequestGuard && (
            <AppButton
              variant="primary"
              fullWidth
              onClick={() => {
                setSelectedListingId(null);
                onRequestGuard(coordinator);
              }}
            >
              Request {coordinator.name}
            </AppButton>
          )}
          {coordinator && (
            <button
              type="button"
              onClick={() => {
                setSelectedListingId(null);
                onSelectGuard(coordinator);
              }}
              className="w-full text-left"
            >
              <WfListCard
                avatar={
                  <ProfileAvatar src={coordinator.avatar} name={coordinator.name} size="md" rounded="xl" className="w-14 h-14 text-base" />
                }
                title={`${coordinator.name} · crew coordinator`}
                subtitle={getGuardDisplayHeadline(coordinator)}
                meta={
                  <p className="text-xs text-brand-text-muted mt-1">View coordinator profile</p>
                }
              />
            </button>
          )}
          {rosterGuards.length > 0 && (
            <AppSection title="Crew roster">
              <AppItemCardStack>
                {rosterGuards
                  .filter((g) => g.id !== selectedTeam.coordinatorId)
                  .map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedListingId(null);
                        onSelectGuard(member);
                      }}
                      className="w-full text-left"
                    >
                      <WfListCard
                        avatar={
                          <ProfileAvatar src={member.avatar} name={member.name} size="sm" rounded="xl" />
                        }
                        title={member.name}
                        subtitle={getGuardDisplayHeadline(member)}
                      />
                    </button>
                  ))}
              </AppItemCardStack>
            </AppSection>
          )}
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      {onBack && <AppSubScreenHeader title="Find Guards & Teams" onBack={onBack} backLabel="Home" />}

      <div className="px-4 pt-2">
        <div className="app-inbox-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={directoryTab === 'guards'}
            className={`app-inbox-tab${directoryTab === 'guards' ? ' app-inbox-tab-active' : ''}`}
            onClick={() => setDirectoryTab('guards')}
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
            Guards
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={directoryTab === 'teams'}
            className={`app-inbox-tab${directoryTab === 'teams' ? ' app-inbox-tab-active' : ''}`}
            onClick={() => setDirectoryTab('teams')}
          >
            <Users className="w-3.5 h-3.5" strokeWidth={2} />
            Teams
          </button>
        </div>
      </div>

      {/* ── Search + filter bar ───────────────────────────────────── */}
      <div className="px-4 pb-3 pt-2 space-y-2 border-b border-brand-border sticky top-0 z-20 bg-brand-bg">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <WfSearchBar
              value={filters.query}
              onChange={(q) => updateFilter('query', q)}
              placeholder={
                directoryTab === 'teams'
                  ? 'Search teams by name, coordinator, or location…'
                  : 'Search by name, skills, or specialty…'
              }
            />
          </div>
          {/* Filter button */}
          <button
            type="button"
            onClick={() => { setShowFilterPanel((v) => !v); setShowSortMenu(false); }}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full border transition-colors shrink-0 ${
              directoryTab === 'teams'
                ? 'opacity-40 pointer-events-none border-brand-border text-brand-text-muted'
                : showFilterPanel || activeFilterCount > 0
                ? 'bg-brand-primary border-brand-primary text-white'
                : 'border-brand-border text-brand-text-muted hover:border-brand-primary hover:text-brand-primary'
            }`}
            aria-label="Filters"
            disabled={directoryTab === 'teams'}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Sort + result count row ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-brand-text-muted">
            {directoryTab === 'teams'
              ? filteredTeams.length === 0
                ? 'No coordinated crews found'
                : `${filteredTeams.length} crew${filteredTeams.length !== 1 ? 's' : ''}`
              : filtered.length === 0
              ? 'No guards found'
              : `${filtered.length} guard${filtered.length !== 1 ? 's' : ''}`}
            {activeFilterCount > 0 && directoryTab === 'guards' && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-2 text-brand-primary underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </p>
          {directoryTab === 'guards' && (
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => updateFilter('favoritesOnly', !filters.favoritesOnly)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  filters.favoritesOnly
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-500'
                    : 'border-brand-border text-brand-text-muted hover:border-rose-500/40 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${filters.favoritesOnly ? 'fill-rose-500' : ''}`} />
                Favourites{favCount > 0 ? ` (${favCount})` : ''}
              </button>
            )}
            {/* Sort button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowSortMenu((v) => !v); setShowFilterPanel(false); }}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-brand-border text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                {currentSort.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-brand-surface border border-brand-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { updateFilter('sortBy', opt.id); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filters.sortBy === opt.id
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'hover:bg-brand-bg-sec text-brand-text'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* ── Active filter chips ───────────────────────────────────── */}
        {directoryTab === 'guards' && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {filters.armedOnly && (
              <FilterChip label="Armed only" onRemove={() => updateFilter('armedOnly', false)} />
            )}
            {filters.minRating > 0 && (
              <FilterChip
                label={`${filters.minRating}+ stars`}
                onRemove={() => updateFilter('minRating', 0)}
              />
            )}
            {filters.minExperience > 0 && (
              <FilterChip
                label={`${filters.minExperience}+ yr exp`}
                onRemove={() => updateFilter('minExperience', 0)}
              />
            )}
            {filters.verifiedOnly && (
              <FilterChip label="Verified" onRemove={() => updateFilter('verifiedOnly', false)} />
            )}
            {filters.trustedOnly && (
              <FilterChip label="Trusted" onRemove={() => updateFilter('trustedOnly', false)} />
            )}
            {filters.previouslyWorkedWith && (
              <FilterChip label="Worked with before" onRemove={() => updateFilter('previouslyWorkedWith', false)} />
            )}
            {filters.specialties.map((s) => (
              <FilterChip key={s} label={s} onRemove={() => removeSpecialtyChip(s)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Expandable filter panel ───────────────────────────────── */}
      {showFilterPanel && directoryTab === 'guards' && (
        <div className="border-b border-brand-border bg-brand-bg-sec px-4 py-4 space-y-5">
          {/* Armed */}
          <FilterToggleRow
            icon={<Shield className="w-4 h-4" />}
            label="Armed guards only"
            description="Show only guards licensed to carry a firearm"
            checked={filters.armedOnly}
            onChange={(v) => updateFilter('armedOnly', v)}
          />

          {/* Verified */}
          <FilterToggleRow
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Verified guards only"
            description="Staff-approved profiles with confirmed credentials"
            checked={filters.verifiedOnly}
            onChange={(v) => updateFilter('verifiedOnly', v)}
          />

          {/* Trusted */}
          <FilterToggleRow
            icon={<Award className="w-4 h-4" />}
            label="Trusted guards only"
            description="Director-endorsed guards with a strong track record"
            checked={filters.trustedOnly}
            onChange={(v) => updateFilter('trustedOnly', v)}
          />

          {/* Previously worked with */}
          {hasPreviouslyWorked && (
            <FilterToggleRow
              icon={<Users className="w-4 h-4" />}
              label="Previously worked with"
              description="Guards you've hired through Guardr before"
              checked={filters.previouslyWorkedWith}
              onChange={(v) => updateFilter('previouslyWorkedWith', v)}
            />
          )}

          {/* Min rating */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-brand-primary fill-brand-primary" />
              Minimum rating
            </p>
            <div className="flex flex-wrap gap-2">
              {MIN_RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFilter('minRating', opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filters.minRating === opt.value
                      ? 'bg-brand-primary border-brand-primary text-white'
                      : 'border-brand-border text-brand-text-muted hover:border-brand-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min experience */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-primary" />
              Years of experience
            </p>
            <div className="flex flex-wrap gap-2">
              {MIN_EXP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFilter('minExperience', opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filters.minExperience === opt.value
                      ? 'bg-brand-primary border-brand-primary text-white'
                      : 'border-brand-border text-brand-text-muted hover:border-brand-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-brand-primary" />
              Specialties
            </p>
            <div className="flex flex-wrap gap-2">
              {GUARD_SPECIALTY_OPTIONS.map((spec) => {
                const active = filters.specialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-brand-primary border-brand-primary text-white'
                        : 'border-brand-border text-brand-text-muted hover:border-brand-primary'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="app-action-row app-action-row--equal pt-1">
            <AppButton variant="outline" size="sm" onClick={clearAllFilters}>
              Clear all
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={() => setShowFilterPanel(false)}>
              Show {filtered.length} guard{filtered.length !== 1 ? 's' : ''}
            </AppButton>
          </div>
        </div>
      )}

      {/* ── Guard list ────────────────────────────────────────────── */}
      {directoryTab === 'teams' ? (
        <AppSection title="Coordinated crews">
          {filteredTeams.length === 0 ? (
            <AppEmptyState icon={<Users className="w-5 h-5" />} title="No trusted teams yet">
              Trusted guards maintain a standing crew profile you can browse here. Check back as
              coordinators build their teams.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {filteredTeams.map((crew) => (
                <WfListCard
                  key={crew.listingId}
                  avatar={
                    <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-brand-primary" />
                    </div>
                  }
                  title={crew.crewName}
                  subtitle={
                    crew.kind === 'job' && crew.location
                      ? `${crew.coordinatorName} · ${crew.location}`
                      : `${crew.coordinatorName} · Standing team`
                  }
                  meta={
                    <div className="text-sm text-brand-text-muted space-y-1">
                      {crew.jobTitle && <p>{crew.jobTitle}</p>}
                      {crew.startDate && crew.endDate && (
                        <p>{formatShiftRange(crew.startDate, crew.endDate)}</p>
                      )}
                      {crew.crewDescription && (
                        <p className="line-clamp-2">{crew.crewDescription}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <WfBadge tone="primary">
                          {crew.kind === 'job' && crew.guardsNeeded
                            ? `${crew.memberCount}/${crew.guardsNeeded} on roster`
                            : `${crew.memberCount} member${crew.memberCount !== 1 ? 's' : ''}`}
                        </WfBadge>
                        {crew.armedRequired && <WfBadge tone="warning">Armed</WfBadge>}
                        {crew.kind === 'standing' && <WfBadge tone="success">Trusted team</WfBadge>}
                      </div>
                    </div>
                  }
                  onClick={() => setSelectedListingId(crew.listingId)}
                />
              ))}
            </AppItemCardStack>
          )}
        </AppSection>
      ) : (
      <AppSection title="Guards">
        {filtered.length === 0 ? (
          <GuardEmptyState
            filters={filters}
            favoritesOnly={filters.favoritesOnly}
            onClearFilters={clearAllFilters}
          />
        ) : (
          <AppItemCardStack>
            {filtered.map((guard) => {
              const isFav = favoriteGuardIds.includes(guard.id);
              const workedBefore = previouslyWorkedIds.has(guard.id);
              return (
                <div key={guard.id} className="relative">
                  <WfListCard
                    avatar={
                      <ProfileAvatar src={guard.avatar} name={guard.name} size="md" rounded="xl" className="w-14 h-14 text-base" />
                    }
                    title={
                      <span className="flex items-center gap-2 flex-wrap">
                        {guard.name}
                        {isGuardTrusted(guard) && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full">
                            <Award className="w-2.5 h-2.5" />
                            {GUARD_TRUSTED_BADGE_LABEL}
                          </span>
                        )}
                      </span>
                    }
                    subtitle={getGuardDisplayHeadline(guard)}
                    action={
                      onRequestGuard ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestGuard(guard);
                          }}
                          className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
                        >
                          Hire
                        </button>
                      ) : undefined
                    }
                    meta={
                      <div>
                        <div className="flex items-center gap-2 text-sm text-brand-text-muted flex-wrap">
                          <GuardArmedStatusPill guard={guard} />
                          {guard.isStaff && <WfBadge tone="primary">Staff</WfBadge>}
                          {isGuardProfileApproved(guard) && <WfBadge tone="success">{GUARD_APPROVED_BADGE_LABEL}</WfBadge>}
                          {workedBefore && <WfBadge tone="primary">Worked with before</WfBadge>}
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
                            <span className="font-medium">{guard.rating.toFixed(1)}</span>
                          </span>
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
                        {guard.specialties && guard.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {guard.specialties.slice(0, 3).map((spec) => (
                              <span
                                key={spec}
                                className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-bg-sec border border-brand-border text-brand-text-muted"
                              >
                                {spec}
                              </span>
                            ))}
                            {guard.specialties.length > 3 && (
                              <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-bg-sec border border-brand-border text-brand-text-muted">
                                +{guard.specialties.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
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
      )}
    </AppScreen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-rose-500 transition-colors ml-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function FilterToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 w-full text-left group"
    >
      <div
        className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-xl border transition-colors shrink-0 ${
          checked
            ? 'bg-brand-primary border-brand-primary text-white'
            : 'border-brand-border text-brand-text-muted group-hover:border-brand-primary'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text leading-snug">{label}</p>
        <p className="text-xs text-brand-text-muted leading-snug mt-0.5">{description}</p>
      </div>
      <div
        className={`mt-1 w-10 h-5.5 rounded-full border-2 transition-colors shrink-0 relative ${
          checked ? 'bg-brand-primary border-brand-primary' : 'bg-brand-border border-brand-border'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[calc(100%-1.25rem)]' : 'left-0.5'
          }`}
        />
      </div>
    </button>
  );
}

function GuardEmptyState({
  filters,
  favoritesOnly,
  onClearFilters,
}: {
  filters: GuardDirectoryFilters;
  favoritesOnly: boolean;
  onClearFilters: () => void;
}) {
  const hasActiveFilters = countActiveFilters(filters) > 0;

  if (favoritesOnly) {
    return (
      <div className="flex flex-col items-center py-10 px-6 text-center">
        <Heart className="w-10 h-10 text-brand-border mb-3" />
        <p className="font-semibold text-brand-text mb-1">No favourites yet</p>
        <p className="text-sm text-brand-text-muted">
          Tap the heart icon on any guard card to save them here for quick access.
        </p>
      </div>
    );
  }

  if (hasActiveFilters) {
    return (
      <div className="flex flex-col items-center py-10 px-6 text-center">
        <SlidersHorizontal className="w-10 h-10 text-brand-border mb-3" />
        <p className="font-semibold text-brand-text mb-1">No guards match your filters</p>
        <p className="text-sm text-brand-text-muted mb-4">
          Try adjusting or removing some of your filters to see more results.
        </p>
        <AppButton variant="primary" size="sm" onClick={onClearFilters}>
          Clear all filters
        </AppButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 px-6 text-center">
      <Users className="w-10 h-10 text-brand-border mb-3" />
      <p className="font-semibold text-brand-text mb-1">No guards available</p>
      <p className="text-sm text-brand-text-muted">
        No guards match your search. Try a broader search term or post a general security request instead.
      </p>
    </div>
  );
}
