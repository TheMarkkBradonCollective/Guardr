import React from 'react';
import { SecurityGuard } from '../../types';
import { getPendingCertifications } from '../../lib/staffOps';
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
        <h1 className="text-2xl font-black">Credential verification</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">
          Review uploaded licenses and certificates — verification is a trust badge only
        </p>
      </div>

      {pendingCerts.length === 0 ? (
        <p className="text-sm text-brand-text-muted font-mono py-12 text-center border border-dashed border-brand-border rounded-xl">
          No credentials awaiting verification.
        </p>
      ) : (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">
            Pending review ({pendingCerts.length})
          </h2>
          <div className="space-y-3">
            {pendingCerts.map(({ guard, cert }) => (
              <div key={cert.id} className="staff-ops-card flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-4 min-w-0">
                  {cert.imageUrl && (
                    <img
                      src={cert.imageUrl}
                      alt={`${cert.name} document`}
                      className="w-20 h-20 rounded-lg object-cover border border-brand-border shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{guard.name} — {cert.name}</p>
                    <p className="text-xs font-mono text-brand-text-muted">
                      {cert.issuer} · #{cert.number}{cert.state ? ` · ${cert.state}` : ''}
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1">
                      Expires {cert.expiryDate || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                  {onViewGuard && (
                    <button type="button" onClick={() => onViewGuard(guard.id)} className="staff-ops-btn-outline">
                      View profile
                    </button>
                  )}
                  <button type="button" onClick={() => onRejectCert(guard.id, cert.id)} className="staff-ops-btn-danger">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button type="button" onClick={() => onApproveCert(guard.id, cert.id)} className="staff-ops-btn-primary">
                    <Check className="w-3.5 h-3.5" /> Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
