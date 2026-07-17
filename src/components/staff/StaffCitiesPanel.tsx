import React, { useEffect, useMemo, useState } from 'react';
import { SessionUser } from '../../types';
import {
  canManageCityMarkets,
  canRecommendCityMarket,
  canViewCityMarkets,
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
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { useDevice } from '../../lib/platform';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';
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

type DirectorActionValue =
  | CityMarketStatus
  | `waitlist:${CityWaitlistAudience}`;

type ManagerActionValue = 'recommend' | 'no-recommend';

const DIRECTOR_ACTION_OPTIONS: { value: DirectorActionValue; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'waitlist:guard', label: 'Wait list — guards' },
  { value: 'waitlist:client', label: 'Wait list — clients' },
  { value: 'waitlist:both', label: 'Wait list — both' },
];

const MANAGER_ACTION_OPTIONS: { value: ManagerActionValue; label: string }[] = [
  { value: 'no-recommend', label: 'No recommendation' },
  { value: 'recommend', label: 'Recommend' },
];

const SORT_OPTIONS: { id: CityMarketSort; label: string }[] = [
  { id: 'name-asc', label: 'Name A–Z' },
  { id: 'name-desc', label: 'Name Z–A' },
  { id: 'status', label: 'Status' },
  { id: 'updated-desc', label: 'Recently updated' },
];

function getDirectorActionValue(city: PlatformCity): DirectorActionValue {
  if (city.status === 'waitlist') return `waitlist:${city.waitlistAudience}`;
  return city.status;
}

function getManagerActionValue(city: PlatformCity): ManagerActionValue {
  return city.recommendOpen ? 'recommend' : 'no-recommend';
}

function parseDirectorAction(value: DirectorActionValue): {
  status?: CityMarketStatus;
  waitlistAudience?: CityWaitlistAudience;
} {
  if (value.startsWith('waitlist:')) {
    const audience = value.slice('waitlist:'.length) as CityWaitlistAudience;
    return { status: 'waitlist', waitlistAudience: audience };
  }
  return { status: value as CityMarketStatus };
}

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
  onUpdate: (patch: {
    status?: CityMarketStatus;
    waitlistAudience?: CityWaitlistAudience;
    recommendOpen?: boolean;
  }) => void;
}) {
  const directorValue = getDirectorActionValue(city);
  const managerValue = getManagerActionValue(city);

  return (
    <div className="adm-city-detail space-y-4">
      <div>
        <p className="adm-card-eyebrow">{city.stateCode}</p>
        <h3 className="adm-card-title">{city.name}</h3>
        <p className="uber-workbench-subtitle">{CITY_STATUS_DESCRIPTIONS[city.status]}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <WfBadge tone={STATUS_TONES[city.status]}>{CITY_STATUS_LABELS[city.status]}</WfBadge>
        {city.recommendOpen && <WfBadge tone="primary">Recommended</WfBadge>}
        {city.status === 'waitlist' && (
          <span className="text-xs text-brand-text-muted capitalize">{city.waitlistAudience}</span>
        )}
      </div>

      {canManageStatus ? (
        <label className="block space-y-1.5">
          <span className="uber-label">Operations status</span>
          <select
            value={directorValue}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.value as DirectorActionValue;
              if (next === directorValue) return;
              onUpdate(parseDirectorAction(next));
            }}
            className="uber-select w-full"
          >
            {DIRECTOR_ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : canRecommend ? (
        <label className="block space-y-1.5">
          <span className="uber-label">Recommendation</span>
          <select
            value={managerValue}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.value as ManagerActionValue;
              if (next === managerValue) return;
              onUpdate({ recommendOpen: next === 'recommend' });
            }}
            className="uber-select w-full"
          >
            {MANAGER_ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {canRecommend && !canManageStatus && (
        <p className="text-xs text-brand-text-muted">
          As a Manager you can recommend cities for review. Directors and Founders control operations status.
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
  const canRecommend = canRecommendCityMarket(currentUser);
  const canView = canViewCityMarkets(currentUser);

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

  if (!canView) {
    if (formFactor === 'desktop') {
      return (
        <WorkbenchEmpty message="Operations unavailable. Operations controls are limited to Manager roles and above." />
      );
    }

    return (
      <div className="app-empty-state app-empty-state--dashed">
        <p className="app-empty-state-title">Operations unavailable</p>
        <p className="app-empty-state-body">
          Operations controls are limited to Manager roles and above.
        </p>
      </div>
    );
  }

  const filterTabs = (
    <StaffListFilterTabs
      aria-label="Operations city status"
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
      <StaffOpsPageShell
        className="adm-finance-page adm-cities-page"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Platform"
            subtitle="Control where Guardr accepts guard and client applications."
            actions={
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
            }
          />
        }
      >
        {filterTabs}
        <p className="uber-workbench-subtitle adm-cities-count">
          Showing {filtered.length} of {visibleCities.length} cities
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}

        {filtered.length === 0 ? (
          <WorkbenchEmpty message="No cities match your filters." />
        ) : (
          <WorkbenchSplit
            className="adm-finance-split"
            list={
              <table className="uber-workbench-table">
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
                      className={`uber-workbench-table-row${selectedId === city.id ? ' uber-workbench-table-row--selected' : ''}`}
                      onClick={() => setSelectedId(city.id)}
                    >
                      <td>
                        <p className="uber-workbench-table-primary">{city.name}</p>
                        <p className="uber-workbench-table-secondary">{city.stateCode}</p>
                      </td>
                      <td>
                        <WfBadge tone={STATUS_TONES[city.status]}>{CITY_STATUS_LABELS[city.status]}</WfBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
            detail={
              selectedCity ? (
                <CityDetailPanel
                  city={selectedCity}
                  busy={savingId === selectedCity.id}
                  canManageStatus={canManageStatus}
                  canRecommend={canRecommend}
                  onUpdate={(patch) => void applyUpdate(selectedCity, patch)}
                />
              ) : (
                <WorkbenchEmpty icon={MapPin} message="Select a city to manage" variant="detail" />
              )
            }
          />
        )}
      </StaffOpsPageShell>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border border-brand-border bg-brand-surface/60 p-4 space-y-2">
        <h2 className="text-sm font-semibold">Operations</h2>
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Control where Guardr accepts guard and client applications. Closed cities show an instant
          denial. Wait list cities still collect applications but hold release to staff until operations
          are fully active.
        </p>
        {canRecommend && (
          <p className="text-xs text-amber-400">
            As a Manager you can recommend cities for review. Directors and Founders control open,
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
        <div className="rounded-xl border border-brand-border bg-brand-surface/40 max-h-[70vh] overflow-y-auto divide-y divide-brand-border">
          {filtered.map((city) => {
            const busy = savingId === city.id;
            const directorValue = getDirectorActionValue(city);
            const managerValue = getManagerActionValue(city);

            return (
              <div
                key={city.id}
                className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold leading-snug truncate">{city.name}</p>
                    <span className="text-xs text-brand-text-muted shrink-0">{city.stateCode}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <WfBadge tone={STATUS_TONES[city.status]}>
                      {CITY_STATUS_LABELS[city.status]}
                    </WfBadge>
                    {city.recommendOpen && <WfBadge tone="primary">Recommended</WfBadge>}
                    {city.status === 'waitlist' && (
                      <span className="text-xs text-brand-text-muted capitalize">
                        {city.waitlistAudience}
                      </span>
                    )}
                  </div>
                </div>

                {canManageStatus ? (
                  <label className="flex shrink-0 flex-col gap-1 sm:w-52">
                    <span className="sr-only">Set operations status for {city.name}</span>
                    <select
                      value={directorValue}
                      disabled={busy}
                      onChange={(e) => {
                        const next = e.target.value as DirectorActionValue;
                        if (next === directorValue) return;
                        void applyUpdate(city, parseDirectorAction(next));
                      }}
                      className="uber-select w-full text-sm"
                    >
                      {DIRECTOR_ACTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : canRecommend ? (
                  <label className="flex shrink-0 flex-col gap-1 sm:w-44">
                    <span className="sr-only">Recommend {city.name}</span>
                    <select
                      value={managerValue}
                      disabled={busy}
                      onChange={(e) => {
                        const next = e.target.value as ManagerActionValue;
                        if (next === managerValue) return;
                        void applyUpdate(city, { recommendOpen: next === 'recommend' });
                      }}
                      className="uber-select w-full text-sm"
                    >
                      {MANAGER_ACTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
