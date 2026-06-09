import React from 'react';
import { Client, SecurityRequest } from '../../types';

interface StaffClientsPanelProps {
  clients: Client[];
  requests: SecurityRequest[];
  onRejectClient: (id: string) => void;
}

export function StaffClientsPanel({ clients, requests, onRejectClient }: StaffClientsPanelProps) {
  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Clients</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Client monitoring and account controls</p>
      </div>

      <div className="space-y-3">
        {clients.map((client) => {
          const activeJobs = requests.filter(
            (r) => r.clientId === client.id && ['accepted', 'in-progress', 'open'].includes(r.status)
          ).length;
          const completedJobs = requests.filter((r) => r.clientId === client.id && r.status === 'completed').length;
          const isSuspended = client.approved === false;

          return (
            <div key={client.id} className="staff-ops-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="font-black text-sm">{client.companyName || client.name}</h3>
                    <p className="text-xs font-mono text-brand-text-muted">{client.email}</p>
                    <div className="flex gap-3 mt-1 text-[10px] font-mono text-brand-text-muted">
                      <span>{activeJobs} active jobs</span>
                      <span>{completedJobs} completed</span>
                      <span>★ {client.rating ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${
                    isSuspended ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isSuspended ? 'Suspended' : 'Active'}
                  </span>
                  {!isSuspended && (
                    <button type="button" onClick={() => onRejectClient(client.id)} className="staff-ops-btn-danger text-[10px]">Suspend</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
