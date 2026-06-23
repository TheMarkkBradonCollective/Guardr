import React from 'react';
import { Certification, SecurityGuard } from '../../types';
import {
  getGuardIdVerificationStatus,
  getIdCredentialUploadBadgeClass,
  getIdCredentialUploadLabel,
  getIdCredentialVerificationBadgeClass,
  getIdCredentialVerificationLabel,
} from '../../lib/guardIdentityVerification';
import {
  getCredentialUploadBadgeClass,
  getCredentialUploadLabel,
  getCredentialVerificationBadgeClass,
  getCredentialVerificationLabel,
} from '../../lib/certStatus';

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border h-fit ${className}`}
    >
      {label}
    </span>
  );
}

export function CredentialUploadBadge({
  cert,
  staffMode = false,
}: {
  cert: Certification;
  staffMode?: boolean;
}) {
  return (
    <Badge
      label={getCredentialUploadLabel(cert, { staffMode })}
      className={getCredentialUploadBadgeClass(cert)}
    />
  );
}

export function CredentialVerificationBadge({ cert }: { cert: Certification }) {
  return (
    <Badge label={getCredentialVerificationLabel(cert)} className={getCredentialVerificationBadgeClass(cert)} />
  );
}

export function CredentialStatusBadges({
  cert,
  showUpload = true,
  showVerification = true,
  staffMode = false,
}: {
  cert: Certification;
  showUpload?: boolean;
  showVerification?: boolean;
  staffMode?: boolean;
}) {
  const verified = cert.status === 'verified';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {showUpload && !verified && <CredentialUploadBadge cert={cert} staffMode={staffMode} />}
      {showVerification && <CredentialVerificationBadge cert={cert} />}
    </div>
  );
}

export function IdCredentialStatusBadges({
  guard,
  showUpload = true,
  showVerification = true,
}: {
  guard: SecurityGuard;
  showUpload?: boolean;
  showVerification?: boolean;
}) {
  const uploadLabel = getIdCredentialUploadLabel(guard);
  const verified = getGuardIdVerificationStatus(guard) === 'verified';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {showUpload && uploadLabel && !verified && (
        <Badge label={uploadLabel} className={getIdCredentialUploadBadgeClass(guard)} />
      )}
      {showVerification && (
        <Badge
          label={getIdCredentialVerificationLabel(guard)}
          className={getIdCredentialVerificationBadgeClass(guard)}
        />
      )}
    </div>
  );
}

/** @deprecated Use CredentialStatusBadges */
export function CredentialStatusBadge({ cert }: { cert: Certification }) {
  return <CredentialStatusBadges cert={cert} />;
}
