import React from 'react';
import { Client } from '../../types';
import { WfBadge } from '../ui/wireframe';
import { Globe } from 'lucide-react';
import { IntakeField } from './applicationIntakeFields';
import { StaffSharedLocationAndBackground } from './StaffPersonalClientApplication';

export function StaffBusinessClientApplication({ client }: { client: Client }) {
  return (
    <>
      {(client.businessType || client.businessLicense || client.website || client.industries?.length) && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Organization</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <IntakeField label="Business type" value={client.businessType} />
            <IntakeField label="License / EIN" value={client.businessLicense} />
          </div>
          {client.industries?.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Industries</p>
              <div className="flex flex-wrap gap-1.5">
                {client.industries.map((i) => (
                  <WfBadge key={i}>{i}</WfBadge>
                ))}
              </div>
            </div>
          ) : null}
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
        </div>
      )}

      {(client.serviceDescription ||
        client.serviceTypes?.length ||
        client.estimatedGuardsNeeded ||
        client.armedPreference ||
        client.serviceFrequencies?.length ||
        client.estimatedStartDate ||
        client.budgetRange) && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Staffing needs</p>
          {client.serviceDescription ? (
            <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{client.serviceDescription}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <IntakeField label="Estimated guards" value={client.estimatedGuardsNeeded} />
            <IntakeField label="Est. start" value={client.estimatedStartDate} />
            <IntakeField label="Budget range" value={client.budgetRange} />
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

      <StaffSharedLocationAndBackground client={client} showPriorExperience />
    </>
  );
}
