import React from 'react';
import { Client } from '../../types';
import { WfSectionHeader } from '../ui/wireframe';
import { AppNoticeChip } from '../ui/app/AppBlockedAccess';
import { clientApplicationIntake } from '../../lib/clientApplicationIntake';
import { staffApplicationReviewFocus } from '../../lib/staffPlatformScope';
import { clientTypeLabel } from '../../lib/clientType';
import { StaffPersonalClientApplication } from './StaffPersonalClientApplication';
import { StaffBusinessClientApplication } from './StaffBusinessClientApplication';
import { StaffSecurityCompanyApplication } from './StaffSecurityCompanyApplication';

interface StaffClientApplicationSummaryProps {
  client: Client;
}

export function StaffClientApplicationSummary({ client }: StaffClientApplicationSummaryProps) {
  const intake = clientApplicationIntake(client.clientType);
  const kind = intake.type;

  const hasApplicationData =
    client.serviceDescription ||
    client.businessType ||
    client.industries?.length ||
    client.businessLicense ||
    client.website ||
    client.serviceTypes?.length ||
    client.estimatedGuardsNeeded ||
    client.armedPreference ||
    client.serviceFrequencies?.length ||
    client.estimatedStartDate ||
    client.budgetRange ||
    client.serviceCity ||
    client.propertyTypes?.length ||
    client.referredBy ||
    client.howHeardAboutUs ||
    client.hasPriorSecurityService != null ||
    client.specialRequirements;

  if (!hasApplicationData) {
    return (
      <section className="staff-detail-section space-y-2">
        <WfSectionHeader title={`${intake.headline} application`} className="!px-0 !mb-0" />
        <p className="text-xs text-brand-text-muted">
          {clientTypeLabel(client.clientType)} — billed to the{' '}
          {kind === 'personal' ? 'individual' : 'organization'}
        </p>
        <p className="text-xs text-brand-text-muted leading-relaxed">{staffApplicationReviewFocus(kind)}</p>
        <AppNoticeChip
          label="No intake on file"
          title="No sign-up intake on file"
          message="No sign-up intake on file for this client. Use Full profile if you need more context before approving."
        />
      </section>
    );
  }

  return (
    <section className="staff-detail-section space-y-4">
      <div>
        <WfSectionHeader title={`${intake.headline} application`} className="!px-0 !mb-0" />
        <p className="text-xs text-brand-text-muted mt-0.5">
          {clientTypeLabel(client.clientType)} — billed to the{' '}
          {kind === 'personal' ? 'individual' : 'organization'}
        </p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{staffApplicationReviewFocus(kind)}</p>
      </div>

      {kind === 'personal' ? (
        <StaffPersonalClientApplication client={client} />
      ) : kind === 'security-company' ? (
        <StaffSecurityCompanyApplication client={client} />
      ) : (
        <StaffBusinessClientApplication client={client} />
      )}
    </section>
  );
}
