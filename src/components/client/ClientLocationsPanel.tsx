import React, { useMemo, useState } from 'react';
import type { Client, ClientLocation, JobLocation, LocationRiskLevel, SessionUser } from '../../types';
import {
  LOCATION_RISK_OPTIONS,
  activeClientLocations,
  canClientSetLocationRisk,
  locationStatusLabel,
  newClientLocationDraft,
} from '../../lib/clientLocations';
import { useClientCapabilities } from './ClientCapabilitiesContext';
import { browsableSharedLocations, isLocationListed } from '../../lib/jobLocations';
import { DEFAULT_CALIFORNIA_CITY, formatCityLabel, resolveJobCity } from '../../lib/californiaCities';
import { getSelectableCityNamesForClients } from '../../lib/platformCities';
import { MapPin, Plus } from 'lucide-react';
import { useLayoutFormFactor } from '../../surfaces';
import { WorkbenchPage, WorkbenchPanel } from '../baseui/layout/WorkbenchLayout';

interface ClientLocationsPanelProps {
  client: Client;
  locations: ClientLocation[];
  sharedLocations?: JobLocation[];
  onSave: (location: ClientLocation) => void | Promise<void>;
}

export function ClientLocationsPanel({
  client,
  locations,
  sharedLocations = [],
  onSave,
}: ClientLocationsPanelProps) {
  const formFactor = useLayoutFormFactor();
  const caps = useClientCapabilities();
  const selectableClientCities = getSelectableCityNamesForClients();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState(DEFAULT_CALIFORNIA_CITY);
  const [riskLevel, setRiskLevel] = useState<LocationRiskLevel>('medium');
  const [listed, setListed] = useState(true);
  const [siteInstructions, setSiteInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const mine = activeClientLocations(locations, client.id);
  const familiar = useMemo(
    () =>
      browsableSharedLocations(sharedLocations, client.id).filter(
        (loc) => !mine.some((m) => m.sharedLocationId === loc.id)
      ),
    [sharedLocations, client.id, mine]
  );
  const trusted = canClientSetLocationRisk(client);

  const handleAdd = async () => {
    if (!name.trim() || address.trim().length < 4) return;
    setSaving(true);
    try {
      const draft = newClientLocationDraft(
        client.id,
        {
          name,
          address,
          state: formatCityLabel(state),
          riskLevel,
          listed: caps.has('multiple-sites') ? listed : false,
          siteInstructions: caps.has('site-requirements') ? siteInstructions : undefined,
        },
        client
      );
      await onSave(draft);
      setName('');
      setAddress('');
      setListed(true);
      setSiteInstructions('');
    } finally {
      setSaving(false);
    }
  };

  const toggleListed = async (loc: ClientLocation) => {
    await onSave({ ...loc, listed: loc.listed === false });
  };

  const content = (
    <div className={formFactor === 'desktop' ? 'adm-locations-panel' : 'space-y-5'}>
      {formFactor !== 'desktop' ? (
        <div>
          <h3 className="text-lg font-bold tracking-tight">
            {caps.isPersonal ? 'My places' : 'Sites'}
          </h3>
          <p className="text-sm text-brand-text-muted mt-1">
            {caps.isPersonal
              ? 'Save preferred places — home, venues, and anywhere you hire coverage more than once.'
              : 'Manage multiple sites, keep location notes, and mark a site private so only staff can reuse it.'}
            {trusted ? ' As a trusted client you set risk level directly.' : null}
          </p>
        </div>
      ) : null}

      {caps.has('multiple-sites') && familiar.length > 0 && (
        <div className="space-y-2">
          <p className="uber-label">Familiar locations</p>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {familiar.map((loc) => (
              <div key={loc.id} className="wf-list-card">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{loc.name}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">{loc.address}</p>
                    <p className="text-xs text-brand-text-muted mt-1 capitalize">
                      Shared catalog · {loc.riskLevel} risk
                      {!isLocationListed(loc) ? ' · Private' : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mine.length > 0 && (
        <div className="space-y-2">
          <p className="uber-label">{caps.isPersonal ? 'Saved locations' : 'Your saved sites'}</p>
          {mine.map((loc) => (
            <div key={loc.id} className="wf-list-card">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{loc.name}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">{loc.address}</p>
                  <p className="text-xs text-brand-text-muted mt-1 capitalize">
                    Risk: {loc.riskLevel} · {locationStatusLabel(loc.status)}
                    {loc.listed === false ? ' · Private' : ''}
                  </p>
                  {caps.has('multiple-sites') ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-brand-text">
                    <input
                      type="checkbox"
                      checked={loc.listed === false}
                      onChange={() => void toggleListed(loc)}
                    />
                    Do not list (private)
                  </label>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="staff-mgmt-section space-y-3">
        <p className="staff-mgmt-section-title flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add {caps.isPersonal ? 'location' : 'site'}
        </p>
        <input
          className="uber-input rounded-xl"
          placeholder={caps.isPersonal ? 'Place name (home, venue, etc.)' : 'Site name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="uber-input rounded-xl"
          placeholder="Street address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <select className="uber-select w-full rounded-xl" value={state} onChange={(e) => setState(resolveJobCity(e.target.value))}>
          {selectableClientCities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        {caps.has('site-requirements') ? (
          <textarea
            className="uber-input rounded-xl min-h-[88px]"
            placeholder="Site-specific requirements — access, post notes, who to call on site…"
            value={siteInstructions}
            onChange={(e) => setSiteInstructions(e.target.value)}
          />
        ) : null}
        {trusted && (
          <div className="segmented-control segmented-control-full">
            {LOCATION_RISK_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRiskLevel(opt.id)}
                className={`segmented-control-btn flex-1 py-2 text-xs ${
                  riskLevel === opt.id ? 'segmented-control-btn-active' : ''
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {caps.has('multiple-sites') ? (
        <label className="flex items-start gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={!listed}
            onChange={(e) => setListed(!e.target.checked)}
          />
          <span>Do not list — keep this site private (staff can still manage it).</span>
        </label>
        ) : null}
        <button
          type="button"
          disabled={saving || !name.trim() || address.trim().length < 4}
          onClick={() => void handleAdd()}
          className="uber-btn-primary w-full"
        >
          {saving ? 'Saving…' : caps.isPersonal ? 'Save location' : 'Save site'}
        </button>
      </div>
    </div>
  );

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage>
        <WorkbenchPanel>
          {content}
        </WorkbenchPanel>
      </WorkbenchPage>
    );
  }

  return content;
}

interface StaffClientLocationsQueueProps {
  locations: ClientLocation[];
  currentUser: SessionUser;
  onApprove: (locationId: string) => void | Promise<void>;
  onReject: (locationId: string) => void | Promise<void>;
}

/** @deprecated Pending client-location queue removed — kept for any legacy imports. */
export function StaffClientLocationsQueue({
  locations,
  onApprove,
  onReject,
}: StaffClientLocationsQueueProps) {
  const pending = locations.filter((l) => l.status === 'pending');
  if (!pending.length) {
    return (
      <p className="text-sm text-brand-text-muted">No client locations awaiting approval.</p>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((loc) => (
        <div key={loc.id} className="wf-list-card">
          <p className="font-semibold text-sm">{loc.name}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">{loc.address}</p>
          <p className="text-xs text-brand-text-muted mt-1 capitalize">Risk: {loc.riskLevel}</p>
          <div className="flex gap-2 mt-3">
            <button type="button" className="uber-btn-primary flex-1 text-sm" onClick={() => void onApprove(loc.id)}>
              Approve
            </button>
            <button type="button" className="uber-btn-secondary flex-1 text-sm" onClick={() => void onReject(loc.id)}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
