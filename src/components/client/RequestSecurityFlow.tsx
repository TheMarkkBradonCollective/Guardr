import React, { useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getBrowsableGuards } from '../../lib/guardDirectory';
import { getGuardDisplayHeadline } from '../../lib/guardResume';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { Heart } from 'lucide-react';
import {
  CLIENT_SERVICE_OPTIONS,
  ClientServiceId,
  GUARD_COUNT_PRESETS,
  PAY_RATE_PRESETS,
  resolveJobTitle,
  serviceDefaultTitle,
  serviceToJobType,
} from '../../lib/clientRequestFlow';
import { computeDurationHours, formatDuration, getDefaultShiftEnd, getDefaultShiftStart, toDatetimeLocal } from '../../lib/dates';
import { minScheduleDatetimeLocal, validateShiftSchedule } from '../../lib/jobEditRules';
import { computeGuardPay, computePlatformFee, resolvePlatformFeePerHour, type PlatformFeeConfig } from '../../lib/payments';
import { CALIFORNIA_CITIES, DEFAULT_CALIFORNIA_CITY, cityFromGeocode, formatCityLabel, isCaliforniaCity, resolveJobCity } from '../../lib/californiaCities';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { JobCertRequirementsPicker } from './JobCertRequirementsPicker';
import { MinGuardQualification } from '../../types';
import { JobBillingSummary } from '../jobs/JobBillingSummary';
import { JobLocationCoordsFields } from '../jobs/JobLocationCoordsFields';
import { UseCurrentLocationButton } from '../jobs/UseCurrentLocationButton';
import { JobPostOrdersFields } from '../jobs/JobPostOrdersFields';
import { JobListingPreview } from '../jobs/JobListingPreview';
import { EMPTY_LISTING_FIELDS, JobListingFields } from '../../lib/jobListing';
import { JobOperationalDetailsFields } from '../jobs/JobOperationalDetailsFields';
import { EMPTY_JOB_OPERATIONAL_DETAILS, normalizeJobOperationalDetails } from '../../lib/jobOperationalDetails';
import { JobOperationalDetails } from '../../types';
import { BREAK_MINUTE_PRESETS } from '../../lib/shiftBreaks';
import { JobBreakPaidToggle } from '../jobs/JobBreakPaidToggle';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { showAppToast } from '../ui/AppToast';

type FlowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type RequestFlowPreset = 'default' | 'schedule' | 'recurring';

interface RequestSecurityFlowProps {
  preset?: RequestFlowPreset;
  feeConfig: PlatformFeeConfig;
  onBack: () => void;
  onSubmit: (req: Partial<SecurityRequest>) => void;
  guards?: SecurityGuard[];
  favoriteGuardIds?: string[];
}

const STEP_LABELS = ['Service', 'Location', 'Schedule', 'Guards', 'Rate', 'Requirements', 'Post orders', 'Site briefing', 'Review'];

export function RequestSecurityFlow({
  preset = 'default',
  feeConfig,
  onBack,
  onSubmit,
  guards = [],
  favoriteGuardIds = [],
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
  const [jobState, setJobState] = useState(DEFAULT_CALIFORNIA_CITY);
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(() => getDefaultShiftEnd(defaultStart, preset === 'recurring' ? 12 : 8));
  const [guardsNeeded, setGuardsNeeded] = useState(preset === 'recurring' ? 2 : 1);
  const [customGuards, setCustomGuards] = useState('');
  const [hourlyRate, setHourlyRate] = useState(30);
  const [customRate, setCustomRate] = useState('');
  const [jobTitle, setJobTitle] = useState(() => serviceDefaultTitle(
    preset === 'recurring' ? 'construction' : 'standing-guard'
  ));
  const [jobTitleTouched, setJobTitleTouched] = useState(false);
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [minGuardQualification, setMinGuardQualification] = useState<MinGuardQualification>('pending');
  const [listing, setListing] = useState<JobListingFields>(() => ({ ...EMPTY_LISTING_FIELDS }));
  const [operational, setOperational] = useState<JobOperationalDetails>(EMPTY_JOB_OPERATIONAL_DETAILS);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [customBreakMinutes, setCustomBreakMinutes] = useState('');
  const [breakPaid, setBreakPaid] = useState(true);

  const [selectedFavoriteGuardId, setSelectedFavoriteGuardId] = useState<string | null>(null);

  // Active favourited guards available to pick from
  const favouriteGuards = useMemo(() => {
    if (favoriteGuardIds.length === 0) return [];
    const browseable = getBrowsableGuards(guards);
    return browseable.filter((g) => favoriteGuardIds.includes(g.id));
  }, [guards, favoriteGuardIds]);

  const effectiveGuards = customGuards ? Math.max(1, parseInt(customGuards, 10) || 1) : guardsNeeded;
  const effectiveRate = customRate ? Math.max(20, parseInt(customRate, 10) || 30) : hourlyRate;
  const durationHours = computeDurationHours(startDate, endDate);
  const platformFeePerHour = resolvePlatformFeePerHour(effectiveRate, feeConfig);
  const guardPay = computeGuardPay(effectiveRate, platformFeePerHour);
  const platformFeeTotal = computePlatformFee(durationHours, platformFeePerHour) * effectiveGuards;
  const estimatedTotal = Math.round(durationHours * effectiveRate * effectiveGuards * 100) / 100;
  const effectiveBreakMinutes = customBreakMinutes
    ? Math.max(0, parseInt(customBreakMinutes, 10) || 0)
    : breakMinutes;

  const selectedService = CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)!;
  const title = resolveJobTitle(jobTitle, serviceId);

  const selectService = (id: ClientServiceId) => {
    setServiceId(id);
    if (!jobTitleTouched) {
      setJobTitle(serviceDefaultTitle(id));
    }
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!serviceId && jobTitle.trim().length > 0;
      case 2: return address.trim().length > 3 && isCaliforniaCity(jobState);
      case 3: return !validateShiftSchedule(startDate, endDate) && durationHours > 0;
      case 4: return effectiveGuards >= 1;
      case 5: return effectiveRate >= 20;
      case 6: return true;
      case 7:
        return (
          listing.description.trim().length > 10 &&
          listing.uniformRequirements.trim().length > 3 &&
          listing.siteInstructions.trim().length > 3
        );
      case 8:
        return true;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canNext()) return;
    if (step < 9) setStep((s) => (s + 1) as FlowStep);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as FlowStep);
    else onBack();
  };

  const handleSubmit = () => {
    const scheduleError = validateShiftSchedule(startDate, endDate);
    if (scheduleError) {
      showAppToast(scheduleError, { tone: 'error' });
      return;
    }
    onSubmit({
      requestType: selectedFavoriteGuardId ? 'direct' : 'marketplace',
      targetGuardId: selectedFavoriteGuardId ?? undefined,
      title,
      siteName: siteName || title,
      address,
      state: formatCityLabel(jobState),
      location: siteName ? `${siteName} — ${address}` : address,
      type: serviceToJobType(serviceId),
      guardsNeeded: selectedFavoriteGuardId ? 1 : effectiveGuards,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      durationHours,
      hourlyRate: effectiveRate,
      guardPay,
      platformFeePerHour,
      estimatedPayout: estimatedTotal,
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
      requiredCertifications: ['bsis-guard-card', ...requiredCerts.filter((id) => id !== 'bsis-guard-card')],
      armedRequired: requiredCerts.includes('bsis-exposed-firearm'),
      minGuardQualification,
      operationalDetails: normalizeJobOperationalDetails(operational),
      breakMinutes: effectiveBreakMinutes,
      breakPaid,
    });
    onBack();
  };

  return (
    <div className="h-full flex flex-col animate-fade-in client-content-shell client-form-shell">
      <div className="flex items-center gap-3 mb-7 shrink-0 px-1">
        <button type="button" onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-bg-sec transition-colors shrink-0 -ml-1" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-muted mb-2">
            Step {step} of 9 &mdash; {STEP_LABELS[step - 1]}
          </p>
          {/* Single thick progress bar: Uber-style */}
          <div className="h-1.5 w-full rounded-full overflow-hidden bg-brand-border">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${(step / 9) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="guard-scroll-panel flex-1 pb-24">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">What do you need?</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {CLIENT_SERVICE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectService(opt.id)}
                  className={`wf-list-card transition-all ${
                    serviceId === opt.id ? '!border-brand-primary bg-brand-primary/8' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-bg-sec border border-brand-border flex items-center justify-center shrink-0 text-brand-primary">
                    <span className="text-lg leading-none">{opt.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[0.9375rem] tracking-tight">{opt.label}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{opt.description}</p>
                  </div>
                  {serviceId === opt.id && <Check className="w-5 h-5 text-brand-primary shrink-0" />}
                </button>
              ))}
            </div>
            <div>
              <label className="uber-label block mb-1.5">Job name</label>
              <input
                type="text"
                placeholder={serviceDefaultTitle(serviceId)}
                value={jobTitle}
                onChange={(e) => {
                  setJobTitleTouched(true);
                  setJobTitle(e.target.value);
                }}
                className="uber-input rounded-xl"
              />
              <p className="text-xs text-brand-text-muted mt-1.5">
                Shown to guards on your listing. You can customize it for any service type.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">Where?</h2>
            </div>
            <div>
              <label className="uber-label block mb-1.5">Address</label>
              <input
                type="text"
                placeholder="Street address, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="uber-input h-14 text-base rounded-xl"
                autoFocus
              />
            </div>
            <UseCurrentLocationButton
              onLocated={({ coords, addressLine, stateCode }) => {
                setLatitude(coords.lat);
                setLongitude(coords.lng);
                if (addressLine) setAddress(addressLine);
                setJobState(cityFromGeocode(addressLine, stateCode));
              }}
            />
            <div>
              <label className="uber-label block mb-1.5">City</label>
              <select
                value={jobState}
                onChange={(e) => setJobState(resolveJobCity(e.target.value))}
                className="uber-select w-full rounded-xl"
                required
              >
                {CALIFORNIA_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
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
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">When?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="uber-label block mb-1.5">Start Date</label>
                <input type="date" min={minScheduleDatetimeLocal().slice(0, 10)} value={startDate.slice(0, 10)} onChange={(e) => {
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
            <div className={`rounded-2xl p-4 border text-sm ${
              !validateShiftSchedule(startDate, endDate) && durationHours > 0
                ? 'border-brand-primary/30 bg-brand-primary/5 text-brand-primary'
                : 'border-red-500/30 text-red-400'
            }`}>
              {validateShiftSchedule(startDate, endDate) ??
                (durationHours <= 0
                  ? 'End must be after start'
                  : `Guardr calculated ${formatDuration(durationHours)} total coverage`)}
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Scheduled breaks</h3>
              <p className="text-brand-text-muted text-sm mt-1 font-medium">
                Break time guards can take during the shift. Staff are notified when breaks start and end.
              </p>
            </div>
            <div className="segmented-control segmented-control-full">
              {BREAK_MINUTE_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setBreakMinutes(minutes);
                    setCustomBreakMinutes('');
                  }}
                  className={`segmented-control-btn flex-1 py-3 text-sm ${
                    breakMinutes === minutes && !customBreakMinutes ? 'segmented-control-btn-active' : ''
                  }`}
                >
                  {minutes === 0 ? 'None' : `${minutes}m`}
                </button>
              ))}
            </div>
            <div>
              <label className="uber-label block mb-1.5">Custom break minutes</label>
              <input
                type="number"
                min={0}
                max={180}
                placeholder="Optional override"
                value={customBreakMinutes}
                onChange={(e) => setCustomBreakMinutes(e.target.value)}
                className="uber-input rounded-xl"
              />
            </div>
            <JobBreakPaidToggle
              breakMinutes={effectiveBreakMinutes}
              breakPaid={breakPaid}
              onBreakPaidChange={setBreakPaid}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">How many guards?</h2>
            </div>
            {/* Disable count picker when a favourite is selected (direct = 1 guard) */}
            {!selectedFavoriteGuardId && (
              <>
                <div className="segmented-control segmented-control-full">
                  {GUARD_COUNT_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setGuardsNeeded(n); setCustomGuards(''); }}
                      className={`segmented-control-btn flex-1 py-3 text-base ${
                        guardsNeeded === n && !customGuards ? 'segmented-control-btn-active' : ''
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
              </>
            )}

            {favouriteGuards.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <p className="uber-label">Request a favourite guard (optional)</p>
                </div>
                <p className="text-xs text-brand-text-muted -mt-1">
                  Selecting a guard sends the job directly to them instead of the marketplace.
                </p>
                <div className="space-y-2">
                  {favouriteGuards.map((g) => {
                    const isSelected = selectedFavoriteGuardId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedFavoriteGuardId(isSelected ? null : g.id)}
                        className={`wf-list-card w-full transition-all ${
                          isSelected ? '!border-brand-primary bg-brand-primary/8' : ''
                        }`}
                      >
                        <ProfileAvatar src={g.avatar} name={g.name} size="sm" rounded="lg" />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-bold text-sm leading-snug">{g.name}</p>
                          <p className="text-xs text-brand-text-muted mt-0.5 truncate">{getGuardDisplayHeadline(g)}</p>
                        </div>
                        {isSelected
                          ? <Check className="w-5 h-5 text-brand-primary shrink-0" />
                          : <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                        }
                      </button>
                    );
                  })}
                </div>
                {selectedFavoriteGuardId && (
                  <p className="text-xs text-brand-primary font-medium">
                    Job will be sent directly to {favouriteGuards.find((g) => g.id === selectedFavoriteGuardId)?.name} — 1 guard slot.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">Pay rate</h2>
            </div>
            <div className="segmented-control segmented-control-full">
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
            <p className="text-xs text-brand-text-muted">
              Guard receives ${guardPay}/hr · Platform fee ${platformFeePerHour}/hr per guard
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
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">Listing details</h2>
            </div>
            <JobPostOrdersFields value={listing} onChange={setListing} serviceId={serviceId} />
          </div>
        )}

        {step === 8 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">Site briefing</h2>
            </div>
            <JobOperationalDetailsFields value={operational} onChange={setOperational} />
          </div>
        )}

        {step === 9 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">Review & post</h2>
            </div>
            <JobListingPreview
              job={{
                title,
                description: listing.description.trim(),
                clientName: 'Your company',
                clientLogo: 'YOU',
                siteName: siteName || title,
                address,
                state: formatCityLabel(jobState),
                location: siteName ? `${siteName} — ${address}` : address,
                type: serviceToJobType(serviceId),
                armedRequired: requiredCerts.includes('bsis-exposed-firearm'),
                guardsNeeded: effectiveGuards,
                uniformRequirements: listing.uniformRequirements,
                equipmentRequirements: listing.equipmentRequirements,
                siteInstructions: listing.siteInstructions,
                contactName: listing.contactName,
                contactPhone: listing.contactPhone,
                parkingInstructions: listing.parkingInstructions,
                accessInstructions: listing.accessInstructions,
                latitude,
                longitude,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                durationHours,
                minGuardQualification,
                requiredCertifications: ['bsis-guard-card', ...requiredCerts.filter((id) => id !== 'bsis-guard-card')],
                requestType: 'marketplace',
                status: 'draft',
                breakMinutes: effectiveBreakMinutes,
                breakPaid,
                operationalDetails: normalizeJobOperationalDetails(operational),
              }}
            />
            <div className="border-t border-brand-border pt-4">
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
        )}
      </div>

      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 p-4 bg-brand-bg/95 backdrop-blur border-t border-brand-border lg:static lg:bottom-auto lg:p-0 lg:bg-transparent lg:border-0 lg:backdrop-blur-none">
        <div className="client-form-shell mx-auto">
          {step < 9 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext()}
              className="app-button-primary gap-2 disabled:opacity-40"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <SlideToConfirm
              label="Slide to post job offer"
              confirmedLabel="Posted"
              onConfirm={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
