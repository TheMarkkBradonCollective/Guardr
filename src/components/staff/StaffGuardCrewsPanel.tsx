import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  getStaffCrewListings,
  type StaffCrewListing,
  type StaffCrewPhase,
} from '../../lib/guardTeams';
import { formatShiftRange } from '../../lib/dates';
import { JobTeamRoster } from '../jobs/JobTeamRoster';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { Briefcase, MessageCircle, UsersRound } from 'lucide-react';

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

interface StaffGuardCrewsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  canManage?: boolean;
  selectedJobId?: string | null;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  initialSelectedJobId?: string | null;
  onOpenJob?: (jobId: string) => void;
  onOpenMessages?: () => void;
  onApproveCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onRemoveCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
}

export function StaffGuardCrewsPanel({
  requests,
  guards,
  canManage = false,
  selectedJobId: controlledSelectedJobId,
  onSelectedJobIdChange,
  initialSelectedJobId = null,
  onOpenJob,
  onOpenMessages,
  onApproveCrewMember,
  onDenyCrewMember,
  onRemoveCrewMember,
}: StaffGuardCrewsPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CrewFilter>('all');
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

  const { showDetailOnly } = useSplitListDetail(selectedJobId, 'page');

  function renderCrewDetail(crew: StaffCrewListing, job: SecurityRequest, options?: { onBack?: () => void }) {
    const coordinator = crew.coordinatorId ? guards.find((g) => g.id === crew.coordinatorId) : undefined;

    return (
      <div className="space-y-4">
        {options?.onBack && (
          <button type="button" onClick={options.onBack} className="app-button-outline app-btn-sm lg:hidden">
            Back to teams
          </button>
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
              <button
                type="button"
                onClick={() => onOpenJob(job.id)}
                className="app-button-outline app-btn-sm inline-flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Open job
              </button>
            )}
            {onOpenMessages && (
              <button
                type="button"
                onClick={onOpenMessages}
                className="app-button-outline app-btn-sm inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Crew chat in Messages
              </button>
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

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <p className="text-sm text-brand-text-muted leading-relaxed max-w-2xl">
            Coordinated guard crews across open and active multi-guard jobs. Review roster members, approve crew
            slots, and open crew chat from Messages.
          </p>

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
      )}

      {filtered.length === 0 ? (
        <div className="app-empty-state app-empty-state--dashed">
          <div className="app-empty-state-icon">
            {/* UsersRound */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
    </div>
  );
}
