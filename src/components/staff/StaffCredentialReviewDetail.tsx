import React, { useState } from 'react';
import type { ApprovalFeedItem } from '../../lib/staffApprovalsFeed';
import { formatApprovalTimestamp } from '../../lib/staffApprovalsFeed';
import type { CredentialRecordDisplayItem } from '../../lib/credentialRecords';
import { credentialRecordImages } from '../../lib/credentialRecords';
import { DocumentImageLightbox } from '../credentials/DocumentImageLightbox';

export interface StaffCredentialReviewField {
  label: string;
  value: string;
}

export interface StaffCredentialReviewPhoto {
  url: string;
  label: string;
  alt: string;
}

interface StaffCredentialReviewDetailProps {
  guardName?: string;
  feedItem?: ApprovalFeedItem;
  onOpenGuardProfile?: () => void;
  actions?: React.ReactNode;
  kicker: string;
  title: string;
  badges?: React.ReactNode;
  fields: StaffCredentialReviewField[];
  note?: string;
  footnote?: string;
  primaryPhoto?: StaffCredentialReviewPhoto;
  additionalPhotos?: StaffCredentialReviewPhoto[];
  history?: CredentialRecordDisplayItem[];
  ariaLabel: string;
}

/** Guardr-style staff credential review — flat on-page detail + history list. */
export function StaffCredentialReviewDetail({
  guardName,
  feedItem,
  onOpenGuardProfile,
  actions,
  kicker,
  title,
  badges,
  fields,
  note,
  footnote,
  primaryPhoto,
  additionalPhotos = [],
  history = [],
  ariaLabel,
}: StaffCredentialReviewDetailProps) {
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);

  const openLightbox = (url: string, alt: string) => {
    setLightbox({ url, alt });
  };

  const historyThumb = (item: CredentialRecordDisplayItem): string | undefined => {
    return item.thumbnailUrl ?? item.images?.[0]?.url;
  };

  const openHistoryItem = (item: CredentialRecordDisplayItem) => {
    const images = credentialRecordImages(item);
    const first = images[0];
    if (first) {
      openLightbox(first.url, first.label);
    }
  };

  return (
    <section className="staff-cert-uber" aria-label={ariaLabel}>
      <header className="staff-cert-uber-page-lead">
        {guardName ? <p className="staff-cert-uber-guard-name">{guardName}</p> : null}
        <p className="staff-cert-uber-kicker">{kicker}</p>
        <h2 className="staff-cert-uber-title">{title}</h2>
        {badges ? <div className="staff-cert-uber-badges">{badges}</div> : null}
      </header>

      {feedItem ? (
        <dl className="staff-cert-uber-review-meta">
          <div>
            <dt>Status</dt>
            <dd>{feedItem.statusLabel}</dd>
          </div>
          {feedItem.submittedAt ? (
            <div>
              <dt>Submitted</dt>
              <dd>{formatApprovalTimestamp(feedItem.submittedAt)}</dd>
            </div>
          ) : null}
          {feedItem.reviewedAt ? (
            <div>
              <dt>Reviewed</dt>
              <dd>{formatApprovalTimestamp(feedItem.reviewedAt)}</dd>
            </div>
          ) : null}
          {feedItem.reviewedByName || feedItem.reviewedByEmail ? (
            <div>
              <dt>By</dt>
              <dd>{feedItem.reviewedByName || feedItem.reviewedByEmail}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {onOpenGuardProfile ? (
        <button type="button" onClick={onOpenGuardProfile} className="staff-cert-uber-profile-link">
          View full guard profile →
        </button>
      ) : null}

      {fields.length > 0 ? (
        <dl className="staff-cert-uber-fields">
          {fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {note ? <p className="staff-cert-uber-note">{note}</p> : null}
      {footnote ? <p className="staff-cert-uber-footnote">{footnote}</p> : null}

      {primaryPhoto ? (
        <button
          type="button"
          className="staff-cert-uber-photo"
          onClick={() => openLightbox(primaryPhoto.url, primaryPhoto.alt)}
          aria-label={`View full screen ${primaryPhoto.label}`}
        >
          <img src={primaryPhoto.url} alt={primaryPhoto.alt} />
          <span className="staff-cert-uber-photo-hint">View full screen</span>
        </button>
      ) : additionalPhotos.length === 0 ? (
        <p className="staff-cert-uber-empty-photo">No document photo uploaded.</p>
      ) : null}

      {additionalPhotos.length > 0 ? (
        <div className="staff-cert-uber-photo-grid">
          {additionalPhotos.map((photo) => (
            <button
              key={photo.label}
              type="button"
              className="staff-cert-uber-photo staff-cert-uber-photo--grid"
              onClick={() => openLightbox(photo.url, photo.alt)}
              aria-label={`View full screen ${photo.label}`}
            >
              <img src={photo.url} alt={photo.alt} />
              <span className="staff-cert-uber-photo-hint">{photo.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {actions ? <div className="staff-cert-uber-actions">{actions}</div> : null}

      {history.length > 0 ? (
        <section className="staff-cert-uber-history" aria-label="Credential history">
          <h3 className="staff-cert-uber-history-title">History</h3>
          <ul className="staff-cert-uber-history-list">
            {history.map((item) => {
              const thumb = historyThumb(item);
              const clickable = Boolean(thumb);
              return (
                <li key={item.id} className="staff-cert-uber-history-row">
                  {thumb ? (
                    <button
                      type="button"
                      className="staff-cert-uber-history-thumb"
                      onClick={() => openHistoryItem(item)}
                      aria-label={`View full screen document from ${item.label}`}
                    >
                      <img src={thumb} alt="" />
                    </button>
                  ) : (
                    <div className="staff-cert-uber-history-thumb staff-cert-uber-history-thumb--empty" aria-hidden />
                  )}
                  {clickable ? (
                    <button
                      type="button"
                      className="staff-cert-uber-history-copy staff-cert-uber-history-copy--button"
                      onClick={() => openHistoryItem(item)}
                    >
                      <p className="staff-cert-uber-history-date">{item.label}</p>
                      {item.number ? <p className="staff-cert-uber-history-number">#{item.number}</p> : null}
                    </button>
                  ) : (
                    <div className="staff-cert-uber-history-copy">
                      <p className="staff-cert-uber-history-date">{item.label}</p>
                      {item.number ? <p className="staff-cert-uber-history-number">#{item.number}</p> : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {lightbox ? (
        <DocumentImageLightbox
          open
          imageUrl={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
          fullscreen
        />
      ) : null}
    </section>
  );
}
