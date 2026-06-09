import React from 'react';
import { Certification } from '../../types';
import { getCredentialStatusBadgeClass, getCredentialStatusLabel } from '../../lib/certStatus';

export function CredentialStatusBadge({ cert }: { cert: Certification }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border h-fit ${getCredentialStatusBadgeClass(cert)}`}
    >
      {getCredentialStatusLabel(cert)}
    </span>
  );
}
