import React, { useMemo, useState } from 'react';
import { SecurityRequest } from '../../types';
import {
  CLIENT_SERVICE_OPTIONS,
  ClientServiceId,
  GUARD_COUNT_PRESETS,
  PAY_RATE_PRESETS,
  serviceDefaultTitle,
  serviceToJobType,
} from '../../lib/clientRequestFlow';
import { computeDurationHours, formatDuration, getDefaultShiftEnd, getDefaultShiftStart, toDatetimeLocal } from '../../lib/dates';
import { computeGuardPay, computePlatformFee, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { US_STATES, formatStateName } from '../../lib/states';
import { ArrowLeft, ArrowRight, Check, MapPin, Search } from 'lucide-react';
import { JobCertRequirementsPicker } from './JobCertRequirementsPicker';
import { requirementLabel } from '../../lib/certCatalog';
import { MinGuardQualification } from '../../types';
import { QUALIFICATION_LEVEL_LABELS } from '../../lib/guardQualification';

type FlowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RequestFlowPreset = 'default' | 'schedule' | 'recurring';

interface RequestSecurityFlowProps {
  preset?: RequestFlowPreset;
  onBack: () => void;
  onSubmit: (req: Partial<SecurityRequest>) => void;
}

const STEP_LABELS = ['Service', 'Location', 'Schedule', 'Guards', 'Rate', 'Requirements', 'Review'];

export function RequestSecurityFlow({
  preset = 'default',
  onBack,
  onSubmit,
}: RequestSecurityFlowProps) {
  const defaultStart = useMemo(() => {
    if (preset === 'schedule' || preset === 'recurring') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      return toDatetimeLocal(d);
    }
    return getDefaultShiftStart();
  }, [preset]);

  const [step, setStep] = useState<FlowStep>(1);
  const [serviceId, setServiceId] = useState<ClientServiceId>(
    preset === 'recurring' ? 'construction' : 'standing-guard'
  );
  const [address, setAddress] = useState('');
  const [jobState, setJobState] = useState('');
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(() => getDefaultShiftEnd(defaultStart, preset === 'recurring' ? 12 : 8));
  const [guardsNeeded, setGuardsNeeded] = useState(preset === 'recurring' ? 2 : 1);
  const [customGuards, setCustomGuards] = useState('');
  const [hourlyRate, setHourlyRate] = useState(30);
  const [customRate, setCustomRate] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [minGuardQualification, setMinGuardQualification] = useState<MinGuardQualification>('pending');

  const effectiveGuards = customGuards ? Math.max(1, parseInt(customGuards, 10) || 1) : guardsNeeded;
  const effectiveRate = customRate ? Math.max(20, parseInt(customRate, 10) || 30) : hourlyRate;
  const durationHours = computeDurationHours(startDate, endDate);
  const guardPay = computeGuardPay(effectiveRate);
  const platformFeeTotal = computePlatformFee(durationHours) * effectiveGuards;
  const estimatedTotal = Math.round(durationHours * effectiveRate * effectiveGuards * 100) / 100;

  const selectedService = CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)!;
  const title =
    serviceId === 'custom' && customTitle.trim()
      ? customTitle.trim()
      : serviceDefaultTitle(serviceId);

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!serviceId;
      case 2: return address.trim().length > 3 && jobState.length === 2;
      case 3: return durationHours > 0;
      case 4: return effectiveGuards >= 1;
      case 5: return effectiveRate >= 20;
      case 6: return true;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canNext()) return;
    if (step < 7) setStep((s) => (s + 1) as FlowStep);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as FlowStep);
    else onBack();
  };

  const handleSubmit = () => {
    onSubmit({
      requestType: 'marketplace',
      title,
      siteName: siteName || title,
      address,
      state: jobState.toUpperCase(),
      location: siteName ? `${siteName} — ${address}` : address,
      type: serviceToJobType(serviceId),
      guardsNeeded: effectiveGuards,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      durationHours,
      hourlyRate: effectiveRate,
      guardPay,
      estimatedPayout: estimatedTotal,
      description: `${selectedService.label} coverage at ${address}.`,
      siteInstructions: `${selectedService.label} post orders for ${siteName || address}.`,
      requiredCertifications: ['bsis-guard-card', ...requiredCerts.filter((id) => id !== 'bsis-guard-card')],
      armedRequired: requiredCerts.includes('bsis-exposed-firearm'),
      minGuardQualification,
    });
    onBack();
  };

  return (
    <div className="max-w-lg mx-auto h-full flex flex-col animate-fade-in client-content-shell">
      {/* Top bar — Uber-style */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <button type="button" onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-brand-surface transition-colors" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase text-brand-text-muted tracking-widest">
            Step {step} of 7 · {STEP_LABELS[step - 1]}
          </p>
          <div className="flex gap-1 mt-2">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-brand-primary' : 'bg-brand-border'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="guard-scroll-panel flex-1 pb-24">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">What do you need?</h2>
            <div className="grid grid-cols-1 gap-2">
              {CLIENT_SERVICE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setServiceId(opt.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    serviceId === opt.id
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-brand-border hover:border-brand-primary/40'
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <p className="font-black text-sm">{opt.label}</p>
                    <p className="text-xs text-brand-text-muted font-mono">{opt.description}</p>
                  </div>
                  {serviceId === opt.id && <Check className="w-5 h-5 text-brand-primary ml-auto" />}
                </button>
              ))}
            </div>
            {serviceId === 'custom' && (
              <input
                type="text"
                placeholder="Describe your request title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="uber-input mt-2"
              />
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">Where?</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Search address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="uber-input pl-10 h-14 text-base rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <label className="uber-label block mb-1.5">State</label>
              <select
                value={jobState}
                onChange={(e) => setJobState(e.target.value)}
                className="uber-select w-full rounded-xl"
                required
              >
                <option value="">Select state…</option>
                {US_STATES.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="uber-label block mb-1.5">Site name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Acme Construction — Building C"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="uber-input rounded-xl"
              />
            </div>
            {address && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-surface border border-brand-border text-sm">
                <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">When?</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="uber-label block mb-1.5">Start Date</label>
                <input type="date" value={startDate.slice(0, 10)} onChange={(e) => {
                  const time = startDate.slice(11) || '18:00';
                  setStartDate(`${e.target.value}T${time}`);
                }} className="uber-input rounded-xl" />
              </div>
              <div>
                <label className="uber-label block mb-1.5">Start Time</label>
                <input type="time" value={startDate.slice(11, 16)} onChange={(e) => {
                  setStartDate(`${startDate.slice(0, 10)}T${e.target.value}`);
                }} className="uber-input rounded-xl" />
              </div>
              <div>
                <label className="uber-label block mb-1.5">End Date</label>
                <input type="date" value={endDate.slice(0, 10)} onChange={(e) => {
                  const time = endDate.slice(11) || '06:00';
                  setEndDate(`${e.target.value}T${time}`);
                }} className="uber-input rounded-xl" />
              </div>
              <div>
                <label className="uber-label block mb-1.5">End Time</label>
                <input type="time" value={endDate.slice(11, 16)} onChange={(e) => {
                  setEndDate(`${endDate.slice(0, 10)}T${e.target.value}`);
                }} className="uber-input rounded-xl" />
              </div>
            </div>
            <div className={`rounded-xl p-4 border text-sm font-mono ${durationHours > 0 ? 'border-brand-primary/30 bg-brand-primary/5 text-brand-primary' : 'border-red-500/30 text-red-400'}`}>
              {durationHours > 0
                ? `Guardr calculated ${formatDuration(durationHours)} total coverage`
                : 'End must be after start'}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">How many guards?</h2>
            <div className="grid grid-cols-4 gap-2">
              {GUARD_COUNT_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setGuardsNeeded(n); setCustomGuards(''); }}
                  className={`h-16 rounded-xl font-black text-lg border transition-all ${
                    guardsNeeded === n && !customGuards
                      ? 'bg-brand-primary text-black border-brand-primary'
                      : 'border-brand-border hover:border-brand-primary/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div>
              <label className="uber-label block mb-1.5">Custom</label>
              <input
                type="number"
                min={1}
                placeholder="Enter count..."
                value={customGuards}
                onChange={(e) => setCustomGuards(e.target.value)}
                className="uber-input rounded-xl"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">Pay rate</h2>
            <p className="text-xs text-brand-text-muted font-mono">Client hourly rate per guard</p>
            <div className="grid grid-cols-3 gap-2">
              {PAY_RATE_PRESETS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => { setHourlyRate(rate); setCustomRate(''); }}
                  className={`h-16 rounded-xl font-black border transition-all ${
                    hourlyRate === rate && !customRate
                      ? 'bg-brand-primary text-black border-brand-primary'
                      : 'border-brand-border hover:border-brand-primary/50'
                  }`}
                >
                  ${rate}/hr
                </button>
              ))}
            </div>
            <div>
              <label className="uber-label block mb-1.5">Custom</label>
              <input
                type="number"
                min={20}
                placeholder="$/hr"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="uber-input rounded-xl"
              />
            </div>
            <p className="text-[11px] font-mono text-brand-text-muted">
              Guard receives ${guardPay}/hr · Platform fee ${PLATFORM_FEE_PER_HOUR}/hr per guard
            </p>
          </div>
        )}

        {step === 6 && (
          <JobCertRequirementsPicker
            selected={requiredCerts}
            onChange={setRequiredCerts}
            jobState={jobState}
            minGuardQualification={minGuardQualification}
            onMinQualificationChange={setMinGuardQualification}
          />
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">Review request</h2>
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Service</span>
                <span className="font-bold">{selectedService.emoji} {selectedService.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">State</span>
                <span className="font-bold">{formatStateName(jobState)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Location</span>
                <span className="font-bold text-right max-w-[60%]">{address}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Schedule</span>
                <span className="font-bold">{formatDuration(durationHours)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Guards needed</span>
                <span className="font-bold">{effectiveGuards}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Rate</span>
                <span className="font-bold">${effectiveRate}/hr</span>
              </div>
              <div className="flex justify-between text-sm border-t border-brand-border pt-3">
                <span className="text-brand-text-muted">Min qualification</span>
                <span className="font-bold text-right max-w-[60%]">{QUALIFICATION_LEVEL_LABELS[minGuardQualification]}</span>
              </div>
              <div className="text-sm">
                <span className="text-brand-text-muted">Additional credentials</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['bsis-guard-card', ...requiredCerts.filter((id) => id !== 'bsis-guard-card')].map((id) => (
                    <span key={id} className="chip chip-active text-xs">{requirementLabel(id)}</span>
                  ))}
                </div>
              </div>
              <div className="border-t border-brand-border pt-4 space-y-2">
                <div className="flex justify-between font-black">
                  <span>Estimated cost</span>
                  <span className="text-brand-primary">${estimatedTotal}</span>
                </div>
                <div className="flex justify-between text-xs font-mono text-brand-text-muted">
                  <span>Platform fee</span>
                  <span>${platformFeeTotal}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-bg/95 backdrop-blur border-t border-brand-border lg:static lg:p-0 lg:bg-transparent lg:border-0 lg:backdrop-blur-none">
        <div className="max-w-lg mx-auto">
          {step < 7 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext()}
              className="uber-button-sage w-full h-14 rounded-xl text-sm font-black uppercase tracking-wide gap-2 disabled:opacity-40"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="uber-button-sage w-full h-14 rounded-xl text-sm font-black uppercase tracking-wide"
            >
              Submit Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
