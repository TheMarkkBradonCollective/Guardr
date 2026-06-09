import React, { useState } from 'react';
import { Client, SecurityRequest } from '../../types';
import { useDevice } from '../../lib/platform';
import { StaffClientDetailPanel } from './StaffClientDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { Search } from 'lucide-react';

interface StaffClientsPanelProps {
  clients: Client[];
  requests: SecurityRequest[];
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  initialSelectedId?: string | null;
}

export function StaffClientsPanel({
  clients,
  requests,
  onApproveClient,
  onRejectClient,
  initialSelectedId = null,
}: StaffClientsPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selected = filtered.find((c) => c.id === selectedId) ?? (splitView ? filtered[0] : null) ?? null;
  const showDetailOnly = Boolean(selected && !splitView);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {!showDetailOnly && (
        <>
          <div>
            <h1 className="text-2xl font-black">Clients</h1>
            <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">
              Click a client to open their profile and manage their account
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="uber-input pl-10 w-full"
            />
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-brand-text-muted font-mono py-12 text-center border border-dashed border-brand-border rounded-xl">
          No clients match your search.
        </p>
      ) : showDetailOnly && selected ? (
        <StaffClientDetailPanel
          client={selected}
          requests={requests}
          onApproveClient={onApproveClient}
          onRejectClient={onRejectClient}
          onBack={() => setSelectedId(null)}
        />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filtered.map((client) => {
              const isSuspended = client.approved === false;
              const isActive = selected?.id === client.id;
              const activeJobs = requests.filter(
                (r) => r.clientId === client.id && ['accepted', 'in-progress', 'open'].includes(r.status)
              ).length;

              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedId(client.id)}
                  className={`w-full text-left staff-ops-card p-3 transition-colors ${
                    isActive ? 'ring-2 ring-brand-primary' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      src={client.avatar}
                      name={client.companyName || client.name}
                      size="sm"
                      rounded="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm truncate">{client.companyName || client.name}</p>
                      <p className="text-[10px] font-mono text-brand-text-muted truncate">{client.email}</p>
                      <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
                        {activeJobs} active · {isSuspended ? 'Suspended' : 'Active'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selected && (
            <StaffClientDetailPanel
              client={selected}
              requests={requests}
              onApproveClient={onApproveClient}
              onRejectClient={onRejectClient}
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => {
            const isSuspended = client.approved === false;
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedId(client.id)}
                className="w-full text-left staff-ops-card p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{client.companyName || client.name}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted truncate">{client.email}</p>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase shrink-0 ${
                      isSuspended ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
