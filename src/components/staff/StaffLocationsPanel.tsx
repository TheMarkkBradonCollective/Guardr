import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Client,
  ClientLocation,
  JobLocation,
  JobLocationStatus,
  LocationRiskLevel,
  SecurityRequest,
  SessionUser,
} from '../../types';
import { canReviewJobRequests } from '../../lib/permissions';
import { clientDisplayName } from '../../lib/clientType';
import {
  JOB_LOCATION_STATUS_LABELS,
  LOCATION_RISK_OPTIONS,
  archiveJobLocation,
  approveJobLocation,
  countClientsUsingLocation,
  countJobsUsingLocation,
  filterJobLocations,
  findMatchingJobLocation,
  isLocationListed,
  jobLocationBrowseBucket,
  newJobLocationDraft,
  rejectJobLocation,
  type JobLocationStatusFilter,
} from '../../lib/jobLocations';
import { DEFAULT_CALIFORNIA_CITY, formatCityLabel, resolveJobCity } from '../../lib/californiaCities';
import { getSelectableCityNamesForClients } from '../../lib/platformCities';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { useLayoutFormFactor } from '../../surfaces';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { useStaffShellCreateRegistration } from './StaffShellCreateContext';
import { AppButton } from '../ui/AppButton';
import { JobLocationCoordsFields } from '../jobs/JobLocationCoordsFields';
import { MapPin, Plus } from 'lucide-react';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';

interface StaffLocationsPanelProps {
  currentUser: SessionUser;
  locations: JobLocation[];
  jobs: SecurityRequest[];
  clients: Client[];
  clientLocations: ClientLocation[];
  onSave: (location: JobLocation) => void | Promise<void>;
}

const STATUS_TONES: Record<JobLocationStatus, 'warning' | 'success' | 'danger' | 'muted'> = {
  pending: 'warning',
  active: 'success',
  rejected: 'danger',
  archived: 'muted',
};

const STATUS_CHIP_TONE: Record<JobLocationStatus, StatusTone> = {
  pending: 'warning',
  active: 'positive',
  rejected: 'negative',
  archived: 'neutral',
};

function emptyDraft(): {
  name: string;
  address: string;
  state: string;
  riskLevel: LocationRiskLevel;
  siteInstructions: string;
  parkingInstructions: string;
  accessInstructions: string;
  notes: string;
  listed: boolean;
  latitude?: number;
  longitude?: number;
} {
  return {
    name: '',
    address: '',
    state: DEFAULT_CALIFORNIA_CITY,
    riskLevel: 'medium',
    siteInstructions: '',
    parkingInstructions: '',
    accessInstructions: '',
    notes: '',
    listed: true,
  };
}

export function StaffLocationsPanel({
  currentUser,
  locations,
  jobs,
  clients,
  clientLocations,
  onSave,
}: StaffLocationsPanelProps) {
  const formFactor = useLayoutFormFactor();
  const canManage = canReviewJobRequests(currentUser);
  const hideTrigger = formFactor === 'desktop';
  const selectableCities = getSelectableCityNamesForClients();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobLocationStatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const startCreate = useCallback(() => {
    setCreating(true);
    setSelectedId(null);
    setDraft(emptyDraft());
    setError('');
    setMsg('');
  }, []);

  useStaffShellCreateRegistration(canManage ? 'location' : null, startCreate);

  const filtered = useMemo(
    () => filterJobLocations(locations, { search, status: statusFilter, jobs }),
    [locations, search, statusFilter, jobs]
  );

  const tabCounts = useMemo(() => {
    const counts = { all: locations.length, active: 0, rejected: 0, archived: 0 };
    for (const loc of locations) {
      const bucket = jobLocationBrowseBucket(loc, jobs);
      if (bucket) counts[bucket] += 1;
    }
    return counts;
  }, [locations, jobs]);

  const selected = creating
    ? null
    : locations.find((loc) => loc.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (creating) return;
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [creating, selected, selectedId]);

  useEffect(() => {
    if (!selected || creating) return;
    setDraft({
      name: selected.name,
      address: selected.address,
      state: selected.state ?? DEFAULT_CALIFORNIA_CITY,
      riskLevel: selected.riskLevel,
      siteInstructions: selected.siteInstructions ?? '',
      parkingInstructions: selected.parkingInstructions ?? '',
      accessInstructions: selected.accessInstructions ?? '',
      notes: selected.notes ?? '',
      listed: isLocationListed(selected),
      latitude: selected.latitude,
      longitude: selected.longitude,
    });
    setError('');
    setMsg('');
  }, [selected?.id, creating]);

  const reuseHint = useMemo(() => {
    if (!draft.address.trim()) return null;
    const match = findMatchingJobLocation(
      locations,
      draft.address,
      draft.state,
      selected?.id
    );
    return match ?? null;
  }, [draft.address, draft.state, locations, selected?.id]);

  const jobCount = selected ? countJobsUsingLocation(jobs, selected.id) : 0;
  const clientCount = selected ? countClientsUsingLocation(clientLocations, selected.id) : 0;
  const createdByClient = selected?.createdByClientId
    ? clients.find((c) => c.id === selected.createdByClientId)
    : undefined;

  const runSave = async (next: JobLocation, successMessage: string) => {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await onSave(next);
      setMsg(successMessage);
      setCreating(false);
      setSelectedId(next.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save location.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!canManage) return;
    if (draft.address.trim().length < 4) {
      setError('Enter a valid street address.');
      return;
    }
    if (reuseHint) {
      setError(
        `This address already exists as “${reuseHint.name}”. Open that location to manage it, or change the address.`
      );
      setSelectedId(reuseHint.id);
      setCreating(false);
      return;
    }
    const location = newJobLocationDraft({
      name: draft.name || draft.address,
      address: draft.address,
      state: formatCityLabel(draft.state),
      latitude: draft.latitude,
      longitude: draft.longitude,
      riskLevel: draft.riskLevel,
      siteInstructions: draft.siteInstructions,
      parkingInstructions: draft.parkingInstructions,
      accessInstructions: draft.accessInstructions,
      notes: draft.notes,
      listed: draft.listed,
      status: 'active',
    });
    await runSave(location, 'Location saved for reuse across jobs and clients.');
  };

  const handleUpdate = async () => {
    if (!canManage || !selected) return;
    if (draft.address.trim().length < 4) {
      setError('Enter a valid street address.');
      return;
    }
    const next: JobLocation = {
      ...selected,
      name: draft.name.trim() || draft.address.trim(),
      address: draft.address.trim(),
      state: formatCityLabel(draft.state),
      latitude: draft.latitude,
      longitude: draft.longitude,
      riskLevel: draft.riskLevel,
      listed: draft.listed,
      siteInstructions: draft.siteInstructions.trim() || undefined,
      parkingInstructions: draft.parkingInstructions.trim() || undefined,
      accessInstructions: draft.accessInstructions.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      placeKey: selected.placeKey,
      updatedAt: new Date().toISOString(),
    };
    // Recompute place key via draft helper fields
    const remapped = newJobLocationDraft({
      name: next.name,
      address: next.address,
      state: next.state,
      latitude: next.latitude,
      longitude: next.longitude,
      riskLevel: next.riskLevel,
      siteInstructions: next.siteInstructions,
      parkingInstructions: next.parkingInstructions,
      accessInstructions: next.accessInstructions,
      notes: next.notes,
      listed: next.listed,
      status: next.status,
      createdByClientId: next.createdByClientId,
    });
    await runSave(
      {
        ...next,
        placeKey: remapped.placeKey,
        id: selected.id,
        createdAt: selected.createdAt,
        reviewedAt: selected.reviewedAt,
        reviewedBy: selected.reviewedBy,
        status: selected.status,
      },
      'Location updated.'
    );
  };

  const handleApprove = async () => {
    if (!canManage || !selected) return;
    await runSave(approveJobLocation(selected, currentUser), 'Location approved for reuse.');
  };

  const handleReject = async () => {
    if (!canManage || !selected) return;
    await runSave(rejectJobLocation(selected, currentUser), 'Location rejected.');
  };

  const handleArchive = async () => {
    if (!canManage || !selected) return;
    await runSave(archiveJobLocation(selected), 'Location archived.');
  };

  const handleReactivate = async () => {
    if (!canManage || !selected) return;
    await runSave(
      { ...selected, status: 'active', updatedAt: new Date().toISOString() },
      'Location reactivated.'
    );
  };

  if (!canManage) {
    if (formFactor === 'desktop') {
      return (
        <WorkbenchEmpty message="Locations are limited to staff who can review job postings." />
      );
    }
    return (
      <div className="app-empty-state app-empty-state--dashed">
        <p className="app-empty-state-title">Locations unavailable</p>
        <p className="app-empty-state-body">
          Location quality control is limited to staff who can review job postings.
        </p>
      </div>
    );
  }

  const filterTabs = (
    <StaffListFilterTabs
      aria-label="Location status"
      activeId={statusFilter}
      onChange={(id) => setStatusFilter(id as JobLocationStatusFilter)}
      tabs={[
        { id: 'all', label: 'All', count: tabCounts.all },
        { id: 'active', label: 'Active', count: tabCounts.active },
        { id: 'rejected', label: 'Rejected', count: tabCounts.rejected },
        { id: 'archived', label: 'Archived', count: tabCounts.archived },
      ]}
    />
  );

  const editor = (
    <div className="space-y-4">
      {!creating && selected && (
        <div className="flex flex-wrap items-center gap-2">
          <WfBadge
            tone={
              STATUS_TONES[
                jobLocationBrowseBucket(selected, jobs) === 'archived' && selected.status === 'active'
                  ? 'archived'
                  : selected.status
              ]
            }
          >
            {jobLocationBrowseBucket(selected, jobs) === 'archived' && selected.status === 'active'
              ? 'Archived'
              : JOB_LOCATION_STATUS_LABELS[selected.status]}
          </WfBadge>
          {!isLocationListed(selected) && <WfBadge tone="muted">Private</WfBadge>}
          <span className="text-xs text-brand-text-muted">
            {jobCount} job{jobCount === 1 ? '' : 's'} · {clientCount} client
            {clientCount === 1 ? '' : 's'}
          </span>
          {createdByClient && (
            <span className="text-xs text-brand-text-muted">
              First saved by {clientDisplayName(createdByClient)}
            </span>
          )}
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="uber-label">Site name</span>
        <input
          className="uber-input w-full"
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Venue or site name"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="uber-label">Street address</span>
        <input
          className="uber-input w-full"
          value={draft.address}
          onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Street address"
        />
      </label>

      {reuseHint && creating && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Matching place already saved as “{reuseHint.name}”. Reuse that record instead of creating a
          duplicate.
        </p>
      )}

      <label className="block space-y-1.5">
        <span className="uber-label">City</span>
        <select
          className="uber-select w-full"
          value={draft.state}
          onChange={(e) => setDraft((prev) => ({ ...prev, state: resolveJobCity(e.target.value) }))}
        >
          {selectableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-1.5">
        <span className="uber-label">Risk level</span>
        <div className="segmented-control segmented-control-full">
          {LOCATION_RISK_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, riskLevel: opt.id }))}
              className={`segmented-control-btn flex-1 py-2 text-xs ${
                draft.riskLevel === opt.id ? 'segmented-control-btn-active' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="uber-label">Listing</span>
        <label className="flex items-start gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={!draft.listed}
            onChange={(e) => setDraft((prev) => ({ ...prev, listed: !e.target.checked }))}
          />
          <span>
            Private location — staff can manage it, but other clients cannot browse or reuse this
            address.
          </span>
        </label>
      </div>

      <JobLocationCoordsFields
        latitude={draft.latitude}
        longitude={draft.longitude}
        onCoordsChange={(coords) =>
          setDraft((prev) => ({
            ...prev,
            latitude: coords?.lat,
            longitude: coords?.lng,
          }))
        }
      />

      <label className="block space-y-1.5">
        <span className="uber-label">Site instructions</span>
        <textarea
          className="uber-input w-full"
          rows={3}
          value={draft.siteInstructions}
          onChange={(e) => setDraft((prev) => ({ ...prev, siteInstructions: e.target.value }))}
          placeholder="Entry points, post orders notes, QC details…"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="uber-label">Parking</span>
        <textarea
          className="uber-input w-full"
          rows={2}
          value={draft.parkingInstructions}
          onChange={(e) => setDraft((prev) => ({ ...prev, parkingInstructions: e.target.value }))}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="uber-label">Access</span>
        <textarea
          className="uber-input w-full"
          rows={2}
          value={draft.accessInstructions}
          onChange={(e) => setDraft((prev) => ({ ...prev, accessInstructions: e.target.value }))}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="uber-label">Staff QC notes</span>
        <textarea
          className="uber-input w-full"
          rows={2}
          value={draft.notes}
          onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Internal quality-control notes"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {msg && <p className="text-sm text-brand-primary">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        {creating ? (
          <AppButton variant="primary" size="sm" disabled={busy} onClick={() => void handleCreate()}>
            {busy ? 'Saving…' : 'Save location'}
          </AppButton>
        ) : (
          <>
            <AppButton variant="primary" size="sm" disabled={busy || !selected} onClick={() => void handleUpdate()}>
              {busy ? 'Saving…' : 'Save changes'}
            </AppButton>
            {selected && selected.status !== 'rejected' && (
              <AppButton variant="outline" size="sm" disabled={busy} onClick={() => void handleReject()}>
                Reject address
              </AppButton>
            )}
            {(selected?.status === 'active' || selected?.status === 'pending') && (
              <AppButton variant="outline" size="sm" disabled={busy} onClick={() => void handleArchive()}>
                Archive
              </AppButton>
            )}
            {selected?.status === 'pending' && (
              <AppButton variant="outline" size="sm" disabled={busy} onClick={() => void handleApprove()}>
                Activate
              </AppButton>
            )}
            {(selected?.status === 'archived' || selected?.status === 'rejected') && (
              <AppButton variant="outline" size="sm" disabled={busy} onClick={() => void handleReactivate()}>
                Reactivate
              </AppButton>
            )}
          </>
        )}
        {creating && (
          <AppButton
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setCreating(false);
              setDraft(emptyDraft());
              setError('');
            }}
          >
            Cancel
          </AppButton>
        )}
      </div>
    </div>
  );

  const locationColumns: GuardrTableColumn<JobLocation>[] = [
    {
      id: 'site',
      header: 'Site',
      grow: true,
      sortValue: (loc) => loc.name.toLowerCase(),
      render: (loc) => (
        <>
          <p className="uber-workbench-table-primary">{loc.name}</p>
          <p className="uber-workbench-table-secondary">{loc.address}</p>
        </>
      ),
    },
    {
      id: 'city',
      header: 'City',
      hideOnNarrow: true,
      sortValue: (loc) => loc.state ?? '',
      render: (loc) => loc.state || 'City TBD',
    },
    {
      id: 'jobs',
      header: 'Jobs',
      numeric: true,
      align: 'right',
      sortValue: (loc) => countJobsUsingLocation(jobs, loc.id),
      render: (loc) => String(countJobsUsingLocation(jobs, loc.id)),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (loc) => loc.status,
      render: (loc) => {
        const archivedActive = jobLocationBrowseBucket(loc, jobs) === 'archived' && loc.status === 'active';
        return (
          <StatusChip tone={archivedActive ? 'neutral' : STATUS_CHIP_TONE[loc.status]}>
            {archivedActive ? 'Archived' : JOB_LOCATION_STATUS_LABELS[loc.status]}
            {!isLocationListed(loc) ? ' · Private' : ''}
          </StatusChip>
        );
      },
    },
  ];

  const list = (
    <div className="space-y-2">
      {filtered.length === 0 ? (
        <p className="text-sm text-brand-text-muted px-1 py-4 text-center">
          No locations match your filters.
        </p>
      ) : (
        filtered.map((loc) => {
          const active = !creating && selected?.id === loc.id;
          const jobsAt = countJobsUsingLocation(jobs, loc.id);
          const clientsAt = countClientsUsingLocation(clientLocations, loc.id);
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => {
                setCreating(false);
                setSelectedId(loc.id);
              }}
              className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                active
                  ? 'border-brand-text bg-brand-surface'
                  : 'border-brand-border hover:bg-brand-surface/60'
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-text-muted" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{loc.name}</p>
                    <WfBadge
                      tone={
                        STATUS_TONES[
                          jobLocationBrowseBucket(loc, jobs) === 'archived' && loc.status === 'active'
                            ? 'archived'
                            : loc.status
                        ]
                      }
                    >
                      {jobLocationBrowseBucket(loc, jobs) === 'archived' && loc.status === 'active'
                        ? 'Archived'
                        : JOB_LOCATION_STATUS_LABELS[loc.status]}
                    </WfBadge>
                    {!isLocationListed(loc) ? <WfBadge tone="muted">Private</WfBadge> : null}
                  </div>
                  <p className="text-xs text-brand-text-muted mt-0.5 truncate">{loc.address}</p>
                  <p className="text-xs text-brand-text-muted mt-1">
                    {loc.state || 'City TBD'} · {jobsAt} job{jobsAt === 1 ? '' : 's'} · {clientsAt}{' '}
                    client{clientsAt === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-roster-panel adm-finance-page"
        data-tour="staff-locations"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Quality control"
            subtitle="Sites are added when staff approve client jobs. Reject blocks the address for other clients; archived means used before with no upcoming jobs; private stays staff-only."
            actions={
              <WfSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search locations…"
                className="min-w-[12rem]"
              />
            }
          />
        }
      >
        <div className="mb-4">{filterTabs}</div>
        {locations.length === 0 && !creating ? (
          <WorkbenchEmpty message="No saved locations yet. Approve a client job to add its site, or use + Add location." />
        ) : (
          <WorkbenchSplit
            list={
              <GuardrDataTable
                columns={locationColumns}
                rows={filtered}
                rowKey={(loc) => loc.id}
                selectedKey={creating ? undefined : selected?.id}
                onRowClick={(loc) => {
                  setCreating(false);
                  setSelectedId(loc.id);
                }}
                caption="Locations"
                emptyMessage="No locations match your filters."
                cardLayout={{ title: 'site', subtitle: 'city', trailing: 'status' }}
              />
            }
            detail={
              creating || selected ? (
                editor
              ) : (
                <WorkbenchEmpty message="Select a location to manage quality-control details." />
              )
            }
          />
        )}
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <StaffOpsPageShell
        className="staff-roster-panel"
        data-tour="staff-locations"
        toolbar={
          <>
            <div className="staff-ops-cta-stack">
              {!hideTrigger ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add location
                </button>
              ) : null}
            </div>
            <WfSearchBar value={search} onChange={setSearch} placeholder="Search locations…" className="max-w-md" />
            {filterTabs}
          </>
        }
      >
        <div
          className="tablet-split-panel"
          data-selected={creating || selected ? 'true' : undefined}
        >
          <div className="split-list-pane min-h-0">{list}</div>
          <div className="split-detail-pane min-h-0">
            {creating || selected ? (
              editor
            ) : (
              <div className="sft-empty">
                <p className="sft-empty-title">Select a location</p>
                <p className="sft-empty-message">
                  Choose a site to review quality-control details, or add a new location.
                </p>
              </div>
            )}
          </div>
        </div>
      </StaffOpsPageShell>
    );
  }

  if (creating || selectedId) {
    return (
      <div className="space-y-4">
        <AppSubScreenHeader
          backLabel="Locations"
          onBack={() => {
            setCreating(false);
            setSelectedId(null);
          }}
          title={creating ? 'Add location' : selected?.name || 'Location'}
        />
        {editor}
      </div>
    );
  }

  return (
    <StaffOpsPageShell
      className="staff-roster-panel"
      data-tour="staff-locations"
      toolbar={
        <>
          <div className="staff-ops-cta-stack">
            {!hideTrigger ? (
              <button
                type="button"
                onClick={startCreate}
                className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add location
              </button>
            ) : null}
          </div>
          <WfSearchBar value={search} onChange={setSearch} placeholder="Search locations…" className="max-w-md" />
          {filterTabs}
        </>
      }
    >
      {list}
    </StaffOpsPageShell>
  );
}
