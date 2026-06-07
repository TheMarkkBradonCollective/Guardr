import React from 'react';
import { Client, SecurityRequest } from '../../types';

interface StaffClientsPanelProps {
  clients: Client[];
  requests: SecurityRequest[];
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
}

export function StaffClientsPanel({ clients, requests, onApproveClient, onRejectClient }: StaffClientsPanelProps) {
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
                    client.approved ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'
                  }`}>
                    {client.approved ? 'Verified' : 'Pending'}
                  </span>
                  {!client.approved && (
                    <button type="button" onClick={() => onApproveClient(client.id)} className="staff-ops-btn-primary text-[10px]">Approve</button>
                  )}
                  <button type="button" onClick={() => alert('Client postings require staff review.')} className="staff-ops-btn-outline text-[10px]">Require Review</button>
                  <button type="button" onClick={() => alert('Account frozen — no new postings.')} className="staff-ops-btn-outline text-[10px]">Freeze</button>
                  <button type="button" onClick={() => onRejectClient(client.id)} className="staff-ops-btn-danger text-[10px]">Suspend</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
