import React, { useEffect, useMemo, useState } from 'react';
import { GuardCrewJoinRequest, GuardStandingCrewMember, SecurityGuard, SecurityRequest } from '../../types';
import {
  getStaffCrewListings,
  type StaffCrewListing,
  type StaffCrewPhase,
} from '../../lib/guardTeams';
import {
  getActiveStandingCrewMembers,
  getPendingStandingCrewOutgoing,
  guardLeadsOwnStandingCrew,
} from '../../lib/guardStandingCrew';
import { getActionableCrewLeadRequests } from '../../lib/guardCrewJoinRequest';
import { formatShiftRange } from '../../lib/dates';
import { JobTeamRoster } from '../jobs/JobTeamRoster';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { Briefcase, MessageCircle, Shield, Users } from 'lucide-react';

type CrewFilter = 'all' | StaffCrewPhase;

const PHASE_LABEL: Record<StaffCrewPhase, string> = {
  recruiting: 'Building roster',
  needs_review: 'Needs review',
  confirmed: 'Crew confirmed',
  awaiting_client: 'Awaiting client',
  active: 'On assignment',
};

const PHASE_TONE: Record<StaffCrewPhase, 'warning' | 'primary' | 'default' | 'success'> = {
  recruiting: 'default',
  needs_review: 'warning',
  confirmed: 'primary',
  awaiting_client: 'primary',
  active: 'success',
};

const FILTER_OPTIONS: { id: CrewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'needs_review', label: 'Needs review' },
  { id: 'recruiting', label: 'Building' },
  { id: 'awaiting_client', label: 'Awaiting client' },
  { id: 'active', label: 'On assignment' },
];

type CrewView = 'job' | 'standing';

interface StaffGuardCrewsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  standingCrewMembers?: GuardStandingCrewMember[];
  crewJoinRequests?: GuardCrewJoinRequest[];
  canManage?: boolean;
  selectedJobId?: string | null;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  initialSelectedJobId?: string | null;
  onOpenJob?: (jobId: string) => void;
  onOpenMessages?: () => void;
  onApproveCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onRemoveCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onApproveCrewLeadRequest?: (requestId: string) => void | Promise<void>;
  onDeclineCrewLeadRequest?: (requestId: string) => void | Promise<void>;
}

export function StaffGuardCrewsPanel({
  requests,
  guards,
  standingCrewMembers = [],
  crewJoinRequests = [],
  canManage = false,
  selectedJobId: controlledSelectedJobId,
  onSelectedJobIdChange,
  initialSelectedJobId = null,
  onOpenJob,
  onOpenMessages,
  onApproveCrewMember,
  onDenyCrewMember,
  onRemoveCrewMember,
  onApproveCrewLeadRequest,
  onDeclineCrewLeadRequest,
}: StaffGuardCrewsPanelProps) {
  const [view, setView] = useState<CrewView>('standing');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CrewFilter>('all');
  const [selectedStandingLeadId, setSelectedStandingLeadId] = useState<string | null>(null);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [internalSelectedJobId, setInternalSelectedJobId] = useState<string | null>(initialSelectedJobId);
  const isControlled = controlledSelectedJobId !== undefined;
  const selectedJobId = isControlled ? controlledSelectedJobId : internalSelectedJobId;

  const setSelectedJobId = (jobId: string | null) => {
    if (!isControlled) setInternalSelectedJobId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  useEffect(() => {
    if (isControlled) return;
    setInternalSelectedJobId(initialSelectedJobId);
  }, [initialSelectedJobId, isControlled]);

  const listings = useMemo(() => getStaffCrewListings(requests, guards), [requests, guards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((crew) => {
      if (filter !== 'all' && crew.phase !== filter) return false;
      if (!q) return true;
      return (
        crew.crewName.toLowerCase().includes(q) ||
        (crew.crewDescription ?? '').toLowerCase().includes(q) ||
        crew.coordinatorName.toLowerCase().includes(q) ||
        crew.clientName.toLowerCase().includes(q) ||
        crew.jobTitle.toLowerCase().includes(q) ||
        crew.location.toLowerCase().includes(q)
      );
    });
  }, [listings, search, filter]);

  // Standing crews: trusted guards who lead their own crew
  const standingCrewLeads = useMemo(
    () => guards.filter((g) => g.trusted && guardLeadsOwnStandingCrew(g, standingCrewMembers)),
    [guards, standingCrewMembers]
  );

  const filteredStanding = useMemo(() => {
    const q = search.trim().toLowerCase();
    return standingCrewLeads.filter((g) => {
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        (g.standingCrewName ?? '').toLowerCase().includes(q) ||
        (g.standingCrewDescription ?? '').toLowerCase().includes(q) ||
        (g.badgeNumber ?? '').toLowerCase().includes(q)
      );
    });
  }, [standingCrewLeads, search]);

  const pendingLeadRequests = useMemo(
    () => getActionableCrewLeadRequests(crewJoinRequests, guards, standingCrewMembers),
    [crewJoinRequests, guards, standingCrewMembers]
  );

  const { showDetailOnly: showJobDetailOnly } = useSplitListDetail(selectedJobId, 'page');
  const { showDetailOnly: showStandingDetailOnly } = useSplitListDetail(selectedStandingLeadId, 'page');

  function renderCrewDetail(crew: StaffCrewListing, job: SecurityRequest, options?: { onBack?: () => void }) {
    const coordinator = crew.coordinatorId ? guards.find((g) => g.id === crew.coordinatorId) : undefined;

    return (
      <div className="space-y-4">
        {options?.onBack && (
          <AppButton variant="outline" size="sm" className="lg:hidden" onClick={options.onBack}>
            Back to crews
          </AppButton>
        )}

        <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-4 py-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-bold text-brand-text">{crew.crewName}</h2>
              {crew.crewDescription && (
                <p className="text-sm text-brand-text-muted leading-relaxed whitespace-pre-wrap">
                  {crew.crewDescription}
                </p>
              )}
            </div>
            <WfBadge tone={PHASE_TONE[crew.phase]}>{PHASE_LABEL[crew.phase]}</WfBadge>
          </div>

          <div className="text-sm space-y-1.5 text-brand-text-muted">
            <p className="font-semibold text-brand-text">{crew.jobTitle}</p>
            <p>{formatShiftRange(job.startDate, job.endDate)}</p>
            <p>{crew.location}</p>
            <p>
              Client: {crew.clientName} · {crew.memberCount}/{crew.guardsNeeded} on roster
              {crew.openSlots > 0 ? ` · ${crew.openSlots} open slot${crew.openSlots === 1 ? '' : 's'}` : ''}
            </p>
          </div>

          {coordinator && (
            <div className="flex items-center gap-2 pt-1">
              <ProfileAvatar src={coordinator.avatar} name={coordinator.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-brand-text">{coordinator.name}</p>
                <p className="text-xs text-brand-text-muted">Crew coordinator</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {onOpenJob && (
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => onOpenJob(job.id)}
                startEnhancer={<Briefcase className="w-3.5 h-3.5" />}
              >
                Open job
              </AppButton>
            )}
            {onOpenMessages && (
              <AppButton
                variant="outline"
                size="sm"
                onClick={onOpenMessages}
                startEnhancer={<MessageCircle className="w-3.5 h-3.5" />}
              >
                Crew chat in Messages
              </AppButton>
            )}
          </div>
        </div>

        <JobTeamRoster
          job={job}
          guards={guards}
          variant="staff"
          onStaffApproveSlot={
            canManage && onApproveCrewMember
              ? (guardId) => onApproveCrewMember(job.id, guardId)
              : undefined
          }
          onStaffDenySlot={
            canManage && onDenyCrewMember ? (guardId) => onDenyCrewMember(job.id, guardId) : undefined
          }
          onStaffRemoveFromCrew={
            canManage && onRemoveCrewMember
              ? (guardId) => onRemoveCrewMember(job.id, guardId)
              : undefined
          }
        />
      </div>
    );
  }

  const toolbar = (
    <>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => { setView('standing'); setSearch(''); }}
          className={`app-chip ${view === 'standing' ? 'app-chip-active' : ''}`}
        >
          <Users className="w-3.5 h-3.5" />
          Standing crews
          {standingCrewLeads.length > 0 && (
            <span className="ml-1.5 inline-flex min-w-[1.125rem] h-[1.125rem] items-center justify-center rounded-full bg-brand-primary/15 text-[10px] font-bold text-brand-primary">
              {standingCrewLeads.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => { setView('job'); setSearch(''); }}
          className={`app-chip ${view === 'job' ? 'app-chip-active' : ''}`}
        >
          <Shield className="w-3.5 h-3.5" />
          Job crews
          {listings.some((c) => c.phase === 'needs_review') && (
            <span className="ml-1.5 inline-flex min-w-[1.125rem] h-[1.125rem] items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
              {listings.filter((c) => c.phase === 'needs_review').length}
            </span>
          )}
        </button>
      </div>
      {view === 'standing' && !showStandingDetailOnly ? (
        <WfSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, crew name, badge..."
          className="max-w-md"
        />
      ) : null}
      {view === 'job' && !showJobDetailOnly ? (
        <>
          <WfSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search crews, coordinators, clients, jobs..."
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`app-chip ${filter === opt.id ? 'app-chip-active' : ''}`}
              >
                {opt.label}
                {opt.id === 'needs_review' && listings.some((c) => c.phase === 'needs_review') && (
                  <span className="ml-1.5 inline-flex min-w-[1.125rem] h-[1.125rem] items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                    {listings.filter((c) => c.phase === 'needs_review').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </>
  );

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-crews-panel">

      {/* ── Standing crews view ── */}
      {view === 'standing' && (
        <>
          {pendingLeadRequests.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-brand-text">Crew lead requests</h2>
                <WfBadge tone="warning">{pendingLeadRequests.length} pending</WfBadge>
              </div>
              <div className="space-y-2">
                {pendingLeadRequests.map((request) => {
                  const requester = guards.find((g) => g.id === request.guardId);
                  if (!requester) return null;
                  return (
                    <div
                      key={request.id}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <ProfileAvatar src={requester.avatar} name={requester.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-brand-text">{requester.name}</p>
                          <p className="text-xs text-brand-text-muted">
                            Trusted guard · wants to lead their own crew
                            {requester.badgeNumber ? ` · Badge ${requester.badgeNumber}` : ''}
                          </p>
                          {request.message && (
                            <p className="text-sm text-brand-text-muted mt-2 leading-relaxed whitespace-pre-wrap">
                              {request.message}
                            </p>
                          )}
                          <p className="text-xs text-brand-text-muted mt-1">
                            Requested {new Date(request.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {canManage && (onApproveCrewLeadRequest || onDeclineCrewLeadRequest) && (
                        <div className="flex flex-wrap gap-2">
                          {onApproveCrewLeadRequest && (
                            <AppButton
                              variant="primary"
                              size="sm"
                              disabled={resolvingRequestId === request.id}
                              onClick={async () => {
                                setResolvingRequestId(request.id);
                                try {
                                  await onApproveCrewLeadRequest(request.id);
                                } finally {
                                  setResolvingRequestId(null);
                                }
                              }}
                            >
                              {resolvingRequestId === request.id ? 'Approving…' : 'Make crew lead'}
                            </AppButton>
                          )}
                          {onDeclineCrewLeadRequest && (
                            <AppButton
                              variant="danger"
                              size="sm"
                              disabled={resolvingRequestId === request.id}
                              onClick={async () => {
                                setResolvingRequestId(request.id);
                                try {
                                  await onDeclineCrewLeadRequest(request.id);
                                } finally {
                                  setResolvingRequestId(null);
                                }
                              }}
                            >
                              Decline
                            </AppButton>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {filteredStanding.length === 0 ? (
            <div className="app-empty-state app-empty-state--dashed">
              <div className="app-empty-state-icon">
                <Users className="w-5 h-5" />
              </div>
              <p className="app-empty-state-title">
                {standingCrewLeads.length === 0 ? 'No standing crews yet' : 'No matches'}
              </p>
              <p className="app-empty-state-body">
                {standingCrewLeads.length === 0
                  ? 'Standing crews appear here once a trusted guard is set up as a crew lead. Approve crew lead requests above or use Make crew lead on a guard profile.'
                  : 'No standing crews match your search.'}
              </p>
            </div>
          ) : (
            <ListDetailLayout
              items={filteredStanding}
              selectedId={selectedStandingLeadId}
              onSelectId={setSelectedStandingLeadId}
              getItemId={(g) => g.id}
              listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
              mobilePresentation="page"
              renderItem={(guard, isActive, onSelect) => {
                const activeMembers = getActiveStandingCrewMembers(standingCrewMembers, guard.id);
                const pendingMembers = getPendingStandingCrewOutgoing(standingCrewMembers, guard.id);
                return (
                  <WfListCard
                    onClick={onSelect}
                    className={isActive ? 'app-item-card-selected' : ''}
                    avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="sm" />}
                    title={guard.standingCrewName || `${guard.name}'s crew`}
                    subtitle={guard.name + (guard.badgeNumber ? ` · ${guard.badgeNumber}` : '')}
                    meta={
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-brand-text-muted">
                          {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
                          {pendingMembers.length > 0 ? ` · ${pendingMembers.length} pending` : ''}
                        </span>
                        <WfBadge tone="primary">Trusted guard</WfBadge>
                      </div>
                    }
                  />
                );
              }}
              renderDetail={(lead, options) => {
                const activeMembers = getActiveStandingCrewMembers(standingCrewMembers, lead.id);
                const pendingMembers = getPendingStandingCrewOutgoing(standingCrewMembers, lead.id);
                const allCrewMembers = [...activeMembers, ...pendingMembers];
                return (
                  <div className="space-y-4">
                    {options?.onBack && (
                      <AppButton variant="outline" size="sm" className="lg:hidden" onClick={options.onBack}>
                        Back to crews
                      </AppButton>
                    )}

                    {/* Lead profile */}
                    <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-4 py-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar src={lead.avatar} name={lead.name} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-brand-text">{lead.name}</h2>
                            <WfBadge tone="primary">Crew lead · Trusted</WfBadge>
                          </div>
                          <p className="text-sm text-brand-text-muted">
                            {lead.badgeNumber ? `Badge ${lead.badgeNumber}` : 'Guard'}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-brand-border pt-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1">Team name</p>
                        <p className="text-sm font-semibold text-brand-text">
                          {lead.standingCrewName || <span className="text-brand-text-muted italic">Not set</span>}
                        </p>
                      </div>

                      {lead.standingCrewDescription && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1">Description</p>
                          <p className="text-sm text-brand-text-muted leading-relaxed whitespace-pre-wrap">
                            {lead.standingCrewDescription}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Crew members */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-brand-text">
                        Crew members ({activeMembers.length} active
                        {pendingMembers.length > 0 ? `, ${pendingMembers.length} pending invite` : ''})
                      </h3>

                      {allCrewMembers.length === 0 ? (
                        <div className="app-empty-state app-empty-state--dashed py-6">
                          <p className="text-sm text-brand-text-muted">
                            No crew members yet. This guard can invite others from their Crew hub.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-brand-border border border-brand-border rounded-lg overflow-hidden">
                          {allCrewMembers.map((member) => {
                            const memberGuard = guards.find((g) => g.id === member.memberGuardId);
                            if (!memberGuard) return null;
                            return (
                              <div key={member.id} className="flex items-center gap-3 px-4 py-3 bg-brand-surface">
                                <ProfileAvatar src={memberGuard.avatar} name={memberGuard.name} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-brand-text truncate">{memberGuard.name}</p>
                                  <p className="text-xs text-brand-text-muted">
                                    {memberGuard.badgeNumber ? `Badge ${memberGuard.badgeNumber}` : 'Guard'}
                                  </p>
                                </div>
                                <WfBadge tone={member.status === 'active' ? 'success' : 'warning'}>
                                  {member.status === 'active' ? 'Active' : 'Pending'}
                                </WfBadge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          )}
        </>
      )}

      {/* ── Job crews view ── */}
      {view === 'job' && (
        <>
          {filtered.length === 0 ? (
            <div className="app-empty-state app-empty-state--dashed">
              <div className="app-empty-state-icon">
                <Shield className="w-5 h-5" />
              </div>
              <p className="app-empty-state-title">No coordinated crews right now</p>
              <p className="app-empty-state-body">
                {listings.length === 0
                  ? 'Multi-guard jobs with an active crew coordinator will appear here.'
                  : 'No crews match your search or filter.'}
              </p>
            </div>
          ) : (
            <ListDetailLayout
              items={filtered}
              selectedId={selectedJobId}
              onSelectId={setSelectedJobId}
              getItemId={(crew) => crew.jobId}
              listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
              mobilePresentation="page"
              renderItem={(crew, isActive, onSelect) => (
                <WfListCard
                  onClick={onSelect}
                  className={isActive ? 'app-item-card-selected' : ''}
                  title={crew.crewName}
                  subtitle={`${crew.jobTitle} · ${crew.clientName}`}
                  meta={
                    <div className="flex items-center justify-between gap-3">
                      <span>
                        {crew.coordinatorName} · {crew.memberCount}/{crew.guardsNeeded} guards
                        {crew.pendingStaffCount > 0
                          ? ` · ${crew.pendingStaffCount} awaiting review`
                          : ''}
                      </span>
                      <WfBadge tone={PHASE_TONE[crew.phase]}>{PHASE_LABEL[crew.phase]}</WfBadge>
                    </div>
                  }
                />
              )}
              renderDetail={(crew, options) => {
                const job = requests.find((r) => r.id === crew.jobId);
                if (!job) return null;
                return renderCrewDetail(crew, job, options);
              }}
            />
          )}
        </>
      )}
    </StaffOpsPageShell>
  );
}
