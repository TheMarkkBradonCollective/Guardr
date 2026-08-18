import React from 'react';
import { SecurityGuard } from '../../types';
import { resolveCredentialFeedContext } from '../../lib/staffApprovalsFeed';
import { CertDetailModal } from '../credentials/CertDetailModal';
import { GuardCoiDetailModal } from '../profile/GuardCoiDetailModal';
import { GuardIdDetailModal } from '../profile/GuardIdDetailModal';

interface StaffApplicationCredentialViewModalProps {
  guard: SecurityGuard;
  credentialItemId: string;
  onClose: () => void;
}

/** Read-only credential preview for the Applications review flow — stays on the same page. */
export function StaffApplicationCredentialViewModal({
  guard,
  credentialItemId,
  onClose,
}: StaffApplicationCredentialViewModalProps) {
  const context = resolveCredentialFeedContext([guard], credentialItemId);
  if (!context) return null;

  if (context.kind === 'cert') {
    return (
      <CertDetailModal
        cert={context.cert}
        guardName={guard.name}
        staffMode
        onClose={onClose}
      />
    );
  }

  if (context.kind === 'gov-id') {
    return (
      <GuardIdDetailModal
        guard={guard}
        guardName={guard.name}
        staffMode
        onSubmit={async () => ({ ok: true })}
        onClose={onClose}
      />
    );
  }

  if (context.kind !== 'coi') return null;

  return (
    <GuardCoiDetailModal
      guard={guard}
      guardName={guard.name}
      staffMode
      onClose={onClose}
    />
  );
}
