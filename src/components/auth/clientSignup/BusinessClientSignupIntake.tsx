import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { clientApplicationShowsSection } from '../../../lib/clientApplicationIntake';
import { BUSINESS_TYPE_OPTIONS, INDUSTRY_OPTIONS } from '../../../lib/clientSignupOptions';
import type { ClientSignupIntakeProps } from './types';
import {
  ClientSignupContactPhone,
  ClientSignupCoverageNeeds,
  ClientSignupPriorExperience,
  ClientSignupReferral,
  ClientSignupServiceArea,
} from './ClientSignupSharedSections';

export function BusinessClientSignupIntake(props: ClientSignupIntakeProps) {
  return (
    <>
      <div>
        <label className="uber-label block mb-2">Business name</label>
        <input
          type="text"
          required
          placeholder="ABC Nightclub"
          value={props.clientCompanyName}
          onChange={(e) => props.onClientCompanyNameChange(e.target.value)}
          className="uber-input"
        />
      </div>
      <ClientSignupContactPhone {...props} />
      <div>
        <label className="uber-label block mb-2">
          Business type <span className="font-normal">(optional)</span>
        </label>
        <div className="relative">
          <select
            value={props.businessType}
            onChange={(e) => props.onBusinessTypeChange(e.target.value)}
            className="uber-input appearance-none pr-8"
          >
            <option value="">Select…</option>
            {BUSINESS_TYPE_OPTIONS.filter((o) => o !== 'Individual').map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
        </div>
      </div>
      <div>
        <label className="uber-label block mb-2">
          Industry <span className="font-normal">(optional — select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          {INDUSTRY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                props.onIndustriesChange(
                  props.industries.includes(opt)
                    ? props.industries.filter((x) => x !== opt)
                    : [...props.industries, opt]
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                props.industries.includes(opt)
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
            Business license / EIN <span className="font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="12-3456789"
            value={props.businessLicense}
            onChange={(e) => props.onBusinessLicenseChange(e.target.value)}
            className="uber-input"
          />
        </div>
        <div>
          <label className="uber-label block mb-2">
            Website <span className="font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
            <input
              type="url"
              placeholder="https://yoursite.com"
              value={props.website}
              onChange={(e) => props.onWebsiteChange(e.target.value)}
              className="uber-input pl-10"
            />
          </div>
        </div>
      </div>
      {clientApplicationShowsSection('business', 'coverage-needs') ? <ClientSignupCoverageNeeds {...props} /> : null}
      {clientApplicationShowsSection('business', 'service-area') ? <ClientSignupServiceArea {...props} /> : null}
      {clientApplicationShowsSection('business', 'prior-security-experience') ? (
        <ClientSignupPriorExperience {...props} />
      ) : null}
      {clientApplicationShowsSection('business', 'referral') ? <ClientSignupReferral {...props} /> : null}
    </>
  );
}
