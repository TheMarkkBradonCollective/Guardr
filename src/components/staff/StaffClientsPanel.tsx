import React, { useState } from 'react';
import { Client, SecurityRequest } from '../../types';
import { useDevice } from '../../lib/platform';
import { StaffClientDetailPanel } from './StaffClientDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppList } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';

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

  function renderClientCard(client: Client, isActive: boolean) {
    const isSuspended = client.approved === false;
    const activeJobs = requests.filter(
      (r) => r.clientId === client.id && ['accepted', 'in-progress', 'open'].includes(r.status)
    ).length;

    return (
      <WfListCard
        key={client.id}
        avatar={
          <ProfileAvatar
            src={client.avatar}
            name={client.companyName || client.name}
            size="sm"
            rounded="lg"
          />
        }
        title={client.companyName || client.name}
        subtitle={client.email}
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <span>{activeJobs} active</span>
            <WfBadge tone={isSuspended ? 'danger' : 'success'}>
              {isSuspended ? 'Suspended' : 'Active'}
            </WfBadge>
          </div>
        }
        onClick={() => setSelectedId(client.id)}
        className={isActive ? 'ring-2 ring-brand-primary' : ''}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <p className="text-sm text-brand-text-muted">
            Click a client to open their profile and manage their account
          </p>

          <WfSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search clients..."
            className="max-w-md"
          />
        </>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-brand-text-muted py-12 text-center border border-dashed border-brand-border rounded-xl">
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
          <div className="max-h-[75vh] overflow-y-auto">
            <AppList>
              {filtered.map((client) => renderClientCard(client, selected?.id === client.id))}
            </AppList>
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
        <AppList>
          {filtered.map((client) => renderClientCard(client, false))}
        </AppList>
      )}
    </div>
  );
}
