import React, { useState } from 'react';
import type { CredentialRecordDisplayItem } from '../../lib/credentialRecords';
import { credentialRecordImages, credentialRecordThumbnail } from '../../lib/credentialRecords';
import { WfBadge } from '../ui/wireframe';
import { DocumentImageLightbox, DocumentImagePreview } from './DocumentImageLightbox';

function formatRecordDate(iso: string): string {
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

function statusTone(status: CredentialRecordDisplayItem['status']): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'verified') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

interface CredentialRecordsListProps {
  items: CredentialRecordDisplayItem[];
  title?: string;
  description?: string;
}

/** Shared credential records list — certs, COI, and government ID detail views. */
export function CredentialRecordsList({
  items,
  title = 'Credential records',
  description = 'Newest first. Tap a row for details — tap any image for full size.',
}: CredentialRecordsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-xl border border-dashed border-brand-border bg-brand-bg-sec text-brand-text-muted">
        <p className="text-sm">No credential records on file</p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const expanded = expandedId === item.id;
          const thumbnail = credentialRecordThumbnail(item);
          const images = credentialRecordImages(item);

          return (
            <div
              key={item.id}
              className="rounded-xl border border-brand-border bg-brand-bg-sec overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : item.id)}
                className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-brand-bg transition-colors"
              >
                {thumbnail ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox({ url: thumbnail, alt: `${item.label} document` });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setLightbox({ url: thumbnail, alt: `${item.label} document` });
                      }
                    }}
                    className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    aria-label={`View full ${item.label} document`}
                  >
                    <img
                      src={thumbnail}
                      alt=""
                      className="w-11 h-11 rounded-lg object-cover border border-brand-border bg-brand-bg-sec cursor-zoom-in"
                    />
                  </span>
                ) : (
                  <div className="w-11 h-11 rounded-lg shrink-0 border border-dashed border-brand-border bg-brand-bg-sec" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-brand-text">{item.label}</p>
                    <WfBadge tone={statusTone(item.status)}>{item.status}</WfBadge>
                    {item.isCurrentOnFile && <WfBadge tone="primary">On file</WfBadge>}
                    {item.isPendingReview && <WfBadge tone="warning">Awaiting review</WfBadge>}
                  </div>
                  <p className="text-xs text-brand-text-muted mt-1">{formatRecordDate(item.recordedAt)}</p>
                  {item.number && (
                    <p className="text-xs text-brand-text-muted mt-1 font-mono">#{item.number}</p>
                  )}
                </div>
              </button>
              {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-brand-border">
                  {item.note && (
                    <p className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed dark:text-amber-400 dark:border-amber-900 dark:bg-amber-950">
                      {item.note}
                    </p>
                  )}
                  {images.length > 0 ? (
                    <div className={images.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}>
                      {images.map((image) => (
                        <div key={image.id} className={images.length === 3 && image.id === 'id-selfie' ? 'sm:col-span-2' : ''}>
                          {images.length > 1 && (
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-1.5">
                              {image.label}
                            </p>
                          )}
                          <DocumentImagePreview
                            imageUrl={image.url}
                            alt={image.label}
                            onOpen={() => setLightbox({ url: image.url, alt: image.label })}
                            className={
                              image.id === 'id-selfie'
                                ? 'w-full max-h-56 object-contain rounded-lg border border-brand-border bg-brand-bg-sec'
                                : 'w-full max-h-56 object-contain rounded-lg border border-brand-border bg-brand-bg-sec'
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-text-muted">No document image for this entry.</p>
                  )}
                  {item.details && item.details.length > 0 && (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {item.details.map((detail) => (
                        <div key={`${item.id}-${detail.label}`}>
                          <dt className="text-xs text-brand-text-muted">{detail.label}</dt>
                          <dd className="font-medium mt-0.5 break-words">{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {lightbox && (
        <DocumentImageLightbox
          open
          imageUrl={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
