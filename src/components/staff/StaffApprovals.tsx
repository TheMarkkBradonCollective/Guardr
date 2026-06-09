import React from 'react';
import { SecurityGuard } from '../../types';
import { getPendingCertifications } from '../../lib/staffOps';
import { AppList } from '../ui/app/AppPrimitives';
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
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <p className="text-sm text-brand-text-muted px-4 sm:px-5 pb-4">
        Review uploaded licenses and certificates — verification is a trust badge only
      </p>

      {pendingCerts.length === 0 ? (
        <p className="staff-empty-state border-t border-brand-border">
          No credentials awaiting verification.
        </p>
      ) : (
        <section>
          <div className="px-4 sm:px-5 pb-3">
            <WfSectionHeader title="Pending review" count={pendingCerts.length} />
          </div>
          <AppList>
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
          </AppList>
        </section>
      )}
    </div>
  );
}
