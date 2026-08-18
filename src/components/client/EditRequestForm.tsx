import React, { useRef, useState } from 'react';
import { SecurityRequest } from '../../types';
import { computeDurationHours, formatDuration, toDatetimeLocal } from '../../lib/dates';
import { minScheduleDatetimeLocal, validateShiftSchedule } from '../../lib/jobEditRules';
import { paidScheduleDurationHours } from '../../lib/jobScheduleChange';
import { rebillJobFromSnapshot } from '../../lib/payments';
import { cityFromGeocode, formatCityLabel, isCaliforniaCity, resolveJobCity, type CaliforniaCity } from '../../lib/californiaCities';
import { getSelectableCityNamesForClients } from '../../lib/platformCities';
import { listingFieldsFromJob } from '../../lib/jobListing';
import { JobLocationCoordsFields, type JobLocationCoordsFieldsHandle } from '../jobs/JobLocationCoordsFields';
import { UseCurrentLocationButton } from '../jobs/UseCurrentLocationButton';
import { JobPostOrdersFields } from '../jobs/JobPostOrdersFields';
import { JobOperationalDetailsFields } from '../jobs/JobOperationalDetailsFields';
import { operationalDetailsFromJob, normalizeJobOperationalDetails } from '../../lib/jobOperationalDetails';
import { JobOperationalDetails } from '../../types';
import { Loader2 } from 'lucide-react';
import { useClientCapabilities } from './ClientCapabilitiesContext';
import { clampClientGuardsNeeded } from '../../lib/clientCapabilities';

interface EditRequestFormProps {
  request: SecurityRequest;
  scheduleLocked?: boolean;
  /** Paid job — client may move shift times within paid hours (or request extension). */
  paidReschedule?: boolean;
  onSave: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onCancel: () => void;
  /** Render inside AppFormSheet — hides duplicate header chrome */
  sheet?: boolean;
}

export function EditRequestForm({
  request,
  scheduleLocked = false,
  paidReschedule = false,
  onSave,
  onCancel,
  sheet = false,
}: EditRequestFormProps) {
  const selectableClientCities = getSelectableCityNamesForClients();
  const caps = useClientCapabilities();
  const [title, setTitle] = useState(request.title);
  const [siteName, setSiteName] = useState(request.siteName || '');
  const [address, setAddress] = useState(request.address || request.location);
  const [state, setState] = useState<string>(() => resolveJobCity(request.state));
  const [startDate, setStartDate] = useState(toDatetimeLocal(request.startDate));
  const [endDate, setEndDate] = useState(toDatetimeLocal(request.endDate));
  const [guardsNeeded, setGuardsNeeded] = useState(request.guardsNeeded ?? 1);
  const [hourlyRate, setHourlyRate] = useState(request.hourlyRate);
  const [listing, setListing] = useState(() => listingFieldsFromJob(request));
  const [operational, setOperational] = useState<JobOperationalDetails>(() => operationalDetailsFromJob(request));
  const [latitude, setLatitude] = useState(request.latitude);
  const [longitude, setLongitude] = useState(request.longitude);
  const coordsFieldsRef = useRef<JobLocationCoordsFieldsHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const minStart = minScheduleDatetimeLocal();
  const durationHours = computeDurationHours(startDate, endDate);
  const paidHours = paidReschedule ? paidScheduleDurationHours(request) : null;
  const showScheduleFields = !scheduleLocked || paidReschedule;
  const titleOnlyLocked = scheduleLocked && !paidReschedule;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Job title is required.');
      return;
    }
    if (!address.trim() || !isCaliforniaCity(state)) {
      setError('Address and city are required.');
      return;
    }

    if (showScheduleFields) {
      const scheduleError = validateShiftSchedule(startDate, endDate);
      if (scheduleError) {
        setError(scheduleError);
        return;
      }
    }

    setError(null);
    setSaving(true);
    try {
      const pendingCoords = coordsFieldsRef.current?.commitPending();
      const submitLatitude = pendingCoords?.lat ?? latitude;
      const submitLongitude = pendingCoords?.lng ?? longitude;
      const location = siteName.trim() ? `${siteName.trim()} — ${address.trim()}` : address.trim();

      if (titleOnlyLocked) {
        await onSave(request.id, {
          title: trimmedTitle,
          siteName: siteName.trim(),
          address: address.trim(),
          state: formatCityLabel(state),
          location,
          latitude: submitLatitude,
          longitude: submitLongitude,
        });
      } else if (paidReschedule) {
        const billing = rebillJobFromSnapshot(request, {
          durationHours,
          guardsNeeded: request.guardsNeeded ?? 1,
        });
        await onSave(request.id, {
          title: trimmedTitle,
          siteName: siteName.trim(),
          address: address.trim(),
          state: formatCityLabel(state),
          location,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          durationHours,
          estimatedPayout: billing.estimatedPayout,
          guardPay: billing.guardPay,
          latitude: submitLatitude,
          longitude: submitLongitude,
        });
      } else {
        const nextGuards = clampClientGuardsNeeded(
          guardsNeeded,
          caps.clientType,
          request.guardsNeeded ?? 1
        );
        const billing = rebillJobFromSnapshot(request, {
          hourlyRate,
          durationHours,
          guardsNeeded: nextGuards,
        });
        await onSave(request.id, {
          title: trimmedTitle,
          siteName: siteName.trim(),
          address: address.trim(),
          state: formatCityLabel(state),
          location,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          durationHours,
          guardsNeeded: nextGuards,
          hourlyRate,
          guardPay: billing.guardPay,
          estimatedPayout: billing.estimatedPayout,
          description: listing.description.trim(),
          uniformRequirements: listing.uniformRequirements.trim(),
          equipmentRequirements: listing.equipmentRequirements.trim(),
          siteInstructions: listing.siteInstructions.trim(),
          contactName: listing.contactName.trim() || undefined,
          contactPhone: listing.contactPhone.trim() || undefined,
          parkingInstructions: listing.parkingInstructions.trim() || undefined,
          accessInstructions: listing.accessInstructions.trim() || undefined,
          latitude: submitLatitude,
          longitude: submitLongitude,
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
            {titleOnlyLocked ? 'Edit title & location' : paidReschedule ? 'Reschedule shift' : 'Edit job listing'}
          </p>
          {titleOnlyLocked && (
            <p className="text-xs text-brand-text-muted mt-1">
              Schedule is locked after payment. Title and location can still be updated.
            </p>
          )}
          {paidReschedule && paidHours != null && (
            <p className="text-xs text-brand-text-muted mt-1">
              Move your shift to new times within the {formatDuration(paidHours)} already paid for. Longer shifts
              may require client confirmation before guards are notified.
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
          <label className="uber-label block mb-1">City</label>
          <select value={state} onChange={(e) => setState(resolveJobCity(e.target.value))} className="uber-input w-full">
            {selectableClientCities.map((city) => (
              <option key={city} value={city}>{city}</option>
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
          setState(cityFromGeocode(addressLine, stateCode));
        }}
      />
      <JobLocationCoordsFields
        ref={coordsFieldsRef}
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
      {!titleOnlyLocked && (
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
            {durationHours > 0 ? formatDuration(durationHours) : 'End must be after start'}
            {paidHours != null && durationHours > paidHours + 0.01
              ? ` · exceeds paid ${formatDuration(paidHours)} — staff approval required`
              : paidHours != null
                ? ` · paid for ${formatDuration(paidHours)}`
                : ' · no past times'}
          </p>
          {!paidReschedule && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="uber-label block mb-1">Guards</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(caps.maxGuardsPerRequest, request.guardsNeeded ?? 1)}
                    value={guardsNeeded}
                    onChange={(e) =>
                      setGuardsNeeded(
                        clampClientGuardsNeeded(
                          parseInt(e.target.value, 10) || 1,
                          caps.clientType,
                          request.guardsNeeded ?? 1
                        )
                      )
                    }
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
