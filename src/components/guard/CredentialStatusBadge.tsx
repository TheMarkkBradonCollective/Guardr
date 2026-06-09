import React from 'react';
import { Certification } from '../../types';
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

export function CredentialUploadBadge({ cert }: { cert: Certification }) {
  return <Badge label={getCredentialUploadLabel(cert)} className={getCredentialUploadBadgeClass(cert)} />;
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
}: {
  cert: Certification;
  showUpload?: boolean;
  showVerification?: boolean;
}) {
  const verified = cert.status === 'verified';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {showUpload && !verified && <CredentialUploadBadge cert={cert} />}
      {showVerification && <CredentialVerificationBadge cert={cert} />}
    </div>
  );
}

/** @deprecated Use CredentialStatusBadges */
export function CredentialStatusBadge({ cert }: { cert: Certification }) {
  return <CredentialStatusBadges cert={cert} />;
}
