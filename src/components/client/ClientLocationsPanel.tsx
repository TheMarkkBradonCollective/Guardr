import React, { useState } from 'react';
import type { Client, ClientLocation, LocationRiskLevel, SessionUser } from '../../types';
import {
  LOCATION_RISK_OPTIONS,
  activeClientLocations,
  canClientSetLocationRisk,
  locationStatusLabel,
  newClientLocationDraft,
} from '../../lib/clientLocations';
import { CALIFORNIA_CITIES, DEFAULT_CALIFORNIA_CITY, formatCityLabel, resolveJobCity } from '../../lib/californiaCities';
import { MapPin, Plus } from 'lucide-react';
import { ResponsiveFormPage } from '../layouts/desktop/DesktopPageShell';
import { useDevice } from '../../lib/platform';

interface ClientLocationsPanelProps {
  client: Client;
  locations: ClientLocation[];
  onSave: (location: ClientLocation) => void | Promise<void>;
}

export function ClientLocationsPanel({ client, locations, onSave }: ClientLocationsPanelProps) {
  const { formFactor } = useDevice();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState(DEFAULT_CALIFORNIA_CITY);
  const [riskLevel, setRiskLevel] = useState<LocationRiskLevel>('medium');
  const [saving, setSaving] = useState(false);

  const mine = activeClientLocations(locations, client.id);
  const trusted = canClientSetLocationRisk(client);

  const handleAdd = async () => {
    if (!name.trim() || address.trim().length < 4) return;
    setSaving(true);
    try {
      const draft = newClientLocationDraft(
        client.id,
        { name, address, state: formatCityLabel(state), riskLevel },
        client
      );
      await onSave(draft);
      setName('');
      setAddress('');
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className={formFactor === 'desktop' ? 'adm-locations-panel' : 'space-y-5'}>
      <div>
        <h3 className="text-lg font-bold tracking-tight">My Locations</h3>
        <p className="text-sm text-brand-text-muted mt-1">
          Save sites for faster job posting.{trusted ? ' As a trusted client you set risk level directly.' : ' New sites need staff approval.'}
        </p>
      </div>

      {mine.length > 0 && (
        <div className="space-y-2">
          {mine.map((loc) => (
            <div key={loc.id} className="wf-list-card">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{loc.name}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">{loc.address}</p>
                  <p className="text-xs text-brand-text-muted mt-1 capitalize">
                    Risk: {loc.riskLevel} · {locationStatusLabel(loc.status)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-brand-border p-4 space-y-3">
        <p className="uber-label flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add location
        </p>
        <input
          className="uber-input rounded-xl"
          placeholder="Site name"
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
          {CALIFORNIA_CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
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
        <button
          type="button"
          disabled={saving || !name.trim() || address.trim().length < 4}
          onClick={() => void handleAdd()}
          className="uber-btn-primary w-full"
        >
          {saving ? 'Saving…' : trusted ? 'Save location' : 'Submit for staff approval'}
        </button>
      </div>
    </div>
  );

  if (formFactor === 'desktop') {
    return (
      <ResponsiveFormPage title="My locations" subtitle="Save sites for faster job posting">
        {content}
      </ResponsiveFormPage>
    );
  }

  return content;
}

interface StaffClientLocationsPanelProps {
  locations: ClientLocation[];
  currentUser: SessionUser;
  onApprove: (locationId: string) => void | Promise<void>;
  onReject: (locationId: string) => void | Promise<void>;
}

export function StaffClientLocationsPanel({
  locations,
  onApprove,
  onReject,
}: StaffClientLocationsPanelProps) {
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
