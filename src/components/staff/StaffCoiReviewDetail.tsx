import React from 'react';
import type { SecurityGuard } from '../../types';
import { resolveInsuranceStatus } from '../../lib/guardInsurance';
import { getCoiArchiveHistory } from '../../lib/coiRevisionHistory';
import type { ApprovalFeedItem } from '../../lib/staffApprovalsFeed';
import { CoiCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CoiCredentialBadge } from '../credentials/CoiCredentialBadge';
import { StaffCredentialReviewDetail } from './StaffCredentialReviewDetail';

function formatExpiry(iso?: string): string | null {
  if (!iso?.trim()) return null;
  const date = new Date(`${iso.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatEffective(iso?: string): string | null {
  if (!iso?.trim()) return null;
  const date = new Date(`${iso.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface StaffCoiReviewDetailProps {
  guard: SecurityGuard;
  feedItem?: ApprovalFeedItem;
  guardName?: string;
  onOpenGuardProfile?: () => void;
  actions?: React.ReactNode;
}

export function StaffCoiReviewDetail({
  guard,
  feedItem,
  guardName,
  onOpenGuardProfile,
  actions,
}: StaffCoiReviewDetailProps) {
  const policy = guard.insurancePolicy;
  const status = policy ? resolveInsuranceStatus(policy) : 'not_submitted';
  const title = policy?.carrier?.trim() || 'Certificate of Insurance';
  const history = policy ? getCoiArchiveHistory(policy) : [];

  const kicker =
    status === 'verified'
      ? 'On file'
      : status === 'pending'
        ? 'Current submission'
        : status === 'rejected'
          ? 'Rejected submission'
          : 'Awaiting upload';

  const fields = [
    policy?.policyNumber?.trim()
      ? { label: 'Policy number', value: policy.policyNumber.trim() }
      : null,
    policy?.generalLiabilityLimit != null
      ? {
          label: 'General liability limit',
          value: `$${policy.generalLiabilityLimit.toLocaleString()}`,
        }
      : null,
    policy?.effectiveDate
      ? { label: 'Effective date', value: formatEffective(policy.effectiveDate) ?? policy.effectiveDate }
      : null,
    policy?.expiryDate
      ? { label: 'Expiration date', value: formatExpiry(policy.expiryDate) ?? policy.expiryDate }
      : null,
  ].filter((field): field is { label: string; value: string } => Boolean(field));

  const note =
    status === 'rejected'
      ? policy?.rejectionReason
      : status === 'verified' && policy?.updateRequestNote
        ? policy.updateRequestNote
        : undefined;

  const docUrl = policy?.documentUrl?.trim();

  return (
    <StaffCredentialReviewDetail
      guardName={guardName ?? guard.name}
      feedItem={feedItem}
      onOpenGuardProfile={onOpenGuardProfile}
      actions={actions}
      kicker={kicker}
      title={title}
      badges={
        <>
          <CoiCredentialBadge />
          <CoiCredentialStatusBadges guard={guard} />
        </>
      }
      fields={fields}
      note={note}
      footnote={
        status === 'verified' && policy?.updateRequestedAt
          ? 'Verified copy stays on file until the guard uploads an updated certificate.'
          : undefined
      }
      primaryPhoto={
        docUrl
          ? {
              url: docUrl,
              label: 'Certificate of Insurance',
              alt: `${guard.name} Certificate of Insurance`,
            }
          : undefined
      }
      history={history}
      ariaLabel="Certificate of Insurance review"
    />
  );
}
