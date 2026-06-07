import React from 'react';
import { Client, SecurityGuard } from '../../types';
import { getPendingCertifications } from '../../lib/staffOps';
import { formatStateName } from '../../lib/states';
import { Check, Info, X } from 'lucide-react';

interface StaffApprovalsProps {
  guards: SecurityGuard[];
  clients: Client[];
  onApproveGuard: (id: string) => void;
  onRejectGuard: (id: string) => void;
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
}

export function StaffApprovals({
  guards,
  clients,
  onApproveGuard,
  onRejectGuard,
  onApproveClient,
  onRejectClient,
  onApproveCert,
  onRejectCert,
}: StaffApprovalsProps) {
  const pendingGuards = guards.filter((g) => !g.verified && !g.isStaff);
  const pendingClients = clients.filter((c) => c.approved === false);
  const pendingCerts = getPendingCertifications(guards);

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Approvals</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Guard, client, and credential review queue</p>
      </div>

      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">
          Guard Approvals ({pendingGuards.length})
        </h2>
        {pendingGuards.length === 0 ? (
          <p className="text-sm text-brand-text-muted font-mono py-8 text-center border border-dashed border-brand-border rounded-xl">No pending guard accounts.</p>
        ) : (
          <div className="space-y-3">
            {pendingGuards.map((guard) => (
              <div key={guard.id} className="staff-ops-card">
                <div className="flex flex-col sm:flex-row gap-4">
                  <img src={guard.avatar} alt={guard.name} className="w-14 h-14 rounded-xl object-cover border border-brand-border" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{guard.name}</h3>
                      <span className="text-[10px] font-mono text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">Pending</span>
                    </div>
                    <p className="text-xs font-mono text-brand-text-muted">{guard.email} · Badge {guard.badgeNumber}</p>
                    <p className="text-xs text-brand-text-muted line-clamp-2">{guard.bio}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                      <span className={`px-2 py-0.5 rounded border ${guard.backgroundChecked ? 'border-emerald-500/30 text-emerald-400' : 'border-brand-border text-brand-text-muted'}`}>
                        BG Check: {guard.backgroundChecked ? 'Clear' : 'Pending'}
                      </span>
                      <span className="px-2 py-0.5 rounded border border-brand-border text-brand-text-muted">
                        {guard.certifications.length} certifications
                      </span>
                      <span className="px-2 py-0.5 rounded border border-brand-border text-brand-text-muted">
                        {guard.experience.length} experience entries
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button type="button" onClick={() => onApproveGuard(guard.id)} className="staff-ops-btn-primary">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button type="button" onClick={() => onRejectGuard(guard.id)} className="staff-ops-btn-danger">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button type="button" onClick={() => alert('Info request sent to guard.')} className="staff-ops-btn-outline">
                      <Info className="w-3.5 h-3.5" /> Request Info
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">
          Client Approvals ({pendingClients.length})
        </h2>
        {pendingClients.length === 0 ? (
          <p className="text-sm text-brand-text-muted font-mono py-8 text-center border border-dashed border-brand-border rounded-xl">No pending client accounts.</p>
        ) : (
          <div className="space-y-3">
            {pendingClients.map((client) => (
              <div key={client.id} className="staff-ops-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="font-black text-sm">{client.companyName || client.name}</h3>
                    <p className="text-xs font-mono text-brand-text-muted">{client.email} · {client.phone}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">{client.totalRequests} prior requests</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onApproveClient(client.id)} className="staff-ops-btn-primary">Approve</button>
                  <button type="button" onClick={() => alert('Account placed on hold.')} className="staff-ops-btn-outline">Hold</button>
                  <button type="button" onClick={() => onRejectClient(client.id)} className="staff-ops-btn-danger">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pendingCerts.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">
            Credential Claims ({pendingCerts.length})
          </h2>
          <div className="space-y-3">
            {pendingCerts.map(({ guard, cert }) => (
              <div key={cert.id} className="staff-ops-card flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="font-bold text-sm">{guard.name} — {cert.name}</p>
                  <p className="text-xs font-mono text-brand-text-muted">{cert.issuer} · #{cert.number}{cert.state ? ` · ${cert.state}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onRejectCert(guard.id, cert.id)} className="staff-ops-btn-danger">Reject</button>
                  <button type="button" onClick={() => onApproveCert(guard.id, cert.id)} className="staff-ops-btn-primary">Approve</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
