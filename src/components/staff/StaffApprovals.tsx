import React from 'react';
import { SecurityGuard } from '../../types';
import { getPendingCertifications } from '../../lib/staffOps';
import { WfListCard, WfSectionHeader } from '../ui/wireframe';
import { Check, X } from 'lucide-react';

interface StaffApprovalsProps {
  guards: SecurityGuard[];
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onViewGuard?: (guardId: string) => void;
}

export function StaffApprovals({
  guards,
  onApproveCert,
  onRejectCert,
  onViewGuard,
}: StaffApprovalsProps) {
  const pendingCerts = getPendingCertifications(guards);

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Credential verification</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Review uploaded licenses and certificates — verification is a trust badge only
        </p>
      </div>

      {pendingCerts.length === 0 ? (
        <p className="text-sm text-brand-text-muted py-12 text-center border border-dashed border-brand-border rounded-xl">
          No credentials awaiting verification.
        </p>
      ) : (
        <section>
          <WfSectionHeader title="Pending review" count={pendingCerts.length} />
          <div className="space-y-3">
            {pendingCerts.map(({ guard, cert }) => (
              <WfListCard
                key={cert.id}
                avatar={
                  cert.imageUrl ? (
                    <img
                      src={cert.imageUrl}
                      alt={`${cert.name} document`}
                      className="w-14 h-14 rounded-xl object-cover border border-brand-border"
                    />
                  ) : undefined
                }
                title={`${guard.name} — ${cert.name}`}
                subtitle={`${cert.issuer} · #${cert.number}${cert.state ? ` · ${cert.state}` : ''}`}
                meta={<span>Expires {cert.expiryDate || '—'}</span>}
                action={
                  <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                    {onViewGuard && (
                      <button type="button" onClick={() => onViewGuard(guard.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                        View profile
                      </button>
                    )}
                    <button type="button" onClick={() => onRejectCert(guard.id, cert.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button type="button" onClick={() => onApproveCert(guard.id, cert.id)} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
                      <Check className="w-3.5 h-3.5" /> Verify
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
