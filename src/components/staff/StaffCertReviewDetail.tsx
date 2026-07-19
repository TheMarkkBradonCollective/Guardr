import React, { useState } from 'react';
import type { Certification } from '../../types';
import { certDisplayName } from '../../lib/certCatalog';
import { formatStateName } from '../../lib/states';
import { getCertificationArchiveHistory } from '../../lib/certRevisionHistory';
import type { ApprovalFeedItem } from '../../lib/staffApprovalsFeed';
import { formatApprovalTimestamp } from '../../lib/staffApprovalsFeed';
import { CredentialCategoryBadge } from '../credentials/CredentialCategoryBadge';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { DocumentImageLightbox } from '../credentials/DocumentImageLightbox';

function formatExpiry(iso?: string): string | null {
  if (!iso?.trim()) return null;
  const date = new Date(`${iso.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function staffCertDisplay(cert: Certification) {
  if (cert.pendingUpdate) {
    return {
      issuer: cert.pendingUpdate.issuer,
      number: cert.pendingUpdate.number,
      state: cert.pendingUpdate.state,
      expiryDate: cert.pendingUpdate.expiryDate,
      imageUrl: cert.pendingUpdate.imageUrl,
      status: cert.pendingUpdate.status,
      note: cert.pendingUpdate.rejectionReason,
      kicker: 'Update pending review',
    };
  }

  return {
    issuer: cert.issuer,
    number: cert.number,
    state: cert.state,
    expiryDate: cert.expiryDate,
    imageUrl: cert.imageUrl,
    status: cert.status,
    note: cert.rejectionReason,
    kicker: cert.status === 'verified' ? 'On file' : 'Current submission',
  };
}

interface StaffCertReviewDetailProps {
  cert: Certification;
  feedItem?: ApprovalFeedItem;
  onOpenGuardProfile?: () => void;
  actions?: React.ReactNode;
}

/** Uber-style staff credential review — flat on-page detail + history list. */
export function StaffCertReviewDetail({
  cert,
  feedItem,
  onOpenGuardProfile,
  actions,
}: StaffCertReviewDetailProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const display = staffCertDisplay(cert);
  const history = getCertificationArchiveHistory(cert);
  const title = certDisplayName(cert);
  const expiryLabel = formatExpiry(display.expiryDate);

  return (
    <section className="staff-cert-uber" aria-label={`${title} review`}>
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

      <div className="staff-cert-uber-head">
        <p className="staff-cert-uber-kicker">{display.kicker}</p>
        <h2 className="staff-cert-uber-title">{title}</h2>
        <div className="staff-cert-uber-badges">
          <CredentialCategoryBadge cert={cert} variant="category" />
          <CredentialStatusBadges cert={cert} staffMode />
        </div>
      </div>

      <dl className="staff-cert-uber-fields">
        {display.state ? (
          <div>
            <dt>State</dt>
            <dd>{formatStateName(display.state)}</dd>
          </div>
        ) : null}
        {display.issuer ? (
          <div>
            <dt>Issuing organization</dt>
            <dd>{display.issuer}</dd>
          </div>
        ) : null}
        {display.number ? (
          <div>
            <dt>License / cert number</dt>
            <dd>{display.number}</dd>
          </div>
        ) : null}
        {expiryLabel ? (
          <div>
            <dt>Expiration date</dt>
            <dd>{expiryLabel}</dd>
          </div>
        ) : null}
      </dl>

      {display.note ? <p className="staff-cert-uber-note">{display.note}</p> : null}

      {cert.pendingUpdate && cert.status === 'verified' ? (
        <p className="staff-cert-uber-footnote">
          Verified copy stays on file until you approve or reject this update.
        </p>
      ) : null}

      {display.imageUrl ? (
        <button
          type="button"
          className="staff-cert-uber-photo"
          onClick={() => setLightboxUrl(display.imageUrl!)}
          aria-label={`View full screen ${title} document`}
        >
          <img src={display.imageUrl} alt={`${title} document`} />
          <span className="staff-cert-uber-photo-hint">View full screen</span>
        </button>
      ) : (
        <p className="staff-cert-uber-empty-photo">No document photo uploaded.</p>
      )}

      {actions ? <div className="staff-cert-uber-actions">{actions}</div> : null}

      {history.length > 0 ? (
        <section className="staff-cert-uber-history" aria-label="Credential history">
          <h3 className="staff-cert-uber-history-title">History</h3>
          <ul className="staff-cert-uber-history-list">
            {history.map((item) => {
              const thumb = item.thumbnailUrl ?? item.images?.[0]?.url;
              return (
                <li key={item.id} className="staff-cert-uber-history-row">
                  {thumb ? (
                    <button
                      type="button"
                      className="staff-cert-uber-history-thumb"
                      onClick={() => setLightboxUrl(thumb)}
                      aria-label={`View full screen document from ${item.label}`}
                    >
                      <img src={thumb} alt="" />
                    </button>
                  ) : (
                    <div className="staff-cert-uber-history-thumb staff-cert-uber-history-thumb--empty" aria-hidden />
                  )}
                  <div className="staff-cert-uber-history-copy">
                    <p className="staff-cert-uber-history-date">{item.label}</p>
                    {item.number ? <p className="staff-cert-uber-history-number">#{item.number}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {lightboxUrl ? (
        <DocumentImageLightbox
          open
          imageUrl={lightboxUrl}
          alt={`${title} document`}
          onClose={() => setLightboxUrl(null)}
          fullscreen
        />
      ) : null}
    </section>
  );
}
