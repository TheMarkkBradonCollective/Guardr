import React, { useEffect, useMemo, useState } from 'react';
import { SessionUser } from '../../types';
import {
  canManageCityMarkets,
  canRecommendCityOpen,
} from '../../lib/permissions';
import {
  countCityMarketsByFilter,
  filterAndSortCityMarkets,
  type CityMarketSort,
  type CityMarketStatusFilter,
} from '../../lib/cityMarketList';
import {
  CITY_STATUS_DESCRIPTIONS,
  CITY_STATUS_LABELS,
  filterCitiesForStaffActor,
  type CityMarketStatus,
  type CityWaitlistAudience,
  type PlatformCity,
} from '../../lib/platformCities';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { useDevice } from '../../lib/platform';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { MapPin } from 'lucide-react';

interface StaffCitiesPanelProps {
  currentUser: SessionUser;
  cities: PlatformCity[];
  actorManagedCities?: string[];
  staffRoster?: Array<{ id: string; name: string; staffRole?: string }>;
  onUpdateCity: (
    cityId: string,
    patch: {
      status?: CityMarketStatus;
      waitlistAudience?: CityWaitlistAudience;
      recommendOpen?: boolean;
    }
  ) => Promise<void>;
}

const STATUS_TONES: Record<CityMarketStatus, 'success' | 'danger' | 'warning'> = {
  open: 'success',
  closed: 'danger',
  waitlist: 'warning',
};

const SORT_OPTIONS: { id: CityMarketSort; label: string }[] = [
  { id: 'name-asc', label: 'Name A–Z' },
  { id: 'name-desc', label: 'Name Z–A' },
  { id: 'status', label: 'Status' },
  { id: 'updated-desc', label: 'Recently updated' },
];

function CityDetailPanel({
  city,
  busy,
  canManageStatus,
  canRecommend,
  onUpdate,
}: {
  city: PlatformCity;
  busy: boolean;
  canManageStatus: boolean;
  canRecommend: boolean;
  onUpdate: (
    patch: {
      status?: CityMarketStatus;
      waitlistAudience?: CityWaitlistAudience;
      recommendOpen?: boolean;
    }
  ) => void;
}) {
  return (
    <div className="adm-city-detail space-y-4">
      <div>
        <p className="adm-card-eyebrow">{city.stateCode}</p>
        <h3 className="adm-card-title">{city.name}</h3>
        <p className="adm-workbench-subtitle">{CITY_STATUS_DESCRIPTIONS[city.status]}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <WfBadge tone={STATUS_TONES[city.status]}>{CITY_STATUS_LABELS[city.status]}</WfBadge>
        {city.recommendOpen && <WfBadge tone="primary">Recommended open</WfBadge>}
        {city.status === 'waitlist' && (
          <span className="text-xs text-brand-text-muted capitalize">Wait list: {city.waitlistAudience}</span>
        )}
      </div>

      {canManageStatus ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['open', 'closed', 'waitlist'] as CityMarketStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy || city.status === status}
                onClick={() => onUpdate({ status })}
                className={`adm-btn adm-btn--outline adm-btn--sm capitalize ${
                  city.status === status ? 'is-active' : ''
                }`}
              >
                {CITY_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
          {city.status === 'waitlist' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-brand-text-muted">Wait list applies to:</span>
              {(['guard', 'client', 'both'] as CityWaitlistAudience[]).map((audience) => (
                <button
                  key={audience}
                  type="button"
                  disabled={busy || city.waitlistAudience === audience}
                  onClick={() => onUpdate({ waitlistAudience: audience })}
                  className={`adm-btn adm-btn--outline adm-btn--sm capitalize ${
                    city.waitlistAudience === audience ? 'is-active' : ''
                  }`}
                >
                  {audience}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onUpdate({ recommendOpen: !city.recommendOpen })}
            className="adm-btn adm-btn--outline adm-btn--sm"
          >
            {city.recommendOpen ? 'Clear recommendation flag' : 'Flag manager recommendation'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate({ recommendOpen: !city.recommendOpen })}
          className="adm-btn adm-btn--outline adm-btn--sm"
        >
          {city.recommendOpen ? 'Withdraw recommendation' : 'Recommend open'}
        </button>
      )}

      {!canManageStatus && canRecommend && (
        <p className="text-xs text-brand-text-muted">
          As a Manager you can recommend cities to open. Directors and Founders control market status.
        </p>
      )}
    </div>
  );
}

export function StaffCitiesPanel({
  currentUser,
  cities,
  actorManagedCities = [],
  onUpdateCity,
}: StaffCitiesPanelProps) {
  const { formFactor } = useDevice();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CityMarketStatusFilter>('all');
  const [sort, setSort] = useState<CityMarketSort>('name-asc');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canManageStatus = canManageCityMarkets(currentUser);
  const canRecommend = canRecommendCityOpen(currentUser);

  const visibleCities = useMemo(
    () => filterCitiesForStaffActor(cities, currentUser.role, actorManagedCities),
    [cities, currentUser.role, actorManagedCities]
  );

  const filterCounts = useMemo(
    () => countCityMarketsByFilter(visibleCities, search),
    [visibleCities, search]
  );

  const filtered = useMemo(
    () =>
      filterAndSortCityMarkets(visibleCities, {
        search,
        statusFilter,
        sort,
      }),
    [visibleCities, search, statusFilter, sort]
  );

  useEffect(() => {
    if (formFactor !== 'desktop') return;
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((city) => city.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [formFactor, filtered, selectedId]);

  const selectedCity = filtered.find((city) => city.id === selectedId) ?? null;

  const applyUpdate = async (
    city: PlatformCity,
    patch: {
      status?: CityMarketStatus;
      waitlistAudience?: CityWaitlistAudience;
      recommendOpen?: boolean;
    }
  ) => {
    setError('');
    setSavingId(city.id);
    try {
      await onUpdateCity(city.id, patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update city.');
    } finally {
      setSavingId(null);
    }
  };

  const emptyNoAccess = (
    <div className={formFactor === 'desktop' ? 'adm-empty' : 'app-empty-state app-empty-state--dashed'}>
      <p className={formFactor === 'desktop' ? undefined : 'app-empty-state-title'}>City markets unavailable</p>
      <p className={formFactor === 'desktop' ? 'adm-workbench-subtitle' : 'app-empty-state-body'}>
        Market controls are limited to Manager roles and above.
      </p>
    </div>
  );

  if (!canRecommend) return emptyNoAccess;

  if (visibleCities.length === 0) {
    return (
      <div className={formFactor === 'desktop' ? 'adm-empty' : 'app-empty-state app-empty-state--dashed'}>
        <p className={formFactor === 'desktop' ? undefined : 'app-empty-state-title'}>No assigned cities</p>
        <p className={formFactor === 'desktop' ? 'adm-workbench-subtitle' : 'app-empty-state-body'}>
          Ask a Director to assign cities you can manage before changing market status.
        </p>
      </div>
    );
  }

  const filterTabs = (
    <StaffListFilterTabs
      aria-label="City market status"
      activeId={statusFilter}
      onChange={(id) => setStatusFilter(id as CityMarketStatusFilter)}
      tabs={[
        { id: 'all', label: 'All', count: filterCounts.all },
        { id: 'open', label: 'Open', count: filterCounts.open },
        { id: 'closed', label: 'Closed', count: filterCounts.closed },
        { id: 'waitlist', label: 'Wait list', count: filterCounts.waitlist },
        { id: 'recommended', label: 'Recommended', count: filterCounts.recommended },
      ]}
    />
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell className="adm-finance-page adm-cities-page">
        <div className="adm-workbench-toolbar adm-finance-toolbar">
          <div>
            <p className="adm-card-eyebrow">Platform</p>
            <p className="adm-workbench-subtitle">
              Control where Guardr accepts guard and client applications.
            </p>
          </div>
          <div className="adm-cities-toolbar-controls">
            <WfSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search cities..."
              className="adm-cities-search"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CityMarketSort)}
              className="uber-select adm-cities-sort"
              aria-label="Sort cities"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filterTabs}
        <p className="adm-workbench-subtitle adm-cities-count">
          Showing {filtered.length} of {visibleCities.length} cities
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}

        {filtered.length === 0 ? (
          <div className="adm-empty">
            <p>No cities match your filters.</p>
          </div>
        ) : (
          <div className="adm-workbench-split adm-finance-split">
            <div className="adm-workbench-list">
              <table className="adm-table adm-table--list">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((city) => (
                    <tr
                      key={city.id}
                      className={`adm-table-row--click${selectedId === city.id ? ' adm-table-row--selected' : ''}`}
                      onClick={() => setSelectedId(city.id)}
                    >
                      <td>
                        <p className="adm-table-primary">{city.name}</p>
                        <p className="adm-table-secondary">{city.stateCode}</p>
                      </td>
                      <td>
                        <WfBadge tone={STATUS_TONES[city.status]}>{CITY_STATUS_LABELS[city.status]}</WfBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="adm-workbench-detail">
              {selectedCity ? (
                <div className="adm-workbench-detail-inner">
                  <CityDetailPanel
                    city={selectedCity}
                    busy={savingId === selectedCity.id}
                    canManageStatus={canManageStatus}
                    canRecommend={canRecommend}
                    onUpdate={(patch) => void applyUpdate(selectedCity, patch)}
                  />
                </div>
              ) : (
                <div className="adm-empty adm-empty--detail">
                  <MapPin className="w-10 h-10 adm-muted-icon" />
                  <p>Select a city to manage</p>
                </div>
              )}
            </div>
          </div>
        )}
      </StaffOpsPageShell>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border border-brand-border bg-brand-surface/60 p-4 space-y-2">
        <h2 className="text-sm font-semibold">City markets</h2>
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Control where Guardr accepts guard and client applications. Closed cities show an instant
          denial. Wait list cities still collect applications but hold release to staff until the
          market is fully active.
        </p>
        {!canManageStatus && (
          <p className="text-xs text-amber-400">
            As a Manager you can recommend cities to open. Directors and Founders control open,
            closed, and wait list status.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <WfSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by city, status, or wait list audience..."
          className="w-full lg:max-w-md"
        />
        <label className="flex flex-col gap-1.5 w-full lg:w-56">
          <span className="uber-label">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CityMarketSort)}
            className="uber-select w-full"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filterTabs}

      <p className="text-xs text-brand-text-muted">
        Showing {filtered.length} of {visibleCities.length} cities
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {filtered.length === 0 ? (
        <div className="app-empty-state app-empty-state--dashed">
          <p className="app-empty-state-title">No cities match your filters</p>
          <p className="app-empty-state-body">
            Try a different search term, status tab, or sort order.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.map((city) => {
            const busy = savingId === city.id;
            return (
              <div
                key={city.id}
                className="rounded-xl border border-brand-border bg-brand-surface/40 p-4 space-y-3"
              >
                <WfListCard
                  avatar={
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                    </div>
                  }
                  title={city.name}
                  subtitle={`${city.stateCode} · ${CITY_STATUS_DESCRIPTIONS[city.status]}`}
                  meta={
                    <div className="flex flex-wrap items-center gap-2">
                      <WfBadge tone={STATUS_TONES[city.status]}>
                        {CITY_STATUS_LABELS[city.status]}
                      </WfBadge>
                      {city.recommendOpen && <WfBadge tone="primary">Recommended open</WfBadge>}
                      {city.status === 'waitlist' && (
                        <span className="text-xs text-brand-text-muted capitalize">
                          Wait list: {city.waitlistAudience}
                        </span>
                      )}
                    </div>
                  }
                />

                {canManageStatus ? (
                  <div className="flex flex-wrap gap-2">
                    {(['open', 'closed', 'waitlist'] as CityMarketStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busy || city.status === status}
                        onClick={() => void applyUpdate(city, { status })}
                        className={`app-button-outline app-btn-sm capitalize ${
                          city.status === status ? 'border-brand-primary text-brand-primary' : ''
                        }`}
                      >
                        {CITY_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void applyUpdate(city, { recommendOpen: !city.recommendOpen })}
                    className="app-button-outline app-btn-sm"
                  >
                    {city.recommendOpen ? 'Withdraw recommendation' : 'Recommend open'}
                  </button>
                )}

                {canManageStatus && city.status === 'waitlist' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-brand-text-muted">Wait list applies to:</span>
                    {(['guard', 'client', 'both'] as CityWaitlistAudience[]).map((audience) => (
                      <button
                        key={audience}
                        type="button"
                        disabled={busy || city.waitlistAudience === audience}
                        onClick={() => void applyUpdate(city, { waitlistAudience: audience })}
                        className={`app-button-outline app-btn-sm capitalize ${
                          city.waitlistAudience === audience
                            ? 'border-brand-primary text-brand-primary'
                            : ''
                        }`}
                      >
                        {audience}
                      </button>
                    ))}
                  </div>
                )}

                {canManageStatus && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void applyUpdate(city, { recommendOpen: !city.recommendOpen })}
                    className="app-button-outline app-btn-sm"
                  >
                    {city.recommendOpen
                      ? 'Clear recommendation flag'
                      : 'Flag manager recommendation'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
