import React, { useEffect, useMemo, useState } from 'react';
import { PlatformRole, SecurityGuard, SessionUser } from '../../types';
import {
  canAssignCityManager,
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
  staffCanManageCity,
} from '../../lib/platformCities';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import { useLayoutFormFactor } from '../../surfaces';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { CityManagerPicker } from './CityManagerPicker';
import { CityCredentialLinksEditor } from './CityCredentialLinksEditor';
import { MapPin } from 'lucide-react';
import type { CityCredentialResourceLinks } from '../../lib/cityCredentialLinks';

interface StaffCitiesPanelProps {
  currentUser: SessionUser;
  cities: PlatformCity[];
  actorManagedCities?: string[];
  staffRoster?: SecurityGuard[];
  onUpdateCity: (
    cityId: string,
    patch: {
      status?: CityMarketStatus;
      waitlistAudience?: CityWaitlistAudience;
      recommendOpen?: boolean;
      credentialResourceLinks?: CityCredentialResourceLinks;
    }
  ) => Promise<void>;
  onAssignCityManager?: (cityId: string, managerId: string | null) => Promise<void>;
}

const STATUS_TONES: Record<CityMarketStatus, 'success' | 'danger' | 'warning'> = {
  open: 'success',
  closed: 'danger',
  waitlist: 'warning',
};

const STATUS_CHIP_TONES: Record<CityMarketStatus, StatusTone> = {
  open: 'positive',
  closed: 'negative',
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
  canEditStaffAccess,
  staffRoster,
  platformCities,
  currentUser,
  onUpdate,
  onAssignCityManager,
}: {
  city: PlatformCity;
  busy: boolean;
  canManageStatus: boolean;
  canRecommend: boolean;
  canEditStaffAccess: boolean;
  staffRoster: SecurityGuard[];
  platformCities: PlatformCity[];
  currentUser: SessionUser;
  onUpdate: (patch: {
    status?: CityMarketStatus;
    waitlistAudience?: CityWaitlistAudience;
    recommendOpen?: boolean;
    credentialResourceLinks?: CityCredentialResourceLinks;
  }) => void;
  onAssignCityManager?: (cityId: string, managerId: string | null) => Promise<void>;
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
          <span className="uber-label">Service area status</span>
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
          As a Manager you can recommend cities for review. Directors and Founders control service area status.
        </p>
      )}

      {canManageStatus ? (
        <CityCredentialLinksEditor
          cityName={city.name}
          links={city.credentialResourceLinks}
          busy={busy}
          onSave={async (credentialResourceLinks) => {
            onUpdate({ credentialResourceLinks });
          }}
        />
      ) : null}

      {onAssignCityManager && staffRoster.length > 0 ? (
        <div className="border-t border-brand-border pt-4">
          <CityManagerPicker
            city={city}
            staffRoster={staffRoster}
            canEdit={canEditStaffAccess}
            busy={busy}
            onAssignCityManager={onAssignCityManager}
          />
        </div>
      ) : null}
    </div>
  );
}

export function StaffCitiesPanel({
  currentUser,
  cities,
  actorManagedCities = [],
  staffRoster = [],
  onUpdateCity,
  onAssignCityManager,
}: StaffCitiesPanelProps) {
  const formFactor = useLayoutFormFactor();
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

  const cityColumns: GuardrTableColumn<(typeof filtered)[number]>[] = [
    {
      id: 'city',
      header: 'City',
      grow: true,
      sortValue: (city) => city.name.toLowerCase(),
      render: (city) => (
        <>
          <p className="uber-workbench-table-primary">{city.name}</p>
          <p className="uber-workbench-table-secondary">{city.stateCode}</p>
        </>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (city) => city.status,
      render: (city) => (
        <StatusChip tone={STATUS_CHIP_TONES[city.status]}>
          {CITY_STATUS_LABELS[city.status]}
        </StatusChip>
      ),
    },
  ];

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId && !filtered.some((city) => city.id === selectedId)) {
      setSelectedId(formFactor === 'desktop' ? filtered[0].id : null);
      return;
    }
    if (formFactor === 'desktop' && !selectedId) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId, formFactor]);

  const selectedCity = filtered.find((city) => city.id === selectedId) ?? null;

  const canEditStaffAccessForCity = (cityName: string) =>
    Boolean(onAssignCityManager) &&
    canAssignCityManager(currentUser) &&
    staffCanManageCity(currentUser.role as PlatformRole, actorManagedCities, cityName);

  const applyUpdate = async (
    city: PlatformCity,
    patch: {
      status?: CityMarketStatus;
      waitlistAudience?: CityWaitlistAudience;
      recommendOpen?: boolean;
      credentialResourceLinks?: CityCredentialResourceLinks;
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
        <WorkbenchEmpty message="Service Areas unavailable. Service Areas controls are limited to Manager roles and above." />
      );
    }

    return (
      <div className="app-empty-state app-empty-state--dashed">
        <p className="app-empty-state-title">Service Areas unavailable</p>
        <p className="app-empty-state-body">
          Service Areas controls are limited to Manager roles and above.
        </p>
      </div>
    );
  }

  const filterTabs = (
    <StaffListFilterTabs
      aria-label="Service area city status"
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
        className="staff-mgmt-panel staff-roster-panel adm-finance-page adm-cities-page"
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
              <GuardrDataTable
                columns={cityColumns}
                rows={filtered}
                rowKey={(city) => city.id}
                selectedKey={selectedId ?? undefined}
                onRowClick={(city) => setSelectedId(city.id)}
                caption="Cities"
                cardLayout={{ title: 'city', trailing: 'status' }}
              />
            }
            detail={
              selectedCity ? (
                <CityDetailPanel
                  city={selectedCity}
                  busy={savingId === selectedCity.id}
                  canManageStatus={canManageStatus}
                  canRecommend={canRecommend}
                  canEditStaffAccess={canEditStaffAccessForCity(selectedCity.name)}
                  staffRoster={staffRoster}
                  platformCities={cities}
                  currentUser={currentUser}
                  onUpdate={(patch) => void applyUpdate(selectedCity, patch)}
                  onAssignCityManager={onAssignCityManager}
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
    <div className="staff-ops-mobile-shell flex flex-col min-w-0 animate-fade-in">
      {selectedCity ? (
        <div className="app-full-page-detail animate-fade-in min-w-0 max-w-full">
          <AppSubScreenHeader
            title={selectedCity.name}
            onBack={() => setSelectedId(null)}
            backLabel="Service Areas"
          />
          <div className="staff-ops-mobile-body min-w-0 pb-8">
            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
            <CityDetailPanel
              city={selectedCity}
              busy={savingId === selectedCity.id}
              canManageStatus={canManageStatus}
              canRecommend={canRecommend}
              canEditStaffAccess={canEditStaffAccessForCity(selectedCity.name)}
              staffRoster={staffRoster}
              platformCities={cities}
              currentUser={currentUser}
              onUpdate={(patch) => void applyUpdate(selectedCity, patch)}
              onAssignCityManager={onAssignCityManager}
            />
          </div>
        </div>
      ) : (
        <div className="staff-ops-mobile-body min-w-0 space-y-3">
          {canRecommend && !canManageStatus && (
            <p className="text-xs text-amber-400 px-1">
              As a Manager you can recommend cities for review. Directors and Founders control open, closed, and wait list status.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <WfSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by city, status, or wait list audience..."
              className="w-full"
            />
            <label className="flex flex-col gap-1.5 w-full">
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
            <div className="app-list">
              {filtered.map((city) => {
                const busy = savingId === city.id;
                const directorValue = getDirectorActionValue(city);
                const managerValue = getManagerActionValue(city);

                return (
                  <div key={city.id} className="app-list-row app-list-row-align-top">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedId(city.id)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold leading-snug truncate">{city.name}</p>
                        <span className="text-xs text-brand-text-muted shrink-0">{city.stateCode}</span>
                        <WfBadge tone={STATUS_TONES[city.status]}>
                          {CITY_STATUS_LABELS[city.status]}
                        </WfBadge>
                        {city.recommendOpen && <WfBadge tone="primary">Rec.</WfBadge>}
                      </div>
                      {city.status === 'waitlist' && (
                        <p className="text-xs text-brand-text-muted mt-0.5 capitalize">
                          Wait list · {city.waitlistAudience}
                        </p>
                      )}
                    </button>

                    {canManageStatus ? (
                      <label className="shrink-0">
                        <span className="sr-only">Set service area status for {city.name}</span>
                        <select
                          value={directorValue}
                          disabled={busy}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = e.target.value as DirectorActionValue;
                            if (next === directorValue) return;
                            void applyUpdate(city, parseDirectorAction(next));
                          }}
                          className="uber-select text-xs"
                          style={{ minWidth: 120 }}
                        >
                          {DIRECTOR_ACTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : canRecommend ? (
                      <label className="shrink-0">
                        <span className="sr-only">Recommend {city.name}</span>
                        <select
                          value={managerValue}
                          disabled={busy}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = e.target.value as ManagerActionValue;
                            if (next === managerValue) return;
                            void applyUpdate(city, { recommendOpen: next === 'recommend' });
                          }}
                          className="uber-select text-xs"
                          style={{ minWidth: 100 }}
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
      )}
    </div>
  );
}
