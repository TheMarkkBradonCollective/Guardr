import React, { useState } from 'react';
import { SecurityRequest } from '../../types';
import { computeDurationHours, formatDuration, toDatetimeLocal } from '../../lib/dates';
import { minScheduleDatetimeLocal, validateShiftSchedule } from '../../lib/jobEditRules';
import { computeGuardPay } from '../../lib/payments';
import { US_STATES } from '../../lib/states';
import { listingFieldsFromJob } from '../../lib/jobListing';
import { JobLocationCoordsFields } from '../jobs/JobLocationCoordsFields';
import { UseCurrentLocationButton } from '../jobs/UseCurrentLocationButton';
import { JobPostOrdersFields } from '../jobs/JobPostOrdersFields';
import { JobOperationalDetailsFields } from '../jobs/JobOperationalDetailsFields';
import { operationalDetailsFromJob, normalizeJobOperationalDetails } from '../../lib/jobOperationalDetails';
import { JobOperationalDetails } from '../../types';
import { Loader2 } from 'lucide-react';

interface EditRequestFormProps {
  request: SecurityRequest;
  scheduleLocked?: boolean;
  onSave: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onCancel: () => void;
  /** Render inside AppFormSheet — hides duplicate header chrome */
  sheet?: boolean;
}

export function EditRequestForm({
  request,
  scheduleLocked = false,
  onSave,
  onCancel,
  sheet = false,
}: EditRequestFormProps) {
  const [title, setTitle] = useState(request.title);
  const [siteName, setSiteName] = useState(request.siteName || '');
  const [address, setAddress] = useState(request.address || request.location);
  const [state, setState] = useState(request.state || '');
  const [startDate, setStartDate] = useState(toDatetimeLocal(request.startDate));
  const [endDate, setEndDate] = useState(toDatetimeLocal(request.endDate));
  const [guardsNeeded, setGuardsNeeded] = useState(request.guardsNeeded ?? 1);
  const [hourlyRate, setHourlyRate] = useState(request.hourlyRate);
  const [listing, setListing] = useState(() => listingFieldsFromJob(request));
  const [operational, setOperational] = useState<JobOperationalDetails>(() => operationalDetailsFromJob(request));
  const [latitude, setLatitude] = useState(request.latitude);
  const [longitude, setLongitude] = useState(request.longitude);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const minStart = minScheduleDatetimeLocal();
  const durationHours = computeDurationHours(startDate, endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Job title is required.');
      return;
    }
    if (!address.trim() || state.length !== 2) {
      setError('Address and state are required.');
      return;
    }

    if (!scheduleLocked) {
      const scheduleError = validateShiftSchedule(startDate, endDate);
      if (scheduleError) {
        setError(scheduleError);
        return;
      }
    }

    setError(null);
    setSaving(true);
    try {
      const location = siteName.trim() ? `${siteName.trim()} — ${address.trim()}` : address.trim();

      if (scheduleLocked) {
        await onSave(request.id, {
          title: trimmedTitle,
          siteName: siteName.trim(),
          address: address.trim(),
          state: state.toUpperCase(),
          location,
          latitude,
          longitude,
        });
      } else {
        const guardPay = computeGuardPay(hourlyRate);
        const estimatedPayout = Math.round(durationHours * hourlyRate * guardsNeeded * 100) / 100;
        await onSave(request.id, {
          title: trimmedTitle,
          siteName: siteName.trim(),
          address: address.trim(),
          state: state.toUpperCase(),
          location,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          durationHours,
          guardsNeeded,
          hourlyRate,
          guardPay,
          estimatedPayout,
          description: listing.description.trim(),
          uniformRequirements: listing.uniformRequirements.trim(),
          equipmentRequirements: listing.equipmentRequirements.trim(),
          siteInstructions: listing.siteInstructions.trim(),
          contactName: listing.contactName.trim() || undefined,
          contactPhone: listing.contactPhone.trim() || undefined,
          parkingInstructions: listing.parkingInstructions.trim() || undefined,
          accessInstructions: listing.accessInstructions.trim() || undefined,
          latitude,
          longitude,
          operationalDetails: normalizeJobOperationalDetails(operational),
        });
      }
      onCancel();
    } catch (err) {
      console.error('Failed to save job edit:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={sheet ? 'space-y-4' : 'space-y-4 border-t border-brand-border pt-4'}
    >
      {!sheet && (
        <div>
          <p className="text-sm font-semibold text-brand-primary">
            {scheduleLocked ? 'Edit title & location' : 'Edit job listing'}
          </p>
          {scheduleLocked && (
            <p className="text-xs text-brand-text-muted mt-1">
              Schedule is locked after payment. Title and location can still be updated.
            </p>
          )}
        </div>
      )}
      {error && (
        <p className="text-xs text-red-400 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
      )}
      <div>
        <label className="uber-label block mb-1">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="uber-input w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="uber-label block mb-1">Site name</label>
          <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="uber-input w-full" />
        </div>
        <div>
          <label className="uber-label block mb-1">State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} className="uber-input w-full">
            <option value="">Select</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="uber-label block mb-1">Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="uber-input w-full" />
      </div>
      <UseCurrentLocationButton
        onLocated={({ coords, addressLine, stateCode }) => {
          setLatitude(coords.lat);
          setLongitude(coords.lng);
          if (addressLine) setAddress(addressLine);
          if (stateCode) setState(stateCode);
        }}
      />
      <JobLocationCoordsFields
        latitude={latitude}
        longitude={longitude}
        onCoordsChange={(coords) => {
          if (coords) {
            setLatitude(coords.lat);
            setLongitude(coords.lng);
          } else {
            setLatitude(undefined);
            setLongitude(undefined);
          }
        }}
      />
      {!scheduleLocked && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="uber-label block mb-1">Start</label>
              <input
                type="datetime-local"
                min={minStart}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="uber-input w-full"
              />
            </div>
            <div>
              <label className="uber-label block mb-1">End</label>
              <input
                type="datetime-local"
                min={startDate || minStart}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="uber-input w-full"
              />
            </div>
          </div>
          <p className="text-xs text-brand-text-muted">
            {durationHours > 0 ? formatDuration(durationHours) : 'End must be after start'} · no past times
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="uber-label block mb-1">Guards</label>
              <input
                type="number"
                min={1}
                value={guardsNeeded}
                onChange={(e) => setGuardsNeeded(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="uber-input w-full"
              />
            </div>
            <div>
              <label className="uber-label block mb-1">Rate ($/hr)</label>
              <input
                type="number"
                min={20}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Math.max(20, parseInt(e.target.value, 10) || 20))}
                className="uber-input w-full"
              />
            </div>
          </div>
          <JobPostOrdersFields value={listing} onChange={setListing} />
          <JobOperationalDetailsFields value={operational} onChange={setOperational} />
        </>
      )}
      <div className="app-action-row--2 pt-1">
        <button type="submit" disabled={saving} className="app-button-primary app-btn-sm gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save changes
        </button>
        <button type="button" onClick={onCancel} className="app-button-outline app-btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
