import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import {
  confirmApproveClientAccount,
  confirmMarkClientTrusted,
  confirmRemoveClientTrusted,
  confirmRestoreAccount,
  confirmSuspendAccount,
} from '../../lib/importantActionConfirm';
import React, { useMemo, useState } from 'react';
import { Client, SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { ArrowLeft, Building2, Globe, Mail, MapPin, Phone, Star } from 'lucide-react';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';

function IntakeField({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-0.5">{label}</p>
      <p className="text-sm text-brand-text leading-relaxed">{String(value)}</p>
    </div>
  );
}

interface StaffClientDetailPanelProps {
  client: Client;
  requests: SecurityRequest[];
  canManage: boolean;
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  onDeleteClient?: (id: string) => void | Promise<void>;
  onSetClientTrusted?: (clientId: string, trusted: boolean) => void | Promise<void>;
  onBack?: () => void;
  onOpenJob?: (jobId: string) => void;
  compact?: boolean;
}

export function StaffClientDetailPanel({
  client,
  requests,
  canManage,
  onApproveClient,
  onRejectClient,
  onDeleteClient,
  onSetClientTrusted,
  onBack,
  onOpenJob,
  compact = false,
}: StaffClientDetailPanelProps) {
  const [deleting, setDeleting] = useState(false);
  const accountStatus = getClientAccountStatus(client);
  const isPending = accountStatus === 'pending';
  const isSuspended = accountStatus === 'suspended';

  const clientRequests = useMemo(
    () =>
      requests
        .filter((r) => r.clientId === client.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [requests, client.id]
  );

  const activeJobs = clientRequests.filter((r) => ['accepted', 'in-progress', 'open'].includes(r.status));
  const completedJobs = clientRequests.filter((r) => r.status === 'completed');

  const handleDelete = async () => {
    if (!onDeleteClient) return;
    if (!(await showAppConfirm({
      title: 'Delete client account?',
      message: `Delete client account for ${client.companyName || client.name}? This cannot be undone.`,
      confirmLabel: 'Delete account',
      tone: 'danger',
    }))) {
      return;
    }
    setDeleting(true);
    try {
      await onDeleteClient(client.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not delete client account.', { tone: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const displayName = client.companyName || client.name;

  const handleToggleTrusted = async () => {
    if (!onSetClientTrusted) return;
    const confirmed = client.trusted
      ? await confirmRemoveClientTrusted(displayName)
      : await confirmMarkClientTrusted(displayName);
    if (!confirmed) return;
    await onSetClientTrusted(client.id, !client.trusted);
  };

  const handleApproveClient = async () => {
    if (!(await confirmApproveClientAccount(displayName))) return;
    onApproveClient(client.id);
  };

  const handleSuspendClient = async () => {
    if (!(await confirmSuspendAccount(displayName, 'client'))) return;
    onRejectClient(client.id);
  };

  const handleRestoreClient = async () => {
    if (!(await confirmRestoreAccount(displayName, 'client'))) return;
    onApproveClient(client.id);
  };

  const statusTone = isPending ? 'warning' : isSuspended ? 'danger' : 'success';

  return (
    <div className={`staff-detail-pane space-y-0 ${compact ? '' : 'h-full overflow-y-auto'}`}>
      {onBack && (
        <div className="px-1 pb-4">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </button>
        </div>
      )}

      <div className="flex items-start gap-4 pb-5 border-b border-brand-border">
        <ProfileAvatar
          src={client.avatar}
          name={client.companyName || client.name}
          size="lg"
          rounded="xl"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-lg">{client.companyName || client.name}</h2>
          {client.companyName && client.name !== client.companyName && (
            <p className="text-sm text-brand-text-muted">{client.name}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-brand-text-muted">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {client.email}
            </span>
            {client.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {client.phone}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <WfBadge tone={statusTone}>{CLIENT_ACCOUNT_STATUS_LABELS[accountStatus]}</WfBadge>
            {client.trusted && <WfBadge tone="primary">Trusted</WfBadge>}
            {client.rating != null && (
              <WfBadge className="inline-flex items-center gap-1">
                <Star className="w-3 h-3" />
                {client.rating}
              </WfBadge>
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-3 gap-x-4 gap-y-3 py-4 border-b border-brand-border">
        <div>
          <p className="wf-metric-label">Active jobs</p>
          <p className="wf-metric-value text-brand-primary">{activeJobs.length}</p>
        </div>
        <div>
          <p className="wf-metric-label">Completed</p>
          <p className="wf-metric-value">{completedJobs.length}</p>
        </div>
        <div>
          <p className="wf-metric-label">Total requests</p>
          <p className="wf-metric-value">{client.totalRequests ?? clientRequests.length}</p>
        </div>
      </section>

      {canManage && (
        <section className="py-4 border-b border-brand-border space-y-2">
          <WfSectionHeader title="Account controls" className="mb-0" />
          <div className="app-action-row--equal">
            {isPending && (
              <button type="button" onClick={() => void handleApproveClient()} className="app-button-primary app-btn-sm">
                Approve client account
              </button>
            )}
            {isSuspended && (
              <button type="button" onClick={() => void handleRestoreClient()} className="app-button-primary app-btn-sm">
                Restore client account
              </button>
            )}
            {!isPending && !isSuspended && (
              <button type="button" onClick={() => void handleSuspendClient()} className="app-button-outline app-btn-sm text-red-400 border-red-500/40">
                Suspend client account
              </button>
            )}
            {onSetClientTrusted && (
              <button
                type="button"
                onClick={() => void handleToggleTrusted()}
                className={`app-button-outline app-btn-sm ${client.trusted ? 'text-amber-500 border-amber-500/40' : ''}`}
                title={
                  client.trusted
                    ? 'Remove trusted status — client jobs will require staff approval'
                    : 'Mark as trusted — client jobs skip approval queue for non-cash jobs'
                }
              >
                {client.trusted ? 'Remove trusted' : 'Mark as trusted'}
              </button>
            )}
            {onDeleteClient && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Client intake / application data */}
      {(client.serviceDescription || client.businessType || client.industries?.length ||
        client.businessLicense || client.website || client.serviceTypes?.length ||
        client.estimatedGuardsNeeded || client.armedPreference || client.serviceFrequencies?.length ||
        client.estimatedStartDate || client.budgetRange || client.serviceCity ||
        client.propertyTypes?.length || client.referredBy || client.howHeardAboutUs ||
        client.hasPriorSecurityService != null || client.specialRequirements) && (
        <section className="py-4 border-b border-brand-border space-y-4">
          <WfSectionHeader title="Client application" className="mb-1" />

          {/* Business */}
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
                    {client.industries.map((i) => <WfBadge key={i}>{i}</WfBadge>)}
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

          {/* Service needs */}
          {(client.serviceDescription || client.serviceTypes?.length || client.estimatedGuardsNeeded ||
            client.armedPreference || client.serviceFrequencies?.length || client.estimatedStartDate || client.budgetRange) && (
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
                <IntakeField label="Armed preference" value={
                  client.armedPreference === 'armed' ? 'Armed' :
                  client.armedPreference === 'unarmed' ? 'Unarmed' :
                  client.armedPreference === 'no-preference' ? 'No preference' : undefined
                } />
                <IntakeField label="Est. start" value={client.estimatedStartDate} />
                <IntakeField label="Budget range" value={client.budgetRange} />
              </div>
              {client.serviceTypes?.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Service types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.serviceTypes.map((s) => <WfBadge key={s}>{s}</WfBadge>)}
                  </div>
                </div>
              ) : null}
              {client.serviceFrequencies?.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Frequency</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.serviceFrequencies.map((f) => <WfBadge key={f}>{f}</WfBadge>)}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Location & site */}
          {(client.serviceCity || client.propertyTypes?.length) && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Location & site</p>
              {client.serviceCity && (
                <div className="inline-flex items-center gap-1.5 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{client.serviceCity}{client.serviceState ? `, ${client.serviceState}` : ', CA'}</span>
                </div>
              )}
              {client.propertyTypes?.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Property types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.propertyTypes.map((p) => <WfBadge key={p}>{p}</WfBadge>)}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Referral & history */}
          {(client.referredBy || client.howHeardAboutUs || client.hasPriorSecurityService != null ||
            client.priorSecurityProvider || client.specialRequirements) && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Background</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <IntakeField label="Referred by" value={client.referredBy} />
                <IntakeField label="How they heard" value={client.howHeardAboutUs} />
                <IntakeField
                  label="Prior security service"
                  value={client.hasPriorSecurityService == null ? undefined : client.hasPriorSecurityService ? 'Yes' : 'No'}
                />
                <IntakeField label="Prior provider" value={client.priorSecurityProvider} />
              </div>
              {client.specialRequirements && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-1">Special requirements</p>
                  <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{client.specialRequirements}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="py-4 space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 className="w-4 h-4 text-brand-text-muted" />
          <WfSectionHeader title="Job history" className="mb-0" />
        </div>
        {clientRequests.length === 0 ? (
          <p className="text-sm text-brand-text-muted">No jobs posted yet.</p>
        ) : (
          <>
            {clientRequests.length > 12 && (
              <p className="text-xs text-brand-text-muted mb-2">
                Showing 12 most recent of {clientRequests.length} jobs
              </p>
            )}
            <AppItemCardStack>
              {clientRequests.slice(0, 12).map((job) => (
                <JobListCard
                  key={job.id}
                  job={job}
                  subtitle={job.location}
                  meta={
                    <div className="flex flex-wrap items-center gap-1.5">
                      <WfBadge>{job.status.replace('-', ' ')}</WfBadge>
                      <span>{formatShiftRange(job.startDate, job.endDate)}</span>
                    </div>
                  }
                  onClick={onOpenJob ? () => onOpenJob(job.id) : undefined}
                  showStatus={false}
                />
              ))}
            </AppItemCardStack>
          </>
        )}
      </section>
    </div>
  );
}
