import React from 'react';
import { clientApplicationShowsSection } from '../../../lib/clientApplicationIntake';
import type { ClientSignupIntakeProps } from './types';
import {
  ClientSignupContactPhone,
  ClientSignupCoverageNeeds,
  ClientSignupPriorExperience,
  ClientSignupReferral,
  ClientSignupServiceArea,
} from './ClientSignupSharedSections';

export function PersonalClientSignupIntake(props: ClientSignupIntakeProps) {
  return (
    <>
      <ClientSignupContactPhone {...props} />
      {clientApplicationShowsSection('personal', 'coverage-needs') ? <ClientSignupCoverageNeeds {...props} /> : null}
      {clientApplicationShowsSection('personal', 'service-area') ? <ClientSignupServiceArea {...props} /> : null}
      {clientApplicationShowsSection('personal', 'prior-security-experience') ? (
        <ClientSignupPriorExperience {...props} />
      ) : null}
      {clientApplicationShowsSection('personal', 'referral') ? <ClientSignupReferral {...props} /> : null}
    </>
  );
}
