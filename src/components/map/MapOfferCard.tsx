import React from 'react';
import { SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { JOB_TYPE_LABELS } from '../../lib/guardJobs';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { formatRouteEta, MapRouteSummary } from '../../lib/mapRouting';
import { WfBadge } from '../ui/wireframe';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { Clock, MapPin, Navigation, X } from 'lucide-react';

type MapOfferJob = GuardJobView | SecurityRequest;

export type MapViewerRole = 'guard' | 'client' | 'staff';

function hourlyDisplay(job: MapOfferJob, role: MapViewerRole): number {
  if (role === 'staff' && 'hourlyRate' in job) return (job as SecurityRequest).hourlyRate;
  return 'guardPay' in job ? job.guardPay : (job as SecurityRequest).hourlyRate;
}

interface MapOfferCardProps {
  job: MapOfferJob;
  role: MapViewerRole;
  route: MapRouteSummary | null;
  loadingRoute?: boolean;
  expanded?: boolean;
  onClose: () => void;
  onExpand?: () => void;
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  children?: React.ReactNode;
}

export function MapOfferCard({
  job,
  role,
  route,
  loadingRoute,
  expanded = false,
  onClose,
  onExpand,
  onPrimaryAction,
  primaryLabel,
  children,
}: MapOfferCardProps) {
  const pay = hourlyDisplay(job, role);
  const clientName = 'clientName' in job ? job.clientName : '';

  return (
    <div className={`map-offer-card ${expanded ? 'map-offer-card-expanded' : ''}`}>
      <div className="map-offer-card-handle" aria-hidden />
      <div className="map-offer-card-header">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 mb-1">
            <WfBadge tone="default">{JOB_TYPE_LABELS[job.type]}</WfBadge>
            {job.armedRequired && <WfBadge tone="warning">Armed</WfBadge>}
            {'requestType' in job && job.requestType === 'direct' && (
              <WfBadge tone="primary">Direct</WfBadge>
            )}
          </div>
          <p className="font-semibold text-sm leading-snug truncate">{job.title}</p>
          <p className="text-xs text-brand-text-muted mt-0.5 truncate">
            {clientName || job.siteName || job.location}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="map-offer-card-close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="map-offer-card-stats">
        <span className="map-offer-card-pay">${pay}/hr</span>
        {loadingRoute ? (
          <span className="text-xs text-brand-text-muted">Calculating route…</span>
        ) : route ? (
          <span className="map-offer-card-route">
            <Navigation className="w-3.5 h-3.5" />
            {route.distanceMiles} mi · {formatRouteEta(route.durationMinutes)}
          </span>
        ) : (
          <span className="text-xs text-brand-text-muted flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {job.siteName || job.location}
          </span>
        )}
      </div>

      <div className="map-offer-card-meta text-xs text-brand-text-muted flex flex-wrap gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-brand-primary" />
          {formatShiftRange(job.startDate, job.endDate)}
        </span>
        <span>{formatDuration(job.durationHours)}</span>
      </div>

      {job.description && !expanded && (
        <p className="text-xs text-brand-text-muted line-clamp-2 mt-2 border-l-2 border-brand-primary pl-2">
          {job.description}
        </p>
      )}

      {expanded && children}

      <div className="map-offer-card-actions">
        {!expanded && onExpand && (
          <button type="button" onClick={onExpand} className="app-button-outline !h-9 !text-xs flex-1">
            View full listing
          </button>
        )}
        {onPrimaryAction && primaryLabel && (
          <SlideToConfirm
            label={primaryLabel}
            onConfirm={onPrimaryAction}
            compact
            className={!expanded && onExpand ? 'min-w-[58%]' : 'w-full'}
          />
        )}
      </div>
    </div>
  );
}
