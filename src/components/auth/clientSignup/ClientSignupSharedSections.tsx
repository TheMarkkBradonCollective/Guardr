import React from 'react';
import { ChevronDown, Globe, MapPin, Phone, Users } from 'lucide-react';
import { clientApplicationIntake } from '../../../lib/clientApplicationIntake';
import {
  ENGAGEMENT_TYPE_OPTIONS,
  HOW_HEARD_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  SECURITY_COMPANY_SERVICE_TYPE_OPTIONS,
} from '../../../lib/clientSignupOptions';
import type { ClientSignupIntakeProps } from './types';

export function ClientSignupIntakeHeader({ clientKind }: Pick<ClientSignupIntakeProps, 'clientKind'>) {
  const intake = clientApplicationIntake(clientKind);
  return (
    <>
      <p className="uber-label">{intake.headline}</p>
      <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">{intake.subhead}</p>
    </>
  );
}

export function ClientSignupContactPhone(props: Pick<ClientSignupIntakeProps, 'clientKind' | 'phone' | 'onPhoneChange'>) {
  return (
    <div>
      <label className="uber-label block mb-2">
        {props.clientKind === 'personal' ? 'Phone' : 'Contact phone'}{' '}
        <span className="font-normal">(optional)</span>
      </label>
      <div className="relative">
        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
        <input
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={props.phone}
          onChange={(e) => props.onPhoneChange(e.target.value)}
          className="uber-input pl-10"
        />
      </div>
    </div>
  );
}

export function ClientSignupCoverageNeeds(props: ClientSignupIntakeProps) {
  const serviceOptions =
    props.clientKind === 'security-company'
      ? SECURITY_COMPANY_SERVICE_TYPE_OPTIONS
      : SERVICE_TYPE_OPTIONS;
  const descriptionPlaceholder =
    props.clientKind === 'security-company'
      ? 'Describe your patrol routes, client types, and how you plan to use Guardr (roster + overflow)…'
      : props.clientKind === 'business'
        ? 'Describe the coverage your organization needs across sites or events…'
        : 'Briefly describe the security coverage you need…';

  return (
    <>
      <p className="uber-label pt-2 border-t border-brand-border">
        {props.clientKind === 'security-company' ? 'Operations & overflow' : 'Security needs'}
      </p>
      <div>
        <label className="uber-label block mb-2">
          {props.clientKind === 'security-company' ? 'How will you use Guardr?' : "Tell us what you're looking for"}{' '}
          <span className="font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder={descriptionPlaceholder}
          value={props.serviceDescription}
          onChange={(e) => props.onServiceDescriptionChange(e.target.value)}
          className="uber-input resize-none"
        />
      </div>
      <div>
        <label className="uber-label block mb-2">
          {props.clientKind === 'security-company' ? 'Services you provide' : 'Type of service needed'}{' '}
          <span className="font-normal">(optional — select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          {serviceOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                props.onServiceTypesChange(
                  props.serviceTypes.includes(opt)
                    ? props.serviceTypes.filter((x) => x !== opt)
                    : [...props.serviceTypes, opt]
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                props.serviceTypes.includes(opt)
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="uber-label block mb-2">
            {props.clientKind === 'security-company' ? 'Typical guards per post' : 'Guards needed'}{' '}
            <span className="font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
            <input
              type="number"
              min="1"
              placeholder="1"
              value={props.estimatedGuardsNeeded}
              onChange={(e) => props.onEstimatedGuardsNeededChange(e.target.value)}
              className="uber-input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="uber-label block mb-2">
            Armed preference <span className="font-normal">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={props.armedPreference}
              onChange={(e) => props.onArmedPreferenceChange(e.target.value)}
              className="uber-input appearance-none pr-8"
            >
              <option value="">No preference</option>
              <option value="armed">Armed</option>
              <option value="unarmed">Unarmed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
          </div>
        </div>
      </div>
      {props.clientKind !== 'security-company' ? (
        <div>
          <label className="uber-label block mb-2">
            Engagement type <span className="font-normal">(optional — select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ENGAGEMENT_TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  props.onServiceFrequenciesChange(
                    props.serviceFrequencies.includes(value)
                      ? props.serviceFrequencies.filter((x) => x !== value)
                      : [...props.serviceFrequencies, value]
                  )
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  props.serviceFrequencies.includes(value)
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <label className="uber-label block mb-2">
          Estimated start <span className="font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. July 2026, ASAP…"
          value={props.estimatedStartDate}
          onChange={(e) => props.onEstimatedStartDateChange(e.target.value)}
          className="uber-input"
        />
      </div>
      <div>
        <label className="uber-label block mb-2">
          {props.clientKind === 'personal' ? 'Payment estimate' : 'Billing estimate'}{' '}
          <span className="font-normal">(optional)</span>
        </label>
        <div className="relative">
          <select
            value={props.budgetRange}
            onChange={(e) => props.onBudgetRangeChange(e.target.value)}
            className="uber-input appearance-none pr-8"
          >
            <option value="">Prefer not to say</option>
            <option value="under-500">Under $500</option>
            <option value="500-2000">$500 – $2,000</option>
            <option value="2000-5000">$2,000 – $5,000</option>
            <option value="5000-15000">$5,000 – $15,000</option>
            <option value="15000+">$15,000+</option>
            <option value="ongoing">Ongoing / monthly contract</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
        </div>
        <p className="text-xs text-brand-text-muted mt-1.5">
          {props.clientKind === 'personal'
            ? 'Invoices are billed to you as an individual.'
            : props.clientKind === 'security-company'
              ? 'Overflow marketplace jobs bill to your security company.'
              : 'Invoices are billed to the business or organization.'}
        </p>
      </div>
    </>
  );
}

export function ClientSignupServiceArea(props: ClientSignupIntakeProps) {
  return (
    <>
      <p className="uber-label pt-2 border-t border-brand-border">
        {props.clientKind === 'personal'
          ? 'Address'
          : props.clientKind === 'security-company'
            ? 'Primary service market'
            : 'Business address'}
      </p>
      <div>
        <label className="uber-label block mb-2">City</label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
          <select
            value={props.serviceCity}
            onChange={(e) => props.onServiceCityChange(e.target.value)}
            className="uber-select pl-10"
          >
            {props.clientSignupCities.length === 0 ? (
              <option value="">No open markets right now</option>
            ) : (
              props.clientSignupCities.map((city) => (
                <option key={city} value={city}>
                  {city}, CA
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
        </div>
        {props.clientSignupCities.length === 0 ? (
          <p className="text-xs text-amber-400 mt-1.5">
            Guardr is not accepting new customer applications in any city right now. Check back when a market opens.
          </p>
        ) : null}
        {props.clientCityAccessMsg ? (
          <p className="text-xs text-amber-400 mt-1.5">{props.clientCityAccessMsg}</p>
        ) : null}
        <p className="text-xs text-brand-text-muted mt-1.5">
          Guardr operates in California only. All licensing follows CA BSIS rules.
        </p>
      </div>
      <div>
        <label className="uber-label block mb-2">
          {props.clientKind === 'business'
            ? 'Site(s)'
            : props.clientKind === 'security-company'
              ? 'Client site types'
              : 'Job site type'}{' '}
          <span className="font-normal">(optional — does not change who is billed)</span>
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                props.onPropertyTypesChange(
                  props.propertyTypes.includes(opt)
                    ? props.propertyTypes.filter((x) => x !== opt)
                    : [...props.propertyTypes, opt]
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                props.propertyTypes.includes(opt)
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function ClientSignupPriorExperience(
  props: Pick<
    ClientSignupIntakeProps,
    | 'hasPriorSecurityService'
    | 'priorSecurityProvider'
    | 'specialRequirements'
    | 'onHasPriorSecurityServiceChange'
    | 'onPriorSecurityProviderChange'
    | 'onSpecialRequirementsChange'
  >
) {
  return (
    <>
      <p className="uber-label pt-2 border-t border-brand-border">Prior security experience</p>
      <div>
        <label className="uber-label block mb-2">
          Have you used a security company before? <span className="font-normal">(optional)</span>
        </label>
        <div className="flex gap-3">
          {(['yes', 'no'] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() =>
                props.onHasPriorSecurityServiceChange(props.hasPriorSecurityService === val ? '' : val)
              }
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                props.hasPriorSecurityService === val
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
              }`}
            >
              {val === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>
      {props.hasPriorSecurityService === 'yes' ? (
        <div>
          <label className="uber-label block mb-2">
            Previous provider <span className="font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="Company name"
            value={props.priorSecurityProvider}
            onChange={(e) => props.onPriorSecurityProviderChange(e.target.value)}
            className="uber-input"
          />
        </div>
      ) : null}
      <div>
        <label className="uber-label block mb-2">
          Special requirements or compliance needs <span className="font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="Any licensing, regulatory, or site-specific requirements…"
          value={props.specialRequirements}
          onChange={(e) => props.onSpecialRequirementsChange(e.target.value)}
          className="uber-input resize-none"
        />
      </div>
    </>
  );
}

export function ClientSignupReferral(props: ClientSignupIntakeProps) {
  return (
    <>
      <p className="uber-label pt-2 border-t border-brand-border">How did you find us?</p>
      <div ref={props.referralRef} className="relative">
        <label className="uber-label block mb-2">
          Referred by a guard or staff member? <span className="font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="Search by name or type freehand…"
          value={props.referredByText}
          onChange={(e) => {
            props.onReferredByTextChange(e.target.value);
            props.onReferredByIdChange('');
            props.onReferralSuggestionsOpenChange(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (props.referredByText.trim().length > 0) props.onReferralSuggestionsOpenChange(true);
          }}
          onBlur={() => setTimeout(() => props.onReferralSuggestionsOpenChange(false), 150)}
          className="uber-input"
        />
        {props.referralSuggestionsOpen
          ? (() => {
              const query = props.referredByText.trim().toLowerCase();
              const suggestions = props.guardsList
                .filter((g) => g.name.toLowerCase().includes(query))
                .slice(0, 6)
                .map((g) => ({
                  id: g.id,
                  name: g.name,
                  role: g.isStaff ? ('staff' as const) : ('guard' as const),
                }));
              return suggestions.length > 0 ? (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-brand-border bg-brand-card shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => {
                        props.onReferredByTextChange(s.name);
                        props.onReferredByIdChange(s.id);
                        props.onReferralSuggestionsOpenChange(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-primary/10 flex items-center justify-between gap-2"
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-brand-text-muted capitalize">{s.role}</span>
                    </button>
                  ))}
                </div>
              ) : null;
            })()
          : null}
      </div>
      <div>
        <label className="uber-label block mb-2">
          How did you hear about us? <span className="font-normal">(optional)</span>
        </label>
        <div className="relative">
          <select
            value={props.howHeardAboutUs}
            onChange={(e) => props.onHowHeardAboutUsChange(e.target.value)}
            className="uber-input appearance-none pr-8"
          >
            <option value="">Select…</option>
            {HOW_HEARD_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
        </div>
      </div>
    </>
  );
}

export function ClientSignupWebsiteField(
  props: Pick<ClientSignupIntakeProps, 'website' | 'onWebsiteChange'> & { placeholder?: string }
) {
  return (
    <div>
      <label className="uber-label block mb-2">
        Website <span className="font-normal">(optional)</span>
      </label>
      <div className="relative">
        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
        <input
          type="url"
          placeholder={props.placeholder ?? 'https://yoursite.com'}
          value={props.website}
          onChange={(e) => props.onWebsiteChange(e.target.value)}
          className="uber-input pl-10"
        />
      </div>
    </div>
  );
}
