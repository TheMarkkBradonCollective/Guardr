import React, { useMemo, useState } from 'react';
import type { Client, ClientCredential } from '../../types';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { AppButton } from '../ui/AppButton';
import { WfBadge } from '../ui/wireframe';
import {
  alwaysRequiredClientCredentialTypes,
  clientCredentialForType,
  clientCredentialStatusLabel,
  clientCredentialsOf,
  submitClientCredentialUpload,
} from '../../lib/clientCredentials';
import {
  catalogTypesForClientType,
  formatClientCredentialRequiredFor,
  type ClientCredentialRuleOverride,
} from '../../lib/clientCredentialCatalog';
import { normalizeClientType } from '../../lib/clientType';

interface ClientCredentialsSectionProps {
  client: Client;
  rules?: ClientCredentialRuleOverride[];
  editing: boolean;
  onSubmitCredential?: (credential: ClientCredential) => void | Promise<void>;
}

export function ClientCredentialsSection({
  client,
  rules,
  editing,
  onSubmitCredential,
}: ClientCredentialsSectionProps) {
  const clientType = normalizeClientType(client.clientType);
  const types = catalogTypesForClientType(clientType, rules);
  const requiredTypes = alwaysRequiredClientCredentialTypes(client, rules);
  const uploaded = clientCredentialsOf(client);
  const uploadedTypeIds = new Set(uploaded.map((credential) => credential.typeId));
  const optionalTypes = types.filter((type) => !type.alwaysRequired);
  const [selectedTypeId, setSelectedTypeId] = useState(optionalTypes[0]?.id ?? '');
  const [documentUrl, setDocumentUrl] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [savingTypeId, setSavingTypeId] = useState<string | null>(null);

  const visibleTypes = useMemo(() => {
    const requiredIds = new Set(requiredTypes.map((type) => type.id));
    return types.filter((type) => requiredIds.has(type.id) || uploadedTypeIds.has(type.id));
  }, [requiredTypes, types, uploadedTypeIds]);

  const addableTypes = optionalTypes.filter((type) => !uploadedTypeIds.has(type.id));

  const submitType = async (typeId: string, url: string, expiry: string) => {
    if (!onSubmitCredential || !url.trim()) return;
    setSavingTypeId(typeId);
    try {
      await onSubmitCredential(
        submitClientCredentialUpload({
          typeId,
          documentUrl: url,
          expirationDate: expiry.trim() || undefined,
          existing: clientCredentialForType(client, typeId),
        })
      );
      setDocumentUrl('');
      setExpirationDate('');
    } finally {
      setSavingTypeId(null);
    }
  };

  const statusTone = (label: string): 'success' | 'warning' | 'danger' | 'muted' => {
    if (label === 'Verified') return 'success';
    if (label === 'Rejected' || label === 'Expired') return 'danger';
    if (label === 'Pending review') return 'warning';
    return 'muted';
  };

  return (
    <div className="space-y-3 pt-4 border-t border-brand-border">
      <div>
        <p className="uber-label">Credentials</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Government-issued ID is required. Licenses and permits stay in the client library — only
          documents required for the service you request need to be uploaded and verified.
        </p>
      </div>

      {visibleTypes.length === 0 ? (
        <p className="text-sm text-brand-text-muted">No credentials on file yet.</p>
      ) : (
        <ul className="space-y-3">
          {visibleTypes.map((type) => {
            const credential = clientCredentialForType(client, type.id);
            const label = clientCredentialStatusLabel(credential);
            const locked = credential?.status === 'pending' || credential?.status === 'verified';
            return (
              <li key={type.id} className="wf-list-card items-start flex-col !items-stretch gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{type.name}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      {formatClientCredentialRequiredFor(type)}
                    </p>
                    {credential?.expirationDate ? (
                      <p className="text-xs text-brand-text-muted mt-0.5">Expires {credential.expirationDate}</p>
                    ) : null}
                    {credential?.rejectionReason ? (
                      <p className="text-xs text-rose-500 mt-0.5">{credential.rejectionReason}</p>
                    ) : null}
                  </div>
                  <WfBadge tone={statusTone(label)}>{label}</WfBadge>
                </div>
                {editing && onSubmitCredential && !locked ? (
                  <div className="space-y-2">
                    <DocumentPhotoUploadField
                      imageUrl={credential?.documentUrl}
                      onImageUrlChange={(url) => {
                        void submitType(type.id, url, credential?.expirationDate ?? '');
                      }}
                      label="Upload document"
                      previewAlt={type.name}
                    />
                    <input
                      className="uber-input rounded-xl"
                      type="date"
                      value={credential?.expirationDate ?? ''}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (credential?.documentUrl) {
                          void submitType(type.id, credential.documentUrl, next);
                        }
                      }}
                      aria-label={`${type.name} expiration date`}
                    />
                  </div>
                ) : credential?.documentUrl ? (
                  <img
                    src={credential.documentUrl}
                    alt={type.name}
                    className="w-full max-h-36 object-contain rounded-lg border border-brand-border bg-brand-bg-sec"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {editing && onSubmitCredential && addableTypes.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-brand-border p-3">
          <p className="text-xs font-semibold text-brand-text-muted">Add from credential library</p>
          <select
            className="uber-select w-full rounded-xl"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
          >
            {addableTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <DocumentPhotoUploadField
            imageUrl={documentUrl || undefined}
            onImageUrlChange={setDocumentUrl}
            label="Upload document"
            previewAlt="Credential document"
          />
          <input
            className="uber-input rounded-xl"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            aria-label="Expiration date"
          />
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentUrl.trim() || !selectedTypeId || savingTypeId === selectedTypeId}
            onClick={() => void submitType(selectedTypeId, documentUrl, expirationDate)}
          >
            Submit for verification
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
