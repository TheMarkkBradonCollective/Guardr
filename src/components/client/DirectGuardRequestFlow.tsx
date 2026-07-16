import { showAppToast } from '../ui/AppToast';
import React, { useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  CLIENT_SERVICE_OPTIONS,
  ClientServiceId,
  defaultDirectGuardJobTitle,
  resolveJobTitle,
  serviceDefaultTitle,
  serviceToJobType,
} from '../../lib/clientRequestFlow';
import { clientServiceGroups } from '../../lib/clientServiceGroups';
import { computeDurationHours, formatDuration, getDefaultShiftEnd, getDefaultShiftStart, toDatetimeLocal } from '../../lib/dates';
import { minScheduleDatetimeLocal, validateShiftSchedule } from '../../lib/jobEditRules';
import { computePlatformFee, computeJobBilling, type PlatformFeeConfig } from '../../lib/payments';
import type { AgreementPlatformFeeConfig, PricingMode } from '../../types';
import { getGuardDisplayHeadline } from '../../lib/guardResume';
import { DEFAULT_CALIFORNIA_CITY, cityFromGeocode, formatCityLabel, isCaliforniaCity, resolveJobCity } from '../../lib/californiaCities';
import { getSelectableCityNamesForClients } from '../../lib/platformCities';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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

type FlowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STEP_LABELS = ['Service', 'Location', 'Schedule', 'Rate', 'Requirements', 'Post orders', 'Site briefing', 'Review'];

interface DirectGuardRequestFlowProps {
  guard: SecurityGuard;
  feeConfig: PlatformFeeConfig;
  onBack: () => void;
  onSubmit: (req: Partial<SecurityRequest>) => void;
}

/**
 * Separate from marketplace RequestSecurityFlow — client found this guard via profiles
 * and is sending an assignment request directly to them.
 */
export function DirectGuardRequestFlow({
  guard,
  feeConfig,
  onBack,
  onSubmit,
}: DirectGuardRequestFlowProps) {
  const selectableClientCities = getSelectableCityNamesForClients();
  const defaultStart = useMemo(() => getDefaultShiftStart(), []);
  const [step, setStep] = useState<FlowStep>(1);
  const [serviceId, setServiceId] = useState<ClientServiceId>('standing-guard');
  const [jobTitle, setJobTitle] = useState(() => defaultDirectGuardJobTitle('standing-guard', guard.name));
  const [jobTitleTouched, setJobTitleTouched] = useState(false);
  const [address, setAddress] = useState('');
  const [jobState, setJobState] = useState<string>(DEFAULT_CALIFORNIA_CITY);
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(() => getDefaultShiftEnd(defaultStart, 8));
  const [hourlyRate, setHourlyRate] = useState(30);
  const [customRate, setCustomRate] = useState('');
  const [pricingMode, setPricingMode] = useState<PricingMode>('standard');
  const [agreementFeeConfig, setAgreementFeeConfig] = useState<AgreementPlatformFeeConfig | undefined>();
  const [openingMessage, setOpeningMessage] = useState('');
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
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [minGuardQualification, setMinGuardQualification] = useState<MinGuardQualification>('pending');

  const effectiveRate = customRate ? Math.max(20, parseInt(customRate, 10) || 30) : hourlyRate;
  const durationHours = computeDurationHours(startDate, endDate);
  const billing = computeJobBilling(
    effectiveRate,
    durationHours,
    1,
    feeConfig,
    pricingMode === 'open_contract' ? agreementFeeConfig : undefined
  );
  const platformFeePerHour = billing.platformFeePerHour;
  const guardPay = billing.guardPay;
  const platformFeeTotal = computePlatformFee(durationHours, platformFeePerHour);
  const estimatedTotal = billing.estimatedPayout;
  const effectiveBreakMinutes = customBreakMinutes
    ? Math.max(0, parseInt(customBreakMinutes, 10) || 0)
    : breakMinutes;
  const selectedService = CLIENT_SERVICE_OPTIONS.find((s) => s.id === serviceId)!;
  const title = resolveJobTitle(jobTitle, serviceId);

  const selectService = (id: ClientServiceId) => {
    setServiceId(id);
    if (!jobTitleTouched) {
      setJobTitle(defaultDirectGuardJobTitle(id, guard.name));
    }
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!serviceId && jobTitle.trim().length > 0;
      case 2: return address.trim().length > 3 && isCaliforniaCity(jobState);
      case 3: return !validateShiftSchedule(startDate, endDate) && durationHours > 0;
      case 4: return effectiveRate >= 20;
      case 5: return true;
      case 6:
        return (
          listing.description.trim().length > 10 &&
          listing.uniformRequirements.trim().length > 3 &&
          listing.siteInstructions.trim().length > 3
        );
      case 7:
        return true;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canNext() || step >= 8) return;
    if (step === 2) resolveCoordsForSubmit();
    setStep((s) => (s + 1) as FlowStep);
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
      requestType: 'direct',
      targetGuardId: guard.id,
      title,
      siteName: siteName || title,
      address,
      state: formatCityLabel(jobState),
      location: siteName ? `${siteName} — ${address}` : address,
      type: serviceToJobType(serviceId),
      guardsNeeded: 1,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
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
  };

  return (
    <div className="h-full flex flex-col client-content-shell client-form-shell animate-fade-in">
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
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-brand-surface" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm text-brand-text-muted">
              Step {step} of 8 · {STEP_LABELS[step - 1]}
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
            <div className="space-y-4">
              {clientServiceGroups().map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">{group.label}</p>
                  <div className="grid gap-2">
                    {group.options.filter((opt) => opt.id !== 'custom').map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectService(opt.id)}
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
              ))}
            </div>
            <div>
              <label className="uber-label block mb-1">Job name</label>
              <input
                type="text"
                placeholder={defaultDirectGuardJobTitle(serviceId, guard.name)}
                value={jobTitle}
                onChange={(e) => {
                  setJobTitleTouched(true);
                  setJobTitle(e.target.value);
                }}
                className="uber-input w-full"
              />
              <p className="text-xs text-brand-text-muted mt-1.5">
                How this assignment appears to {guard.name.split(' ')[0]}.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Where?</h2>
            <div>
              <label className="uber-label block mb-1">Address</label>
              <input
                type="text"
                placeholder="Street address, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="uber-input w-full"
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
              <label className="uber-label block mb-1">City</label>
              <select value={jobState} onChange={(e) => setJobState(resolveJobCity(e.target.value))} className="uber-select w-full" required>
                {selectableClientCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="uber-label block mb-1">Site name (optional)</label>
              <input type="text" placeholder="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="uber-input w-full" />
            </div>
            <JobLocationCoordsFields
              ref={coordsFieldsRef}
              latitude={latitude}
              longitude={longitude}
              onCoordsChange={onCoordsChange}
            />
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
              <h3 className="text-lg font-bold">Scheduled breaks</h3>
              <p className="text-sm text-brand-text-muted mt-1">
                Break minutes for this shift. Staff are notified when breaks start and end.
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
                  className={`segmented-control-btn flex-1 py-2 text-sm ${
                    breakMinutes === minutes && !customBreakMinutes ? 'segmented-control-btn-active' : ''
                  }`}
                >
                  {minutes === 0 ? 'None' : `${minutes}m`}
                </button>
              ))}
            </div>
            <JobBreakPaidToggle
              breakMinutes={effectiveBreakMinutes}
              breakPaid={breakPaid}
              onBreakPaidChange={setBreakPaid}
            />
          </div>
        )}

        {step === 4 && (
          <OpenContractRateStep
            feeConfig={feeConfig}
            durationHours={durationHours}
            guardsNeeded={1}
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
            <h2 className="text-xl font-bold">Assignment details for {guard.name.split(' ')[0]}</h2>
            <p className="text-sm text-brand-text-muted">
              Professional post orders — dress code, equipment, access, and on-site instructions.
            </p>
            <JobPostOrdersFields value={listing} onChange={setListing} serviceId={serviceId} />
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Site briefing</h2>
            <JobOperationalDetailsFields value={operational} onChange={setOperational} />
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Review & send</h2>
            <JobListingPreview
              job={{
                title,
                description: listing.description,
                clientName: 'Your company',
                clientLogo: 'YOU',
                siteName: siteName || title,
                address,
                state: formatCityLabel(jobState),
                location: siteName ? `${siteName} — ${address}` : address,
                type: serviceToJobType(serviceId),
                armedRequired: requiredCerts.includes('bsis-exposed-firearm'),
                guardsNeeded: 1,
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
                requestType: 'direct',
                status: 'draft',
                breakMinutes: effectiveBreakMinutes,
                breakPaid,
                operationalDetails: normalizeJobOperationalDetails(operational),
              }}
            />
            <div className="border-t border-brand-border pt-3">
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

      <div className="shrink-0 p-4 border-t border-brand-border bg-brand-bg/95">
        {step < 8 ? (
          <button type="button" onClick={goNext} disabled={!canNext()} className="app-button-primary gap-2 disabled:opacity-40">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <SlideToConfirm
            label={`Slide to send request to ${guard.name.split(' ')[0]}`}
            confirmedLabel="Sent"
            onConfirm={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

