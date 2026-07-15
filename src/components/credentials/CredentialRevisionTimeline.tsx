import React, { useState } from 'react';
import type { Certification } from '../../types';
import { getCertificationRevisionTimeline } from '../../lib/certRevisionHistory';
import { formatStateName } from '../../lib/states';
import { WfBadge } from '../ui/wireframe';

function formatRevisionDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusTone(status: 'verified' | 'pending' | 'rejected'): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'verified') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

interface CredentialRevisionTimelineProps {
  cert: Certification;
}

export function CredentialRevisionTimeline({ cert }: CredentialRevisionTimelineProps) {
  const items = getCertificationRevisionTimeline(cert);
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);

  if (items.length <= 1 && !items[0]?.imageUrl) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-brand-text">Update history</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Newest first. Verified copies stay on file until a replacement is approved.
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const expanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-brand-border bg-brand-bg-sec/40 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : item.id)}
                className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-brand-bg-sec/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-brand-text">{item.label}</p>
                    <WfBadge tone={statusTone(item.status)}>{item.status}</WfBadge>
                    {item.isCurrentOnFile && (
                      <WfBadge tone="primary">On file</WfBadge>
                    )}
                    {item.isPendingReview && (
                      <WfBadge tone="warning">Awaiting review</WfBadge>
                    )}
                  </div>
                  <p className="text-xs text-brand-text-muted mt-1">{formatRevisionDate(item.recordedAt)}</p>
                  {item.number && (
                    <p className="text-xs text-brand-text-muted mt-1 font-mono">#{item.number}</p>
                  )}
                </div>
              </button>
              {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-brand-border">
                  {item.note && (
                    <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
                      {item.note}
                    </p>
                  )}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={`${item.label} document`}
                      className="w-full max-h-56 object-contain rounded-lg border border-brand-border bg-brand-bg-sec"
                    />
                  ) : (
                    <p className="text-xs text-brand-text-muted">No document image for this entry.</p>
                  )}
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {item.issuer && (
                      <div>
                        <dt className="text-xs text-brand-text-muted">Issuer</dt>
                        <dd className="font-medium mt-0.5">{item.issuer}</dd>
                      </div>
                    )}
                    {item.state && (
                      <div>
                        <dt className="text-xs text-brand-text-muted">State</dt>
                        <dd className="font-medium mt-0.5">{formatStateName(item.state)}</dd>
                      </div>
                    )}
                    {item.expiryDate && (
                      <div>
                        <dt className="text-xs text-brand-text-muted">Expiration</dt>
                        <dd className="font-medium mt-0.5">
                          {new Date(`${item.expiryDate}T12:00:00`).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
