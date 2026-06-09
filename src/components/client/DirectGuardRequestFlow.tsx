import React, { useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  CLIENT_SERVICE_OPTIONS,
  ClientServiceId,
  PAY_RATE_PRESETS,
  serviceDefaultTitle,
  serviceToJobType,
} from '../../lib/clientRequestFlow';
import { computeDurationHours, formatDuration, getDefaultShiftEnd, getDefaultShiftStart, toDatetimeLocal } from '../../lib/dates';
import { minScheduleDatetimeLocal, validateShiftSchedule } from '../../lib/jobEditRules';
import { computeGuardPay, computePlatformFee, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { getGuardDisplayHeadline } from '../../lib/guardResume';
import { US_STATES, formatStateName } from '../../lib/states';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { ArrowLeft, ArrowRight, MapPin, Search } from 'lucide-react';
import { JobCertRequirementsPicker } from './JobCertRequirementsPicker';
import { requirementLabel } from '../../lib/certCatalog';
import { MinGuardQualification } from '../../types';
import { GUARD_PATHWAY_STATUS_LABELS } from '../../lib/guardQualification';
import { JobBillingSummary } from '../jobs/JobBillingSummary';

type FlowStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS = ['Service', 'Location', 'Schedule', 'Rate', 'Requirements', 'Review'];

interface DirectGuardRequestFlowProps {
  guard: SecurityGuard;
  onBack: () => void;
  onSubmit: (req: Partial<SecurityRequest>) => void;
}

/**
 * Separate from marketplace RequestSecurityFlow — client found this guard via profiles
 * and is sending an assignment request directly to them.
 */
export function DirectGuardRequestFlow({
  guard,
  onBack,
  onSubmit,
}: DirectGuardRequestFlowProps) {
  const defaultStart = useMemo(() => getDefaultShiftStart(), []);
  const [step, setStep] = useState<FlowStep>(1);
  const [serviceId, setServiceId] = useState<ClientServiceId>('standing-guard');
  const [address, setAddress] = useState('');
  const [jobState, setJobState] = useState('');
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(() => getDefaultShiftEnd(defaultStart, 8));
  const [hourlyRate, setHourlyRate] = useState(30);
  const [customRate, setCustomRate] = useState('');
  const [notes, setNotes] = useState('');
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [minGuardQualification, setMinGuardQualification] = useState<MinGuardQualification>('pending');

  const effectiveRate = customRate ? Math.max(20, parseInt(customRate, 10) || 30) : hourlyRate;
  const durationHours = computeDurationHours(startDate, endDate);
  const guardPay = computeGuardPay(effectiveRate);
  const platformFeeTotal = computePlatformFee(durationHours);
  const estimatedTotal = Math.round(durationHours * effectiveRate * 100) / 100;
  const selectedService = CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)!;
  const title = serviceDefaultTitle(serviceId);

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!serviceId;
      case 2: return address.trim().length > 3 && jobState.length === 2;
      case 3: return !validateShiftSchedule(startDate, endDate) && durationHours > 0;
      case 4: return effectiveRate >= 20;
      case 5: return true;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canNext() || step >= 6) return;
    setStep((s) => (s + 1) as FlowStep);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as FlowStep);
    else onBack();
  };

  const handleSubmit = () => {
    const scheduleError = validateShiftSchedule(startDate, endDate);
    if (scheduleError) {
      alert(scheduleError);
      return;
    }
    onSubmit({
      requestType: 'direct',
      targetGuardId: guard.id,
      title: `${title} — ${guard.name}`,
      siteName: siteName || title,
      address,
      state: jobState.toUpperCase(),
      location: siteName ? `${siteName} — ${address}` : address,
      type: serviceToJobType(serviceId),
      guardsNeeded: 1,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      durationHours,
      hourlyRate: effectiveRate,
      guardPay,
      estimatedPayout: estimatedTotal,
      description: notes.trim() || `Direct assignment request for ${guard.name}. ${selectedService.label} at ${address}.`,
      siteInstructions: notes.trim() || `${selectedService.label} post orders for ${siteName || address}.`,
      requiredCertifications: ['bsis-guard-card', ...requiredCerts.filter((id) => id !== 'bsis-guard-card')],
      armedRequired: requiredCerts.includes('bsis-exposed-firearm'),
      minGuardQualification,
    });
  };

  return (
    <div className="h-full flex flex-col client-content-shell max-w-lg mx-auto animate-fade-in">
      <div className="shrink-0 px-4 pt-4 space-y-4">
        <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-2 border-brand-primary/30 bg-brand-primary/10">
          <p className="text-xs font-semibold text-brand-primary">Direct assignment request</p>
          <div className="flex items-center gap-3">
            <ProfileAvatar src={guard.avatar} name={guard.name} size="md" rounded="xl" />
            <div className="min-w-0">
              <p className="font-semibold">{guard.name}</p>
              <p className="text-sm text-brand-text-muted">{getGuardDisplayHeadline(guard)}</p>
            </div>
          </div>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            This is separate from a general marketplace post. Only {guard.name.split(' ')[0]} will see this request.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-brand-surface" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm text-brand-text-muted">
              Step {step} of 6 · {STEP_LABELS[step - 1]}
            </p>
            <div className="flex gap-1 mt-2">
              {STEP_LABELS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-brand-primary' : 'bg-brand-border'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="guard-scroll-panel flex-1 px-4 py-4 pb-28">
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">What do you need?</h2>
            <div className="grid gap-2">
              {CLIENT_SERVICE_OPTIONS.filter((o) => o.id !== 'custom').map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setServiceId(opt.id)}
                  className={`wf-list-card transition-all ${
                    serviceId === opt.id ? '!border-brand-primary bg-brand-primary/10' : ''
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-brand-text-muted">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Where?</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
              <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="uber-input pl-10 w-full" autoFocus />
            </div>
            <div>
              <label className="uber-label block mb-1">State</label>
              <select value={jobState} onChange={(e) => setJobState(e.target.value)} className="uber-select w-full" required>
                <option value="">State…</option>
                {US_STATES.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="uber-label block mb-1">Site name (optional)</label>
              <input type="text" placeholder="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="uber-input w-full" />
            </div>
            {address && (
              <div className="wf-list-card items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">When?</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="uber-label block mb-1">Start date</label>
                <input type="date" min={minScheduleDatetimeLocal().slice(0, 10)} value={startDate.slice(0, 10)} onChange={(e) => setStartDate(`${e.target.value}T${startDate.slice(11) || '18:00'}`)} className="uber-input" />
              </div>
              <div>
                <label className="uber-label block mb-1">Start time</label>
                <input type="time" value={startDate.slice(11, 16)} onChange={(e) => setStartDate(`${startDate.slice(0, 10)}T${e.target.value}`)} className="uber-input" />
              </div>
              <div>
                <label className="uber-label block mb-1">End date</label>
                <input type="date" value={endDate.slice(0, 10)} onChange={(e) => setEndDate(`${e.target.value}T${endDate.slice(11) || '06:00'}`)} className="uber-input" />
              </div>
              <div>
                <label className="uber-label block mb-1">End time</label>
                <input type="time" value={endDate.slice(11, 16)} onChange={(e) => setEndDate(`${endDate.slice(0, 10)}T${e.target.value}`)} className="uber-input" />
              </div>
            </div>
            <p className={`text-sm rounded-2xl p-3 border ${
              !validateShiftSchedule(startDate, endDate) && durationHours > 0
                ? 'border-brand-primary/30 text-brand-primary'
                : 'border-red-500/30 text-red-400'
            }`}>
              {validateShiftSchedule(startDate, endDate) ??
                (durationHours <= 0 ? 'End must be after start' : formatDuration(durationHours))}
            </p>
            <div>
              <label className="uber-label">Assignment notes for {guard.name.split(' ')[0]}</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="uber-input w-full mt-1 resize-none" placeholder="Site access, dress code, special instructions…" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pay rate</h2>
            <div className="segmented-control">
              {PAY_RATE_PRESETS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => { setHourlyRate(rate); setCustomRate(''); }}
                  className={`segmented-control-btn flex-1 py-3 ${
                    hourlyRate === rate && !customRate ? 'segmented-control-btn-active' : ''
                  }`}
                >
                  ${rate}/hr
                </button>
              ))}
            </div>
            <div>
              <label className="uber-label block mb-1">Custom</label>
              <input type="number" min={20} placeholder="Custom $/hr" value={customRate} onChange={(e) => setCustomRate(e.target.value)} className="uber-input w-full" />
            </div>
            <p className="text-xs text-brand-text-muted">Guard receives ${guardPay}/hr · Platform fee ${PLATFORM_FEE_PER_HOUR}/hr</p>
          </div>
        )}

        {step === 5 && (
          <JobCertRequirementsPicker
            selected={requiredCerts}
            onChange={setRequiredCerts}
            jobState={jobState}
            minGuardQualification={minGuardQualification}
            onMinQualificationChange={setMinGuardQualification}
          />
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Review & send</h2>
            <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-3 text-sm">
              <Row label="Guard" value={guard.name} />
              <Row label="Service" value={selectedService.label} />
              <Row label="State" value={formatStateName(jobState)} />
              <Row label="Location" value={address} />
              <Row label="Schedule" value={formatDuration(durationHours)} />
              <Row label="Rate" value={`$${effectiveRate}/hr`} />
              <Row label="Min guard status" value={GUARD_PATHWAY_STATUS_LABELS[minGuardQualification]} />
              <div className="w-full">
                <p className="text-brand-text-muted mb-1">Additional credentials</p>
                <div className="flex flex-wrap gap-1">
                  {['bsis-guard-card', ...requiredCerts.filter((id) => id !== 'bsis-guard-card')].map((id) => (
                    <span key={id} className="chip chip-active text-xs">{requirementLabel(id)}</span>
                  ))}
                </div>
              </div>
              <div className="border-t border-brand-border pt-3 w-full">
                <JobBillingSummary
                  variant="client"
                  hourlyRate={effectiveRate}
                  durationHours={durationHours}
                  estimatedPayout={estimatedTotal}
                  guardPay={guardPay}
                  platformFeeTotal={platformFeeTotal}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 border-t border-brand-border bg-brand-bg/95">
        {step < 6 ? (
          <button type="button" onClick={goNext} disabled={!canNext()} className="app-button-primary gap-2 disabled:opacity-40">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="app-button-primary">
            Send to {guard.name.split(' ')[0]}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 w-full">
      <span className="text-brand-text-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
