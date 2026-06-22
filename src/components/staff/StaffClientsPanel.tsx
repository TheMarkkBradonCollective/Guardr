import React, { useEffect, useState } from 'react';
import { Client, SecurityRequest } from '../../types';
import { useDevice } from '../../lib/platform';
import { StaffClientDetailPanel } from './StaffClientDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { StaffAddClientForm } from './StaffAddClientForm';
import type { StaffAddClientInput } from './StaffAddClientForm';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';

interface StaffClientsPanelProps {
  clients: Client[];
  requests: SecurityRequest[];
  canManage: boolean;
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  onDeleteClient?: (id: string) => void | Promise<void>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
  onOpenJob?: (jobId: string) => void;
  onAddClient?: (input: StaffAddClientInput) => Promise<string>;
}

export function StaffClientsPanel({
  clients,
  requests,
  canManage,
  onApproveClient,
  onRejectClient,
  onDeleteClient,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
  onOpenJob,
  onAddClient,
}: StaffClientsPanelProps) {
  const [search, setSearch] = useState('');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedId);
  const isControlled = controlledSelectedId !== undefined;
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;

  const setSelectedId = (id: string | null) => {
    if (!isControlled) setInternalSelectedId(id);
    onSelectedIdChange?.(id);
  };

  useEffect(() => {
    if (isControlled) return;
    setInternalSelectedId(initialSelectedId);
  }, [initialSelectedId, isControlled]);
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
    const accountStatus = getClientAccountStatus(client);
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
            <WfBadge tone={accountStatus === 'pending' ? 'warning' : accountStatus === 'active' ? 'success' : 'danger'}>
              {CLIENT_ACCOUNT_STATUS_LABELS[accountStatus]}
            </WfBadge>
          </div>
        }
        onClick={() => setSelectedId(client.id)}
        className={isActive ? 'app-item-card-selected' : ''}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <p className="text-sm text-brand-text-muted flex-1">
              Staff can add client accounts, approve them, and suspend or restore access.
            </p>
            {canManage && onAddClient && (
              <StaffAddClientForm
                onAdd={onAddClient}
                onCreated={(clientId) => {
                  setSearch('');
                  setSelectedId(clientId);
                }}
              />
            )}
          </div>

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
          {clients.length === 0
            ? 'No clients yet. Use Add client above to onboard the first account.'
            : 'No clients match your search.'}
        </p>
      ) : showDetailOnly && selected ? (
        <StaffClientDetailPanel
          client={selected}
          requests={requests}
          canManage={canManage}
          onApproveClient={onApproveClient}
          onRejectClient={onRejectClient}
          onDeleteClient={onDeleteClient}
          onOpenJob={onOpenJob}
          onBack={() => setSelectedId(null)}
        />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <AppItemCardStack>
              {filtered.map((client) => renderClientCard(client, selected?.id === client.id))}
            </AppItemCardStack>
          </div>
          {selected && (
            <StaffClientDetailPanel
              client={selected}
              requests={requests}
              canManage={canManage}
              onApproveClient={onApproveClient}
              onRejectClient={onRejectClient}
              onDeleteClient={onDeleteClient}
              onOpenJob={onOpenJob}
            />
          )}
        </div>
      ) : (
        <AppItemCardStack>
          {filtered.map((client) => renderClientCard(client, false))}
        </AppItemCardStack>
      )}
    </div>
  );
}
