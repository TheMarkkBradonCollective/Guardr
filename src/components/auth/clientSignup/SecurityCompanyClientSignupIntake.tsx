import React from 'react';
import { clientApplicationShowsSection } from '../../../lib/clientApplicationIntake';
import type { ClientSignupIntakeProps } from './types';
import {
  ClientSignupContactPhone,
  ClientSignupCoverageNeeds,
  ClientSignupReferral,
  ClientSignupServiceArea,
  ClientSignupWebsiteField,
} from './ClientSignupSharedSections';

export function SecurityCompanyClientSignupIntake(props: ClientSignupIntakeProps) {
  return (
    <>
      <div>
        <label className="uber-label block mb-2">Security company name</label>
        <input
          type="text"
          required
          placeholder="Acme Patrol Services"
          value={props.clientCompanyName}
          onChange={(e) => props.onClientCompanyNameChange(e.target.value)}
          className="uber-input"
        />
      </div>
      <div>
        <label className="uber-label block mb-2">BSIS PPO license number</label>
        <input
          type="text"
          required
          placeholder="PPO license number"
          value={props.businessLicense}
          onChange={(e) => props.onBusinessLicenseChange(e.target.value)}
          className="uber-input"
        />
        <p className="text-xs text-brand-text-muted mt-1.5">
          Staff verify your PPO credential upload before your first marketplace job — Guardr does not dispatch your shifts.
        </p>
      </div>
      <ClientSignupContactPhone {...props} />
      <ClientSignupWebsiteField
        website={props.website}
        onWebsiteChange={props.onWebsiteChange}
        placeholder="https://yoursecuritycompany.com"
      />
      {clientApplicationShowsSection('security-company', 'coverage-needs') ? (
        <ClientSignupCoverageNeeds {...props} />
      ) : null}
      {clientApplicationShowsSection('security-company', 'service-area') ? (
        <ClientSignupServiceArea {...props} />
      ) : null}
      {clientApplicationShowsSection('security-company', 'referral') ? <ClientSignupReferral {...props} /> : null}
    </>
  );
}
