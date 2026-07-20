import React from 'react';
import type { SecurityGuard } from '../../types';
import {
  formatIdExpiryLabel,
  getGuardIdVerificationStatus,
  governmentIdDocumentTypeLabel,
  ID_VERIFICATION_SLOT_LABELS,
  isIdExpired,
} from '../../lib/guardIdentityVerification';
import { getGovIdArchiveHistory } from '../../lib/govIdRevisionHistory';
import type { ApprovalFeedItem } from '../../lib/staffApprovalsFeed';
import { formatStateName } from '../../lib/states';
import { IdCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { StaffCredentialReviewDetail, type StaffCredentialReviewPhoto } from './StaffCredentialReviewDetail';

interface StaffGovIdReviewDetailProps {
  guard: SecurityGuard;
  feedItem?: ApprovalFeedItem;
  guardName?: string;
  onOpenGuardProfile?: () => void;
  actions?: React.ReactNode;
}

export function StaffGovIdReviewDetail({
  guard,
  feedItem,
  guardName,
  onOpenGuardProfile,
  actions,
}: StaffGovIdReviewDetailProps) {
  const status = getGuardIdVerificationStatus(guard);
  const history = getGovIdArchiveHistory(guard);
  const expired = isIdExpired(guard);
  const expiryLabel = formatIdExpiryLabel(guard.idExpiryDate);
  const title = governmentIdDocumentTypeLabel(guard.idDocumentType);

  const kicker =
    status === 'verified'
      ? 'On file'
      : status === 'pending'
        ? 'Current submission'
        : status === 'rejected'
          ? 'Rejected submission'
          : 'Awaiting upload';

  const fields = [
    guard.idState ? { label: 'Issuing state', value: formatStateName(guard.idState) } : null,
    guard.idNumber?.trim() ? { label: 'ID number', value: guard.idNumber.trim() } : null,
    guard.idLicenseClass?.trim() && guard.idDocumentType === 'drivers_license'
      ? { label: 'License class', value: guard.idLicenseClass.trim() }
      : null,
    expiryLabel
      ? {
          label: 'Expiration date',
          value: expired ? `Expired ${expiryLabel}` : expiryLabel,
        }
      : null,
  ].filter((field): field is { label: string; value: string } => Boolean(field));

  const note =
    status === 'rejected'
      ? guard.idVerificationRejectionReason
      : status === 'verified' && guard.idUpdateRequestNote
        ? guard.idUpdateRequestNote
        : undefined;

  const frontUrl = guard.idFrontUrl?.trim();
  const backUrl = guard.idBackUrl?.trim();
  const selfieUrl = guard.idSelfieUrl?.trim();

  const additionalPhotos: StaffCredentialReviewPhoto[] = [];
  if (backUrl) {
    additionalPhotos.push({
      url: backUrl,
      label: ID_VERIFICATION_SLOT_LABELS.back,
      alt: `${guard.name} ${ID_VERIFICATION_SLOT_LABELS.back}`,
    });
  }
  if (selfieUrl) {
    additionalPhotos.push({
      url: selfieUrl,
      label: ID_VERIFICATION_SLOT_LABELS.selfie,
      alt: `${guard.name} ${ID_VERIFICATION_SLOT_LABELS.selfie}`,
    });
  }

  return (
    <StaffCredentialReviewDetail
      guardName={guardName ?? guard.name}
      feedItem={feedItem}
      onOpenGuardProfile={onOpenGuardProfile}
      actions={actions}
      kicker={kicker}
      title={title}
      badges={<IdCredentialStatusBadges guard={guard} />}
      fields={fields}
      note={note}
      footnote={
        status === 'verified' && guard.idUpdateRequestedAt
          ? 'Verified copy stays on file until the guard uploads updated ID photos.'
          : undefined
      }
      primaryPhoto={
        frontUrl
          ? {
              url: frontUrl,
              label: ID_VERIFICATION_SLOT_LABELS.front,
              alt: `${guard.name} ${ID_VERIFICATION_SLOT_LABELS.front}`,
            }
          : undefined
      }
      additionalPhotos={additionalPhotos}
      history={history}
      ariaLabel="Government ID review"
    />
  );
}
