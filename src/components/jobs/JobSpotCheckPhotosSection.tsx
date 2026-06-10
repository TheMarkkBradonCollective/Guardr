import React from 'react';
import { SecurityRequest } from '../../types';
import { hasSpotChecks, isNoSpotCheckFlagged, isSpotCheckClientConfirmed, sortedSpotChecks } from '../../lib/spotChecks';
import { NoSpotCheckBadge } from './NoSpotCheckBadge';
import { MapPin } from 'lucide-react';

export function JobSpotCheckPhotosSection({ request }: { request: SecurityRequest }) {
  if (!hasSpotChecks(request) && !isNoSpotCheckFlagged(request)) return null;

  const history = sortedSpotChecks(request);
  const flagged = isNoSpotCheckFlagged(request);

  return (
    <div className="pt-2 border-t border-brand-border space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-brand-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Staff spot checks</p>
        {flagged && <NoSpotCheckBadge />}
      </div>
      {history.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {history.map((check) => (
            <div key={check.id}>
              <img
                src={check.imageUrl}
                alt="Spot check"
                className="w-full h-24 object-cover rounded-lg border border-brand-border"
              />
              <p className="text-[10px] text-brand-text-muted mt-1">
                {check.uploadedBy} · {new Date(check.uploadedAt).toLocaleString()}
              </p>
              {isSpotCheckClientConfirmed(check) ? (
                <p className="text-[10px] text-emerald-400/90 mt-0.5">
                  Client confirmed {check.clientConfirmedAt ? new Date(check.clientConfirmedAt).toLocaleString() : ''}
                </p>
              ) : (
                <p className="text-[10px] text-amber-400/90 mt-0.5">Awaiting client confirmation</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-amber-400/90">No spot-check photo on file yet.</p>
      )}
    </div>
  );
}
