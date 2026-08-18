import React from 'react';
import type { Client, ClientCredential } from '../../types';
import { AppButton } from '../ui/AppButton';
import { WfBadge } from '../ui/wireframe';
import {
  clientCredentialStatusLabel,
  clientTypeLabelForCredential,
} from '../../lib/clientCredentials';
import {
  formatClientCredentialApplicableTo,
  formatClientCredentialRequiredFor,
  type ClientCredentialTypeDef,
} from '../../lib/clientCredentialCatalog';
import { clientDisplayName } from '../../lib/clientType';
import { Check, RefreshCw, X } from 'lucide-react';

interface StaffClientCredentialReviewDetailProps {
  client: Client;
  type: ClientCredentialTypeDef;
  credential?: ClientCredential;
  feedTitle?: string;
  onOpenClientProfile?: () => void;
  onApprove?: () => void | Promise<void>;
  onReject?: () => void | Promise<void>;
  canVerify: boolean;
}

export function StaffClientCredentialReviewDetail({
  client,
  type,
  credential,
  feedTitle,
  onOpenClientProfile,
  onApprove,
  onReject,
  canVerify,
}: StaffClientCredentialReviewDetailProps) {
  const label = clientCredentialStatusLabel(credential);
  const pendingReview = credential?.status === 'pending' && Boolean(credential.documentUrl);
  const verified = credential?.status === 'verified' && Boolean(credential.documentUrl);

  return (
    <div className="space-y-4">
      <div>
        {onOpenClientProfile ? (
          <button type="button" className="text-left" onClick={onOpenClientProfile}>
            <p className="font-semibold">{feedTitle ?? `${clientDisplayName(client)} — ${type.name}`}</p>
          </button>
        ) : (
          <p className="font-semibold">{feedTitle ?? `${clientDisplayName(client)} — ${type.name}`}</p>
        )}
        <p className="text-xs text-brand-text-muted mt-1">
          {clientTypeLabelForCredential(client.clientType)} · {formatClientCredentialApplicableTo(type)}
        </p>
        <p className="text-xs text-brand-text-muted mt-1">{formatClientCredentialRequiredFor(type)}</p>
        <div className="mt-2">
          <WfBadge
            tone={label === 'Verified' ? 'success' : label === 'Rejected' || label === 'Expired' ? 'danger' : 'warning'}
          >
            {label}
          </WfBadge>
        </div>
      </div>

      {credential?.documentUrl ? (
        <img
          src={credential.documentUrl}
          alt={type.name}
          className="w-full max-h-72 object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
        />
      ) : (
        <p className="text-sm text-brand-text-muted">No document uploaded yet.</p>
      )}

      {credential?.expirationDate ? (
        <p className="text-sm text-brand-text-muted">Expiration date: {credential.expirationDate}</p>
      ) : null}
      {credential?.rejectionReason ? (
        <p className="text-sm text-rose-500">{credential.rejectionReason}</p>
      ) : null}

      {canVerify && pendingReview ? (
        <div className="flex flex-wrap gap-2">
          <AppButton
            variant="primary"
            size="sm"
            onClick={() => void onApprove?.()}
            startEnhancer={<Check className="w-3.5 h-3.5" />}
          >
            Verify
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            onClick={() => void onReject?.()}
            startEnhancer={<X className="w-3.5 h-3.5" />}
          >
            Reject
          </AppButton>
        </div>
      ) : null}

      {canVerify && verified ? (
        <AppButton
          variant="outline"
          size="sm"
          onClick={() => void onReject?.()}
          startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Request resubmit
        </AppButton>
      ) : null}
    </div>
  );
}
