import React, { useMemo, useState } from 'react';
import { SessionUser } from '../../types';
import {
  canManageCityMarkets,
  canRecommendCityOpen,
} from '../../lib/permissions';
import {
  CITY_STATUS_DESCRIPTIONS,
  CITY_STATUS_LABELS,
  filterCitiesForStaffActor,
  type CityMarketStatus,
  type CityWaitlistAudience,
  type PlatformCity,
} from '../../lib/platformCities';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
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

export function StaffCitiesPanel({
  currentUser,
  cities,
  actorManagedCities = [],
  onUpdateCity,
}: StaffCitiesPanelProps) {
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const canManageStatus = canManageCityMarkets(currentUser);
  const canRecommend = canRecommendCityOpen(currentUser);

  const visibleCities = useMemo(
    () => filterCitiesForStaffActor(cities, currentUser.role, actorManagedCities),
    [cities, currentUser.role, actorManagedCities]
  );

  const filtered = visibleCities.filter((city) =>
    city.name.toLowerCase().includes(search.trim().toLowerCase())
  );

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

  if (!canRecommend) {
    return (
      <div className="app-empty-state app-empty-state--dashed">
        <p className="app-empty-state-title">City markets unavailable</p>
        <p className="app-empty-state-body">
          Market controls are limited to Manager roles and above.
        </p>
      </div>
    );
  }

  if (visibleCities.length === 0) {
    return (
      <div className="app-empty-state app-empty-state--dashed">
        <p className="app-empty-state-title">No assigned cities</p>
        <p className="app-empty-state-body">
          Ask a Director to assign cities you can manage before changing market status.
        </p>
      </div>
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

      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search cities..."
        className="max-w-md"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {filtered.map((city) => {
          const busy = savingId === city.id;
          return (
            <div key={city.id} className="rounded-xl border border-brand-border bg-brand-surface/40 p-4 space-y-3">
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
                    <WfBadge tone={STATUS_TONES[city.status]}>{CITY_STATUS_LABELS[city.status]}</WfBadge>
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
                  {city.recommendOpen ? 'Clear recommendation flag' : 'Flag manager recommendation'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
