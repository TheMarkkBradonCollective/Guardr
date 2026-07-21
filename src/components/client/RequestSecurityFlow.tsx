import React, { useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getBrowsableGuards } from '../../lib/guardDirectory';
import { filterGuardsAvailableForJob } from '../../lib/guardAvailability';
import { getGuardDisplayHeadline } from '../../lib/guardResume';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { Heart } from 'lucide-react';
import {
  CLIENT_SERVICE_OPTIONS,
  ClientServiceId,
  GUARD_COUNT_PRESETS,
  resolveJobTitle,
  serviceDefaultTitle,
  serviceToJobType,
} from '../../lib/clientRequestFlow';
import { clientServiceGroups } from '../../lib/clientServiceGroups';
import { ASSIGNMENT_MODE_OPTIONS } from '../../lib/assignmentMode';
import { activeClientLocations } from '../../lib/clientLocations';
import type { AssignmentMode, ClientLocation, DifferentialPayRates } from '../../types';
import { computeDurationHours, formatDuration, getDefaultShiftEnd, getDefaultShiftStart, toDatetimeLocal } from '../../lib/dates';
import { minScheduleDatetimeLocal, validateShiftSchedule } from '../../lib/jobEditRules';
import { computePlatformFee, computeJobBilling, type PlatformFeeConfig } from '../../lib/payments';
import type { AgreementPlatformFeeConfig, PricingMode } from '../../types';
import { DEFAULT_CALIFORNIA_CITY, cityFromGeocode, formatCityLabel, isCaliforniaCity, resolveJobCity } from '../../lib/californiaCities';
import { getSelectableCityNamesForClients } from '../../lib/platformCities';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { JobCertRequirementsPicker } from './JobCertRequirementsPicker';
import { MinGuardQualification } from '../../types';
import { JobBillingSummary } from '../jobs/JobBillingSummary';
import { JobLocationCoordsFields } from '../jobs/JobLocationCoordsFields';
import { UseCurrentLocationButton } from '../jobs/UseCurrentLocationButton';
import { useJobLocationCoords } from '../jobs/useJobLocationCoords';
import { JobPostOrdersFields } from '../jobs/JobPostOrdersFields';
import { JobListingPreview } from '../jobs/JobListingPreview';
import { EMPTY_LISTING_FIELDS, JobListingFields } from '../../lib/jobListing';
import { JobOperationalDetailsFields } from '../jobs/JobOperationalDetailsFields';
import { EMPTY_JOB_OPERATIONAL_DETAILS, normalizeJobOperationalDetails } from '../../lib/jobOperationalDetails';
import { JobOperationalDetails } from '../../types';
import { BREAK_MINUTE_PRESETS } from '../../lib/shiftBreaks';
import { JobBreakPaidToggle } from '../jobs/JobBreakPaidToggle';
import { OpenContractRateStep } from '../jobs/OpenContractRateStep';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { showAppToast } from '../ui/AppToast';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';
import { useDevice } from '../../lib/platform';
import { GuardrButton } from '../baseui/GuardrButton';

type FlowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type RequestFlowPreset = 'default' | 'schedule' | 'recurring';

interface RequestSecurityFlowProps {
  preset?: RequestFlowPreset;
  feeConfig: PlatformFeeConfig;
  onBack: () => void;
  onSubmit: (req: Partial<SecurityRequest>) => void;
  guards?: SecurityGuard[];
  favoriteGuardIds?: string[];
  clientLocations?: ClientLocation[];
  clientId?: string;
  defaultAssignmentMode?: AssignmentMode;
}

const STEP_LABELS = ['Service', 'Location', 'Schedule', 'Guards', 'Rate', 'Requirements', 'Post orders', 'Site briefing', 'Review'];

export function RequestSecurityFlow({
  preset = 'default',
  feeConfig,
  onBack,
  onSubmit,
  guards = [],
  favoriteGuardIds = [],
  clientLocations = [],
  clientId,
  defaultAssignmentMode = 'client-approve',
}: RequestSecurityFlowProps) {
  const { formFactor } = useDevice();
  const selectableClientCities = getSelectableCityNamesForClients();
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
  const [serviceSkipped, setServiceSkipped] = useState(false);
  const [serviceId, setServiceId] = useState<ClientServiceId>(
    preset === 'recurring' ? 'construction' : 'standing-guard'
  );
  const [address, setAddress] = useState('');
  const [jobState, setJobState] = useState<string>(DEFAULT_CALIFORNIA_CITY);
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(() => getDefaultShiftEnd(defaultStart, preset === 'recurring' ? 12 : 8));
  const [scheduleType, setScheduleType] = useState<'one-time' | 'recurring'>(
    preset === 'recurring' ? 'recurring' : 'one-time'
  );
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [guardsNeeded, setGuardsNeeded] = useState(preset === 'recurring' ? 2 : 1);
  const [customGuards, setCustomGuards] = useState('');
  const [hourlyRate, setHourlyRate] = useState(30);
  const [customRate, setCustomRate] = useState('');
  const [useTierPay, setUseTierPay] = useState(false);
  const [tierPayRates, setTierPayRates] = useState<DifferentialPayRates>({});
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(defaultAssignmentMode);
  const [minYearsExperience, setMinYearsExperience] = useState(0);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [pricingMode, setPricingMode] = useState<PricingMode>('standard');
  const [agreementFeeConfig, setAgreementFeeConfig] = useState<AgreementPlatformFeeConfig | undefined>();
  const [openingMessage, setOpeningMessage] = useState('');
  const [jobTitle, setJobTitle] = useState(() => serviceDefaultTitle(
    preset === 'recurring' ? 'construction' : 'standing-guard'
  ));
  const [jobTitleTouched, setJobTitleTouched] = useState(false);
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [minGuardQualification, setMinGuardQualification] = useState<MinGuardQualification>('pending');
  const [listing, setListing] = useState<JobListingFields>(() => ({ ...EMPTY_LISTING_FIELDS }));
  const [operational, setOperational] = useState<JobOperationalDetails>(EMPTY_JOB_OPERATIONAL_DETAILS);
  const {
    latitude,
    longitude,
    coordsFieldsRef,
    onCoordsChange,
    applyLocatedCoords,
    resolveCoordsForSubmit,
  } = useJobLocationCoords();
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [customBreakMinutes, setCustomBreakMinutes] = useState('');
  const [breakPaid, setBreakPaid] = useState(true);

  const [selectedFavoriteGuardId, setSelectedFavoriteGuardId] = useState<string | null>(null);

  // Active favourited guards available to pick from
  const favouriteGuards = useMemo(() => {
    if (favoriteGuardIds.length === 0) return [];
    const browseable = getBrowsableGuards(guards);
    const favorited = browseable.filter((g) => favoriteGuardIds.includes(g.id));
    if (!startDate || !endDate || validateShiftSchedule(startDate, endDate)) {
      return favorited;
    }
    return filterGuardsAvailableForJob(favorited, {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  }, [guards, favoriteGuardIds, startDate, endDate]);

  const effectiveGuards = customGuards
    ? Math.min(50, Math.max(1, parseInt(customGuards, 10) || 1))
    : guardsNeeded;
  const effectiveRate = customRate ? Math.max(20, parseInt(customRate, 10) || 30) : hourlyRate;
  const durationHours = computeDurationHours(startDate, endDate);
  const billing = computeJobBilling(
    effectiveRate,
    durationHours,
    selectedFavoriteGuardId ? 1 : effectiveGuards,
    feeConfig,
    pricingMode === 'open_contract' ? agreementFeeConfig : undefined
  );
  const platformFeePerHour = billing.platformFeePerHour;
  const guardPay = billing.guardPay;
  const platformFeeTotal = computePlatformFee(durationHours, platformFeePerHour) * (selectedFavoriteGuardId ? 1 : effectiveGuards);
  const estimatedTotal = billing.estimatedPayout;
  const effectiveBreakMinutes = customBreakMinutes
    ? Math.max(0, parseInt(customBreakMinutes, 10) || 0)
    : breakMinutes;

  const selectedService = CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)!;
  const title = resolveJobTitle(jobTitle, serviceId);
  const savedLocations = clientId ? activeClientLocations(clientLocations, clientId) : [];
  const selectedLocation = savedLocations.find((l) => l.id === selectedLocationId);

  const selectService = (id: ClientServiceId) => {
    setServiceSkipped(false);
    setServiceId(id);
    if (!jobTitleTouched) {
      setJobTitle(serviceDefaultTitle(id));
    }
  };

  const skipServiceStep = () => {
    setServiceSkipped(true);
    setServiceId('custom');
    if (!jobTitleTouched) {
      setJobTitle(serviceDefaultTitle('custom'));
    }
    setStep(2);
  };

  const toggleRecurringDay = (day: number) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const RECURRING_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

  const canNext = (): boolean => {
    switch (step) {
      case 1: return serviceSkipped || (!!serviceId && jobTitle.trim().length > 0);
      case 2: return address.trim().length > 3 && isCaliforniaCity(jobState);
      case 3: return !validateShiftSchedule(startDate, endDate) && durationHours > 0;
      case 4: return effectiveGuards >= 1;
      case 5:
        return pricingMode === 'open_contract'
          ? effectiveRate >= 20
          : effectiveRate >= 20;
      case 6: return true;
      case 7:
        return true;
      case 8:
        return true;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canNext()) return;
    if (step === 2) resolveCoordsForSubmit();
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
    const { latitude: submitLatitude, longitude: submitLongitude } = resolveCoordsForSubmit();
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
      scheduleType,
      recurringEndDate:
        scheduleType === 'recurring' && recurringEndDate
          ? new Date(`${recurringEndDate}T23:59:59`).toISOString()
          : undefined,
      recurringDays: scheduleType === 'recurring' && recurringDays.length ? recurringDays : undefined,
      assignmentMode,
      minYearsExperience: minYearsExperience > 0 ? minYearsExperience : undefined,
      clientLocationId: selectedLocationId ?? undefined,
      locationRiskLevel: selectedLocation?.riskLevel,
      tierPayRates: useTierPay ? tierPayRates : undefined,
      durationHours,
      hourlyRate: effectiveRate,
      guardPay,
      platformFeePerHour,
      pricingMode,
      agreementFeeConfig: pricingMode === 'open_contract' ? agreementFeeConfig : undefined,
      openingPriceOffer:
        pricingMode === 'open_contract'
          ? {
              hourlyRate: effectiveRate,
              agreementFeeConfig,
              message: openingMessage.trim() || undefined,
            }
          : undefined,
      estimatedPayout: estimatedTotal,
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
    <ResponsivePage screenClassName="h-full min-h-0">
    <div className={`h-full flex flex-col animate-fade-in client-content-shell client-form-shell${formFactor === 'desktop' ? ' uber-form-wizard' : ''}`}>
      <div className="app-subscreen-header app-subscreen-header--wrap shrink-0">
        <button type="button" onClick={goBack} className="app-subscreen-back">
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {step === 1 ? 'Back to Home' : `Back to ${STEP_LABELS[step - 2]}`}
        </button>
        <div className="w-full min-w-0">
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
            <div className="space-y-5">
              {clientServiceGroups().map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">{group.label}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((opt) => (
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
                </div>
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
            <button
              type="button"
              onClick={skipServiceStep}
              className="w-full text-sm font-semibold text-brand-text-muted hover:text-brand-primary transition-colors py-2"
            >
              Skip for now — describe in listing details
            </button>
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
                applyLocatedCoords(coords);
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
                {selectableClientCities.map((city) => (
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
            {savedLocations.length > 0 && (
              <div>
                <label className="uber-label block mb-1.5">My Locations (optional)</label>
                <select
                  className="uber-select w-full rounded-xl"
                  value={selectedLocationId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setSelectedLocationId(id);
                    const loc = savedLocations.find((l) => l.id === id);
                    if (loc) {
                      setAddress(loc.address);
                      if (loc.state) setJobState(loc.state);
                      if (!siteName.trim()) setSiteName(loc.name);
                    }
                  }}
                >
                  <option value="">Enter a new address</option>
                  {savedLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.riskLevel} risk
                    </option>
                  ))}
                </select>
              </div>
            )}
            <JobLocationCoordsFields
              ref={coordsFieldsRef}
              latitude={latitude}
              longitude={longitude}
              onCoordsChange={onCoordsChange}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">When?</h2>
            </div>
            <div className="segmented-control segmented-control-full">
              <button
                type="button"
                onClick={() => setScheduleType('one-time')}
                className={`segmented-control-btn flex-1 py-3 text-sm ${
                  scheduleType === 'one-time' ? 'segmented-control-btn-active' : ''
                }`}
              >
                One-time shift
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('recurring')}
                className={`segmented-control-btn flex-1 py-3 text-sm ${
                  scheduleType === 'recurring' ? 'segmented-control-btn-active' : ''
                }`}
              >
                Recurring coverage
              </button>
            </div>
            {scheduleType === 'recurring' && (
              <div className="space-y-4 rounded-2xl border border-brand-border p-4">
                <div>
                  <label className="uber-label block mb-1.5">Repeat on (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {RECURRING_DAY_LABELS.map((label, day) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleRecurringDay(day)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                          recurringDays.includes(day)
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                            : 'border-brand-border text-brand-text-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="uber-label block mb-1.5">Series end date (optional)</label>
                  <input
                    type="date"
                    min={startDate.slice(0, 10)}
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                    className="uber-input rounded-xl"
                  />
                </div>
              </div>
            )}
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
              <p className="text-sm text-brand-text-muted mt-2 font-medium">
                Trusted guards with a standing crew of this size or larger get priority notification when the job goes live.
              </p>
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
                    max={50}
                    placeholder="Enter count (max 50)..."
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

            <div className="space-y-3 pt-2 border-t border-brand-border">
              <p className="uber-label">How should guards be placed?</p>
              <div className="grid grid-cols-1 gap-2">
                {ASSIGNMENT_MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAssignmentMode(opt.id)}
                    className={`wf-list-card text-left transition-all ${
                      assignmentMode === opt.id ? '!border-brand-primary bg-brand-primary/8' : ''
                    }`}
                  >
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <OpenContractRateStep
              feeConfig={feeConfig}
              durationHours={durationHours}
              guardsNeeded={selectedFavoriteGuardId ? 1 : effectiveGuards}
              pricingMode={pricingMode}
              onPricingModeChange={setPricingMode}
              hourlyRate={hourlyRate}
              onHourlyRateChange={setHourlyRate}
              customRate={customRate}
              onCustomRateChange={setCustomRate}
              agreementFeeConfig={agreementFeeConfig}
              onAgreementFeeConfigChange={setAgreementFeeConfig}
              openingMessage={openingMessage}
              onOpeningMessageChange={setOpeningMessage}
            />
            <div className="rounded-2xl border border-brand-border p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={useTierPay}
                  onChange={(e) => setUseTierPay(e.target.checked)}
                />
                Differential pay by armed status
              </label>
              {useTierPay && (
                <div className="grid grid-cols-1 gap-3">
                  {([
                    ['unarmed', 'Unarmed ($/hr)'],
                    ['lightArmed', 'Light armed ($/hr)'],
                    ['armed', 'Armed ($/hr)'],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <label className="uber-label block mb-1">{label}</label>
                      <input
                        type="number"
                        min={20}
                        className="uber-input rounded-xl"
                        value={tierPayRates[key] ?? ''}
                        onChange={(e) =>
                          setTierPayRates((prev) => ({
                            ...prev,
                            [key]: Math.max(20, parseInt(e.target.value, 10) || 20),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 6 && (
          <JobCertRequirementsPicker
            selected={requiredCerts}
            onChange={setRequiredCerts}
            jobState={jobState}
            minGuardQualification={minGuardQualification}
            onMinQualificationChange={setMinGuardQualification}
            minYearsExperience={minYearsExperience}
            onMinYearsExperienceChange={setMinYearsExperience}
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

      <div className={`fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 p-4 bg-brand-bg/95 backdrop-blur border-t border-brand-border lg:static lg:bottom-auto lg:p-0 lg:bg-transparent lg:border-0 lg:backdrop-blur-none${formFactor === 'desktop' ? ' uber-form-wizard-actions' : ''}`}>
        <div className="client-form-shell mx-auto">
          {formFactor === 'desktop' ? (
            step < 9 ? (
              <GuardrButton kind="primary" onClick={goNext} disabled={!canNext()}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </GuardrButton>
            ) : (
              <GuardrButton kind="primary" onClick={handleSubmit}>
                Post job offer
                <Check className="w-4 h-4" />
              </GuardrButton>
            )
          ) : step < 9 ? (
            <GuardrButton
              kind="primary"
              onClick={goNext}
              disabled={!canNext()}
              endEnhancer={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </GuardrButton>
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
    </ResponsivePage>
  );
}
