import React from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { MapRouteSummary, formatRouteEta } from '../../lib/mapRouting';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { jobStatusBadgeTone } from '../../lib/jobStatusBadges';
import {
  formatJobDate,
  formatJobTimeRange,
  getEstimatedGuardEarnings,
  getGuardHourlyPay,
  getJobDistance,
  JOB_TYPE_LABELS,
} from '../../lib/guardJobs';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { formatCityLabel } from '../../lib/californiaCities';
import { clientMapPinKind, guardMapPinKind } from '../../lib/mapJobVisibility';
import { clientPaymentStatusHint } from '../../lib/paymentDisplay';
import { getLiveJobStatus, LIVE_JOB_STATUS_LABEL } from '../../lib/staffOps';
import { isJobLocationCoordsMissing } from '../../lib/jobLocation';
import { isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { isNoSpotCheckFlagged } from '../../lib/spotChecks';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { WfBadge } from '../ui/wireframe';
import { NoMapCoordsBadge } from '../jobs/NoMapCoordsBadge';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import { NoSpotCheckBadge } from '../jobs/NoSpotCheckBadge';
import { Clock, MapPin, Navigation } from 'lucide-react';
import type { MapViewerRole } from './MapOfferCard';

type MapPeekJob = GuardJobView | SecurityRequest;

const CLIENT_PIN_LABELS: Record<NonNullable<ReturnType<typeof clientMapPinKind>>, string> = {
  open: 'Open',
  pending: 'Pending',
  upcoming: 'Upcoming',
  live: 'Live',
  past: 'Past',
  cancelled: 'Canceled',
};

const GUARD_PIN_LABELS: Record<NonNullable<ReturnType<typeof guardMapPinKind>>, string> = {
  available: 'Available',
  scheduled: 'Upcoming',
  past: 'Past',
};

function hourlyRate(job: MapPeekJob, role: MapViewerRole): number {
  if (role === 'guard' && 'guardPay' in job) return job.guardPay;
  return (job as SecurityRequest).hourlyRate;
}

function GuardPeek({ job, guardId, route, loadingRoute }: {
  job: GuardJobView;
  guardId: string;
  route: MapRouteSummary | null;
  loadingRoute?: boolean;
}) {
  const distance = getJobDistance(job);
  const hourlyPay = getGuardHourlyPay(job);
  const estimated = getEstimatedGuardEarnings(job);
  const pinKind = guardMapPinKind(guardId, job as unknown as SecurityRequest);
  const isUpcoming = job.status === 'accepted';
  const isDirectRequest = job.requestType === 'direct';

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap gap-1.5">
        <WfBadge tone={job.status === 'open' ? 'primary' : 'default'}>
          {JOB_STATUS_LABELS[job.status]}
        </WfBadge>
        {pinKind && <WfBadge tone="default">{GUARD_PIN_LABELS[pinKind]}</WfBadge>}
        {isUpcoming && <WfBadge tone="primary">Upcoming</WfBadge>}
        {isDirectRequest && job.status === 'open' && (
          <WfBadge tone="warning">Direct</WfBadge>
        )}
        <WfBadge tone="default">{JOB_TYPE_LABELS[job.type]}</WfBadge>
        {job.armedRequired && <WfBadge tone="warning">Armed</WfBadge>}
      </div>
      <p className="font-bold text-sm leading-snug tracking-tight">{job.title}</p>
      <p className="text-xs text-brand-text-muted truncate">{job.clientName}</p>
      <p className="text-xs text-brand-text-muted flex items-center gap-1">
        <MapPin className="w-3 h-3 shrink-0" />
        {job.siteName || job.location}
        {distance != null ? ` · ${distance} mi` : ''}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="text-xs text-brand-text-muted space-y-0.5">
          <p className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand-primary" />
            {formatJobDate(job)} · {formatJobTimeRange(job)}
          </p>
          <p>{formatDuration(job.durationHours)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-brand-primary tracking-tight">${hourlyPay}/hr</p>
          <p className="text-xs text-brand-text-muted">${estimated} est.</p>
        </div>
      </div>
      {(loadingRoute || route) && (
        <p className="text-xs text-brand-text-muted flex items-center gap-1">
          {loadingRoute ? (
            'Calculating route…'
          ) : route ? (
            <>
              <Navigation className="w-3 h-3" />
              {route.distanceMiles} mi · {formatRouteEta(route.durationMinutes)}
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}

function ClientPeek({ job, route, loadingRoute }: {
  job: SecurityRequest;
  route: MapRouteSummary | null;
  loadingRoute?: boolean;
}) {
  const pinKind = clientMapPinKind(job);
  const paymentHint = clientPaymentStatusHint(job.paymentStatus, job.status, job);

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap gap-1.5">
        <WfBadge tone={jobStatusBadgeTone(job.status)}>{JOB_STATUS_LABELS[job.status]}</WfBadge>
        {pinKind && <WfBadge tone="default">{CLIENT_PIN_LABELS[pinKind]}</WfBadge>}
        <WfBadge tone="default">{JOB_TYPE_LABELS[job.type]}</WfBadge>
        {job.armedRequired && <WfBadge tone="warning">Armed</WfBadge>}
        {job.requestType === 'direct' && <WfBadge tone="primary">Direct</WfBadge>}
      </div>
      <p className="font-bold text-sm leading-snug tracking-tight">{job.title}</p>
      <p className="text-xs text-brand-text-muted truncate">
        {formatCityLabel(job.state) || job.siteName || job.address || job.location}
      </p>
      <p className="text-xs text-brand-text-muted inline-flex items-center gap-1">
        <Clock className="w-3 h-3 text-brand-primary" />
        {formatShiftRange(job.startDate, job.endDate)} · {formatDuration(job.durationHours)}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-black text-brand-primary tracking-tight">${job.hourlyRate}/hr</p>
        {paymentHint && (
          <p className="text-xs text-brand-text-muted text-right max-w-[55%]">{paymentHint}</p>
        )}
      </div>
      {(loadingRoute || route) && (
        <p className="text-xs text-brand-text-muted flex items-center gap-1">
          {loadingRoute ? (
            'Calculating route…'
          ) : route ? (
            <>
              <Navigation className="w-3 h-3" />
              {route.distanceMiles} mi · {formatRouteEta(route.durationMinutes)}
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3" />
              {job.siteName || job.location}
            </>
          )}
        </p>
      )}
    </div>
  );
}

function StaffPeek({ job, guards }: { job: SecurityRequest; guards: SecurityGuard[] }) {
  const jobStatus = getLiveJobStatus(job);
  const statusCfg = LIVE_JOB_STATUS_LABEL[jobStatus];
  const requestStatusLabel = JOB_STATUS_LABELS[job.status];
  const showLiveBadge = jobStatus === 'incident-flagged' || statusCfg.label !== requestStatusLabel;
  const assigned = guards.find((g) => g.id === job.assignedGuardId);
  const awaitingClientGuard = isAwaitingClientGuardApproval(job);
  const guardLine = assigned
    ? `Guard: ${assigned.name}`
    : job.status === 'open' && job.applicants.length > 0
      ? `${job.applicants.length} applicant${job.applicants.length === 1 ? '' : 's'}`
      : awaitingClientGuard
        ? 'Awaiting client approval'
        : 'No guard yet';

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap gap-1.5">
        {showLiveBadge && (
          <WfBadge tone="primary">
            {statusCfg.emoji} {statusCfg.label}
          </WfBadge>
        )}
        <WfBadge tone={jobStatusBadgeTone(job.status)}>{requestStatusLabel}</WfBadge>
        {isNoSelfAuditFlagged(job) && <NoSelfAuditBadge />}
        {isNoSpotCheckFlagged(job) && <NoSpotCheckBadge />}
        {isJobLocationCoordsMissing(job) && <NoMapCoordsBadge />}
      </div>
      <p className="font-bold text-sm leading-snug tracking-tight">{job.title}</p>
      <p className="text-xs text-brand-text-muted truncate">
        {job.clientName} · {formatCityLabel(job.state) || job.location}
      </p>
      <p className="text-xs text-brand-text-muted inline-flex items-center gap-1">
        <Clock className="w-3 h-3 text-brand-primary" />
        {formatShiftRange(job.startDate, job.endDate)}
      </p>
      <p className="text-xs text-brand-text-muted">{guardLine}</p>
      <p className="text-[10px] text-brand-text-muted font-mono truncate">{job.id}</p>
    </div>
  );
}

export interface MapJobPeekSummaryProps {
  role: MapViewerRole;
  job: MapPeekJob;
  route?: MapRouteSummary | null;
  loadingRoute?: boolean;
  guardId?: string;
  guards?: SecurityGuard[];
}

/** Compact job summary for map cards — mirrors each role's jobs list row. */
export function MapJobPeekSummary({
  role,
  job,
  route = null,
  loadingRoute,
  guardId,
  guards = [],
}: MapJobPeekSummaryProps) {
  if (role === 'guard' && guardId) {
    return (
      <GuardPeek
        job={job as GuardJobView}
        guardId={guardId}
        route={route}
        loadingRoute={loadingRoute}
      />
    );
  }
  if (role === 'staff') {
    return <StaffPeek job={job as SecurityRequest} guards={guards} />;
  }
  return (
    <ClientPeek
      job={job as SecurityRequest}
      route={route}
      loadingRoute={loadingRoute}
    />
  );
}
