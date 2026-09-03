import React from 'react';
import { Client } from '../../types';
import { WfBadge } from '../ui/wireframe';
import { Globe } from 'lucide-react';
import { IntakeField } from './applicationIntakeFields';
import { StaffSharedLocationAndBackground } from './StaffPersonalClientApplication';

export function StaffSecurityCompanyApplication({ client }: { client: Client }) {
  return (
    <>
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">PPO & company</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <IntakeField label="Company" value={client.companyName} />
          <IntakeField label="PPO license number" value={client.businessLicense} />
          <IntakeField label="Entity type" value={client.businessType} />
        </div>
        {client.website ? (
          <a
            href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-primary"
          >
            <Globe className="w-3.5 h-3.5" />
            {client.website}
          </a>
        ) : null}
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Verify PPO credential uploads in the credentials queue — staff do not review live shift operations for this
          account.
        </p>
      </div>

      {(client.serviceDescription ||
        client.serviceTypes?.length ||
        client.estimatedGuardsNeeded ||
        client.armedPreference ||
        client.estimatedStartDate ||
        client.budgetRange) && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">
            Operations & overflow
          </p>
          {client.serviceDescription ? (
            <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{client.serviceDescription}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <IntakeField label="Typical guards per post" value={client.estimatedGuardsNeeded} />
            <IntakeField label="Est. start" value={client.estimatedStartDate} />
          </div>
          {client.serviceTypes?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {client.serviceTypes.map((s) => (
                <WfBadge key={s}>{s}</WfBadge>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <StaffSharedLocationAndBackground client={client} showPriorExperience={false} />
    </>
  );
}
