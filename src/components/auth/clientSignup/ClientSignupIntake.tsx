import React from 'react';
import { StaffSignupNotice } from '../StaffSignupNotice';
import { normalizeClientType } from '../../../lib/clientType';
import type { ClientSignupIntakeProps } from './types';
import { ClientSignupIntakeHeader } from './ClientSignupSharedSections';
import { PersonalClientSignupIntake } from './PersonalClientSignupIntake';
import { BusinessClientSignupIntake } from './BusinessClientSignupIntake';
import { SecurityCompanyClientSignupIntake } from './SecurityCompanyClientSignupIntake';

interface ClientSignupIntakeRootProps extends ClientSignupIntakeProps {
  onApplyAsStaff: () => void;
}

export function ClientSignupIntake(props: ClientSignupIntakeRootProps) {
  const kind = normalizeClientType(props.clientKind);

  return (
    <div className="space-y-5 pt-4 border-t border-brand-border">
      <StaffSignupNotice onApplyAsStaff={props.onApplyAsStaff} compact />
      <ClientSignupIntakeHeader clientKind={kind} />
      {kind === 'personal' ? (
        <PersonalClientSignupIntake {...props} clientKind={kind} />
      ) : kind === 'security-company' ? (
        <SecurityCompanyClientSignupIntake {...props} clientKind={kind} />
      ) : (
        <BusinessClientSignupIntake {...props} clientKind={kind} />
      )}
    </div>
  );
}
