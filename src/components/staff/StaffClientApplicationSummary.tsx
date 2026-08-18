import React from 'react';
import { Client } from '../../types';
import { WfBadge } from '../ui/wireframe';
import { Globe, MapPin } from 'lucide-react';
import { AppNoticeChip } from '../ui/app/AppBlockedAccess';
import { clientTypeLabel } from '../../lib/clientType';

function IntakeField({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-0.5">{label}</p>
      <p className="text-sm text-brand-text leading-relaxed">{String(value)}</p>
    </div>
  );
}

interface StaffClientApplicationSummaryProps {
  client: Client;
}

export function StaffClientApplicationSummary({ client }: StaffClientApplicationSummaryProps) {
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
      <section className="staff-detail-section space-y-2 !px-0">
        <p className="text-sm font-semibold text-brand-text">Application details</p>
        <p className="text-xs text-brand-text-muted">
          {clientTypeLabel(client.clientType)} — billed to the{' '}
          {client.clientType === 'personal' ? 'individual' : 'organization'}
        </p>
        <AppNoticeChip
          label="No intake on file"
          title="No sign-up intake on file"
          message="No sign-up intake on file for this client. Use Full profile if you need more context before approving."
        />
      </section>
    );
  }

  return (
    <section className="staff-detail-section space-y-4 !px-0">
      <div>
        <p className="text-sm font-semibold text-brand-text">Application details</p>
        <p className="text-xs text-brand-text-muted mt-0.5">
          {clientTypeLabel(client.clientType)} — billed to the{' '}
          {client.clientType === 'personal' ? 'individual' : 'organization'}
        </p>
      </div>

      {(client.businessType || client.businessLicense || client.website || client.industries?.length) && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Business</p>
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
          {client.website && (
            <a
              href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-primary"
            >
              <Globe className="w-3.5 h-3.5" />
              {client.website}
            </a>
          )}
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
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Security needs</p>
          {client.serviceDescription && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Description</p>
              <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{client.serviceDescription}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <IntakeField label="Estimated guards" value={client.estimatedGuardsNeeded} />
            <IntakeField
              label="Armed preference"
              value={
                client.armedPreference === 'armed'
                  ? 'Armed'
                  : client.armedPreference === 'unarmed'
                    ? 'Unarmed'
                    : client.armedPreference === 'no-preference'
                      ? 'No preference'
                      : undefined
              }
            />
            <IntakeField label="Est. start" value={client.estimatedStartDate} />
            <IntakeField label="Budget range" value={client.budgetRange} />
          </div>
          {client.serviceTypes?.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Service types</p>
              <div className="flex flex-wrap gap-1.5">
                {client.serviceTypes.map((s) => (
                  <WfBadge key={s}>{s}</WfBadge>
                ))}
              </div>
            </div>
          ) : null}
          {client.serviceFrequencies?.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Frequency</p>
              <div className="flex flex-wrap gap-1.5">
                {client.serviceFrequencies.map((f) => (
                  <WfBadge key={f}>{f}</WfBadge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {(client.serviceCity || client.propertyTypes?.length) && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Location & site</p>
          {client.serviceCity && (
            <div className="inline-flex items-center gap-1.5 text-sm">
              <MapPin className="w-3.5 h-3.5 text-brand-primary" />
              <span>
                {client.serviceCity}
                {client.serviceState ? `, ${client.serviceState}` : ', CA'}
              </span>
            </div>
          )}
          {client.propertyTypes?.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Property types</p>
              <div className="flex flex-wrap gap-1.5">
                {client.propertyTypes.map((p) => (
                  <WfBadge key={p}>{p}</WfBadge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {(client.referredBy ||
        client.howHeardAboutUs ||
        client.hasPriorSecurityService != null ||
        client.priorSecurityProvider ||
        client.specialRequirements) && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Background</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <IntakeField label="Referred by" value={client.referredBy} />
            <IntakeField label="How they heard" value={client.howHeardAboutUs} />
            <IntakeField
              label="Prior security service"
              value={
                client.hasPriorSecurityService == null
                  ? undefined
                  : client.hasPriorSecurityService
                    ? 'Yes'
                    : 'No'
              }
            />
            <IntakeField label="Prior provider" value={client.priorSecurityProvider} />
          </div>
          {client.specialRequirements && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">
                Special requirements
              </p>
              <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
                {client.specialRequirements}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
