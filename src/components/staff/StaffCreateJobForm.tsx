import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Client, JobType, SecurityGuard, SecurityRequest } from '../../types';
import { getClientRehireableGuards, guardHasWorkedWithClient } from '../../lib/guardDirectory';
import { getClientAccountStatus } from '../../lib/accountStatus';
import {
  CLIENT_SERVICE_OPTIONS,
  ClientServiceId,
  serviceDefaultTitle,
  serviceToJobType,
} from '../../lib/clientRequestFlow';
import {
  computeDurationHours,
  formatDuration,
  getDefaultShiftEnd,
  getDefaultShiftStart,
} from '../../lib/dates';
import { minScheduleDatetimeLocal, validateShiftSchedule } from '../../lib/jobEditRules';
import { computeGuardPay, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { US_STATES } from '../../lib/states';
import { EMPTY_LISTING_FIELDS, JobListingFields } from '../../lib/jobListing';
import { JobLocationPinPicker } from '../jobs/JobLocationPinPicker';
import { JobPostOrdersFields } from '../jobs/JobPostOrdersFields';
import { JobOperationalDetailsFields } from '../jobs/JobOperationalDetailsFields';
import { EMPTY_JOB_OPERATIONAL_DETAILS, normalizeJobOperationalDetails } from '../../lib/jobOperationalDetails';
import { JobOperationalDetails } from '../../types';

export interface StaffCreateJobInput {
  clientId: string;
  title: string;
  address: string;
  state: string;
  siteName: string;
  type: JobType;
  startDate: string;
  endDate: string;
  durationHours: number;
  hourlyRate: number;
  guardPay: number;
  guardsNeeded: number;
  estimatedPayout: number;
  assignGuardId?: string;
  description?: string;
  uniformRequirements?: string;
  equipmentRequirements?: string;
  siteInstructions?: string;
  contactName?: string;
  contactPhone?: string;
  parkingInstructions?: string;
  accessInstructions?: string;
  latitude?: number;
  longitude?: number;
  operationalDetails?: JobOperationalDetails;
}

interface StaffCreateJobFormProps {
  clients: Client[];
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  onCreate: (input: StaffCreateJobInput) => Promise<string | void>;
  onCreated?: (jobId: string) => void;
}

export function StaffCreateJobForm({ clients, guards, requests, onCreate, onCreated }: StaffCreateJobFormProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState<ClientServiceId>('standing-guard');
  const [customTitle, setCustomTitle] = useState('');
  const [address, setAddress] = useState('');
  const [jobState, setJobState] = useState('CA');
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState(() => getDefaultShiftStart());
  const [endDate, setEndDate] = useState(() => getDefaultShiftEnd(getDefaultShiftStart(), 8));
  const [hourlyRate, setHourlyRate] = useState(30);
  const [guardsNeeded, setGuardsNeeded] = useState(1);
  const [assignGuardId, setAssignGuardId] = useState('');
  const [listing, setListing] = useState<JobListingFields>(() => ({ ...EMPTY_LISTING_FIELDS }));
  const [operational, setOperational] = useState<JobOperationalDetails>(EMPTY_JOB_OPERATIONAL_DETAILS);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const approvedClients = useMemo(
    () => [...clients].filter((c) => getClientAccountStatus(c) === 'active').sort((a, b) => a.companyName.localeCompare(b.companyName)),
    [clients]
  );

  const rehireableGuards = useMemo(
    () => (clientId ? getClientRehireableGuards(clientId, requests, guards) : []),
    [clientId, requests, guards]
  );

  const title =
    serviceId === 'custom' && customTitle.trim()
      ? customTitle.trim()
      : serviceDefaultTitle(serviceId);
  const durationHours = computeDurationHours(startDate, endDate);
  const guardPay = computeGuardPay(hourlyRate);
  const estimatedPayout = Math.round(durationHours * hourlyRate * guardsNeeded * 100) / 100;
  const scheduleError = validateShiftSchedule(startDate, endDate);

  const reset = () => {
    setClientId('');
    setServiceId('standing-guard');
    setCustomTitle('');
    setAddress('');
    setJobState('CA');
    setSiteName('');
    setStartDate(getDefaultShiftStart());
    setEndDate(getDefaultShiftEnd(getDefaultShiftStart(), 8));
    setHourlyRate(30);
    setGuardsNeeded(1);
    setAssignGuardId('');
    setListing({ ...EMPTY_LISTING_FIELDS });
    setOperational(EMPTY_JOB_OPERATIONAL_DETAILS);
    setLatitude(undefined);
    setLongitude(undefined);
    setError('');
    setMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!clientId) {
      setError('Select a client for this job.');
      return;
    }
    if (address.trim().length < 4) {
      setError('Enter a valid job address.');
      return;
    }
    if (scheduleError) {
      setError(scheduleError);
      return;
    }
    if (assignGuardId && !guardHasWorkedWithClient(assignGuardId, clientId, requests)) {
      setError('That guard has not worked with this client before. Leave the job open for applications.');
      return;
    }
    setSaving(true);
    try {
      const jobId = await onCreate({
        clientId,
        title,
        address: address.trim(),
        state: jobState.toUpperCase(),
        siteName: siteName.trim() || title,
        type: serviceToJobType(serviceId),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        durationHours,
        hourlyRate,
        guardPay,
        guardsNeeded,
        estimatedPayout,
        assignGuardId: assignGuardId || undefined,
        description: listing.description.trim() || undefined,
        uniformRequirements: listing.uniformRequirements.trim() || undefined,
        equipmentRequirements: listing.equipmentRequirements.trim() || undefined,
        siteInstructions: listing.siteInstructions.trim() || undefined,
        contactName: listing.contactName.trim() || undefined,
        contactPhone: listing.contactPhone.trim() || undefined,
        parkingInstructions: listing.parkingInstructions.trim() || undefined,
        accessInstructions: listing.accessInstructions.trim() || undefined,
        latitude,
        longitude,
        operationalDetails: normalizeJobOperationalDetails(operational),
      });
      const clientLabel = approvedClients.find((c) => c.id === clientId)?.companyName || 'Client';
      setMsg(
        assignGuardId
          ? `Job created for ${clientLabel} with prior guard rehired.`
          : `Job posted for ${clientLabel} — open for guard applications (Guardr approves best fit).`
      );
      reset();
      if (jobId) onCreated?.(jobId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create job.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-button-primary app-btn-sm inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create job for client
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="staff-onboard-form border border-brand-border rounded-xl p-4 space-y-4 bg-brand-bg-sec/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Create job for client</h3>
          <p className="text-xs text-brand-text-muted mt-1">
            Post a job on behalf of a client. Rehire a guard the client has worked with before to skip Guardr applicant review — otherwise leave open for guards to apply (Guardr approves the best fit).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
            setMsg('');
          }}
          className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20"
          aria-label="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="uber-label block mb-1">Client</label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setAssignGuardId('');
            }}
            className="uber-input w-full"
            required
          >
            <option value="">Select client…</option>
            {approvedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="uber-label block mb-1">Service type</label>
          <select
            value={serviceId}
            onChange={(e) => {
              const id = e.target.value as ClientServiceId;
              setServiceId(id);
            }}
            className="uber-input w-full"
          >
            {CLIENT_SERVICE_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        </div>

        {serviceId === 'custom' && (
          <div>
            <label className="uber-label block mb-1">Custom title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="uber-input w-full"
              placeholder="Job title"
            />
          </div>
        )}

        <div>
          <label className="uber-label block mb-1">Site name</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="uber-input w-full"
            placeholder="Optional"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="uber-label block mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="uber-input w-full"
            placeholder="123 Main St, City"
            required
          />
        </div>

        <div>
          <label className="uber-label block mb-1">State</label>
          <select
            value={jobState}
            onChange={(e) => setJobState(e.target.value)}
            className="uber-input w-full"
          >
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="uber-label block mb-1">Guards needed</label>
          <input
            type="number"
            min={1}
            max={20}
            value={guardsNeeded}
            onChange={(e) => setGuardsNeeded(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="uber-input w-full"
          />
        </div>

        <div>
          <label className="uber-label block mb-1">Start</label>
          <input
            type="datetime-local"
            value={startDate}
            min={minScheduleDatetimeLocal()}
            onChange={(e) => {
              setStartDate(e.target.value);
              setEndDate(getDefaultShiftEnd(e.target.value, 8));
            }}
            className="uber-input w-full"
            required
          />
        </div>

        <div>
          <label className="uber-label block mb-1">End</label>
          <input
            type="datetime-local"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="uber-input w-full"
            required
          />
        </div>

        <div>
          <label className="uber-label block mb-1">Hourly rate ($)</label>
          <input
            type="number"
            min={20}
            step={1}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Math.max(20, parseInt(e.target.value, 10) || 30))}
            className="uber-input w-full"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="uber-label block mb-1">Rehire guard (optional)</label>
          <select
            value={assignGuardId}
            onChange={(e) => setAssignGuardId(e.target.value)}
            className="uber-input w-full"
            disabled={!clientId}
          >
            <option value="">
              {!clientId
                ? 'Select a client first'
                : 'Leave open — guards apply, Guardr approves best fit'}
            </option>
            {rehireableGuards.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {clientId && rehireableGuards.length === 0 && (
            <p className="text-xs text-brand-text-muted mt-1.5">
              This client has no prior jobs with guards on Guardr yet. New offers stay open for applications.
            </p>
          )}
          {clientId && rehireableGuards.length > 0 && (
            <p className="text-xs text-brand-text-muted mt-1.5">
              Only guards this client has worked with before. Rehire skips Guardr applicant review.
            </p>
          )}
        </div>

        {address.trim().length > 3 && (
          <div className="sm:col-span-2">
            <JobLocationPinPicker
              address={address}
              state={jobState}
              siteName={siteName}
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
          </div>
        )}

        <div className="sm:col-span-2 border-t border-brand-border pt-4">
          <JobPostOrdersFields value={listing} onChange={setListing} serviceId={serviceId} />
          <JobOperationalDetailsFields value={operational} onChange={setOperational} />
        </div>
      </div>

      <p className="text-xs text-brand-text-muted">
        {title} · {formatDuration(durationHours)} · ${estimatedPayout.toFixed(2)} client bill · platform fee $
        {PLATFORM_FEE_PER_HOUR}/hr
        {scheduleError ? ` · ${scheduleError}` : ''}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {msg && <p className="text-sm text-brand-primary">{msg}</p>}

      <div className="app-action-row--equal">
        <button type="submit" disabled={saving || !!scheduleError} className="app-button-primary app-btn-md">
          {saving ? 'Creating…' : assignGuardId ? 'Create & rehire guard' : 'Create open job'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="app-button-outline app-btn-md"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
