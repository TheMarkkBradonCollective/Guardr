import React from 'react';
import type { Certification } from '../../types';
import { certDisplayName } from '../../lib/certCatalog';
import { formatStateName } from '../../lib/states';
import { getCertificationArchiveHistory } from '../../lib/certRevisionHistory';
import type { ApprovalFeedItem } from '../../lib/staffApprovalsFeed';
import { CredentialCategoryBadge } from '../credentials/CredentialCategoryBadge';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { StaffCredentialReviewDetail } from './StaffCredentialReviewDetail';

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
  guardName?: string;
  onOpenGuardProfile?: () => void;
  actions?: React.ReactNode;
}

export function StaffCertReviewDetail({
  cert,
  feedItem,
  guardName,
  onOpenGuardProfile,
  actions,
}: StaffCertReviewDetailProps) {
  const display = staffCertDisplay(cert);
  const history = getCertificationArchiveHistory(cert);
  const title = certDisplayName(cert);
  const expiryLabel = formatExpiry(display.expiryDate);

  const fields = [
    display.state ? { label: 'State', value: formatStateName(display.state) } : null,
    display.issuer ? { label: 'Issuing organization', value: display.issuer } : null,
    display.number ? { label: 'License / cert number', value: display.number } : null,
    expiryLabel ? { label: 'Expiration date', value: expiryLabel } : null,
  ].filter((field): field is { label: string; value: string } => Boolean(field));

  return (
    <StaffCredentialReviewDetail
      guardName={guardName}
      feedItem={feedItem}
      onOpenGuardProfile={onOpenGuardProfile}
      actions={actions}
      kicker={display.kicker}
      title={title}
      badges={
        <>
          <CredentialCategoryBadge cert={cert} variant="category" />
          <CredentialStatusBadges cert={cert} staffMode />
        </>
      }
      fields={fields}
      note={display.note}
      footnote={
        cert.pendingUpdate && cert.status === 'verified'
          ? 'Verified copy stays on file until you approve or reject this update.'
          : undefined
      }
      primaryPhoto={
        display.imageUrl
          ? { url: display.imageUrl, label: `${title} document`, alt: `${title} document` }
          : undefined
      }
      history={history}
      ariaLabel={`${title} review`}
    />
  );
}
