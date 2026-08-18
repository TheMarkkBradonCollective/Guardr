import React, { useEffect, useMemo, useState } from 'react';
import {
  SecurityGuard,
  SecurityRequest,
  GUARD_SPECIALTY_OPTIONS,
  GuardSpecialty,
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
import { useLayoutFormFactor } from '../../surfaces';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import { StatusChip } from '../baseui/StatusChip';
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
  /** Called when the client taps "Hire" directly from the directory */
  onRequestGuard?: (guard: SecurityGuard) => void;
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


export function GuardDirectoryScreen({
  guards,
  onSelectGuard,
  onBack,
  favoriteGuardIds = [],
  onToggleFavorite,
  clientId,
  requests = [],
  onRequestGuard,
}: GuardDirectoryScreenProps) {
  const formFactor = useLayoutFormFactor();
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
  const filtersOpen = formFactor === 'desktop' || showFilterPanel;

  const directoryColumns: GuardrTableColumn<SecurityGuard>[] = [
    {
      id: 'guard',
      header: 'Guard',
      grow: true,
      sortValue: (guard) => guard.name.toLowerCase(),
      render: (guard) => (
        <>
          <p className="uber-workbench-table-primary">{guard.name}</p>
          <p className="uber-workbench-table-secondary">{getGuardDisplayHeadline(guard)}</p>
        </>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      numeric: true,
      align: 'right',
      sortValue: (guard) => guard.rating,
      render: (guard) => `★ ${guard.rating.toFixed(1)}`,
    },
    {
      id: 'jobs',
      header: 'Jobs',
      numeric: true,
      align: 'right',
      hideOnNarrow: true,
      sortValue: (guard) => guard.jobsCompleted,
      render: (guard) => String(guard.jobsCompleted),
    },
    {
      id: 'status',
      header: 'Status',
      render: (guard) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {isGuardTrusted(guard) ? <StatusChip tone="accent">{GUARD_TRUSTED_BADGE_LABEL}</StatusChip> : null}
          {isGuardProfileApproved(guard) ? <StatusChip tone="positive">{GUARD_APPROVED_BADGE_LABEL}</StatusChip> : null}
          {previouslyWorkedIds.has(guard.id) ? <StatusChip tone="neutral">Worked with before</StatusChip> : null}
        </span>
      ),
    },
    {
      id: 'hire',
      header: '',
      render: (guard) =>
        onRequestGuard ? (
          <button
            type="button"
            className="app-button-outline app-btn-sm"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRequestGuard(guard);
            }}
          >
            Hire
          </button>
        ) : null,
    },
  ];

  return (
    <AppScreen className={formFactor === 'desktop' ? 'sfd-directory' : undefined}>
      {onBack && <AppSubScreenHeader title="Find Guards" onBack={onBack} backLabel="Home" />}

      {/* ── Search + filter bar ───────────────────────────────────── */}
      <div className="px-4 pb-3 pt-2 space-y-2 border-b border-brand-border sticky top-0 z-20 bg-brand-bg">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <WfSearchBar
              value={filters.query}
              onChange={(q) => updateFilter('query', q)}
              placeholder={
                'Search by name, skills, or specialty…'
              }
            />
          </div>
          {/* Filter button */}
          <button
            type="button"
            onClick={() => { setShowFilterPanel((v) => !v); setShowSortMenu(false); }}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full border transition-colors shrink-0 ${
              showFilterPanel || activeFilterCount > 0
                ? 'bg-brand-primary border-brand-primary text-white'
                : 'border-brand-border text-brand-text-muted hover:border-brand-primary hover:text-brand-primary'
            }${formFactor === 'desktop' ? ' hidden' : ''}`}
            aria-label="Filters"
            
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
            {filtered.length === 0
              ? 'No guards found'
              : `${filtered.length} guard${filtered.length !== 1 ? 's' : ''}`}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-2 text-brand-primary underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </p>
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
        </div>

        {/* ── Active filter chips ───────────────────────────────────── */}
        {activeFilterCount > 0 && (
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
      {filtersOpen && (
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
              icon={<Heart className="w-4 h-4" />}
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
      <AppSection title="Guards">
        {filtered.length === 0 ? (
          <GuardEmptyState
            filters={filters}
            favoritesOnly={filters.favoritesOnly}
            onClearFilters={clearAllFilters}
          />
        ) : formFactor === 'desktop' ? (
          <GuardrDataTable
            columns={directoryColumns}
            rows={filtered}
            rowKey={(guard) => guard.id}
            onRowClick={onSelectGuard}
            caption="Guards"
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
