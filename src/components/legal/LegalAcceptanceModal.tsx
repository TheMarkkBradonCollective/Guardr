import React, { useMemo, useState } from 'react';
import {
  CURRENT_LEGAL_VERSIONS,
  LEGAL_DOCUMENTS,
  legalDocumentLabel,
  type LegalPageId,
} from '../../lib/legalContent';
import {
  hasAcceptedAllRequiredLegal,
  missingLegalDocuments,
  type LegalUserRole,
} from '../../lib/legalAcceptance';
import { LEGAL_ENTITY_NAME, SITE_NAME } from '../../lib/siteConfig';
import { LegalFooterLinks } from './LegalFooterLinks';

interface LegalAcceptanceModalProps {
  role: LegalUserRole;
  userIds: string[];
  acceptedKeys: Set<string>;
  onOpenLegal: (page: LegalPageId) => void;
  onAccept: (documentIds: LegalPageId[]) => Promise<void>;
}

export function LegalAcceptanceModal({
  role,
  userIds,
  acceptedKeys,
  onOpenLegal,
  onAccept,
}: LegalAcceptanceModalProps) {
  const missing = useMemo(
    () => missingLegalDocuments(role, userIds, acceptedKeys),
    [role, userIds, acceptedKeys]
  );
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  if (hasAcceptedAllRequiredLegal(role, userIds, acceptedKeys)) {
    return null;
  }

  const allChecked = missing.every((documentId) => checked[documentId]);

  const handleSubmit = async () => {
    if (!allChecked) return;
    setSubmitting(true);
    try {
      await onAccept(missing);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // z-[10000]: this gate must sit above every other layer (app header
    // z-1200, bottom nav z-1001, account/notification menus z-1300/3000,
    // onboarding tour z-9999) — otherwise users can interact with app
    // chrome without ever accepting the required legal agreements.
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="legal-acceptance-title"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted">
          {LEGAL_ENTITY_NAME}
        </p>
        <h2 id="legal-acceptance-title" className="text-xl font-bold mt-1">
          Marketplace agreements required
        </h2>
        <p className="text-sm text-brand-text-muted mt-3 leading-relaxed">
          {SITE_NAME} is a technology platform connecting clients with independent licensed security
          professionals. Review and accept the agreements below to continue.
        </p>

        <ul className="mt-5 space-y-3">
          {missing.map((documentId) => (
            <li key={documentId}>
              <label className="legal-accept-row cursor-pointer">
                <input
                  type="checkbox"
                  className="app-checkbox mt-0.5"
                  checked={!!checked[documentId]}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [documentId]: e.target.checked }))
                  }
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    className="font-semibold text-brand-primary hover:underline"
                    onClick={() => onOpenLegal(documentId)}
                  >
                    {legalDocumentLabel(documentId)}
                  </button>{' '}
                  (version {CURRENT_LEGAL_VERSIONS[documentId]})
                </span>
              </label>
              <p className="text-xs text-brand-text-muted mt-1 ml-[2.375rem]">
                {LEGAL_DOCUMENTS[documentId].intro.slice(0, 140)}…
              </p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="app-button-primary w-full mt-6"
          disabled={!allChecked || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Saving…' : 'Accept and continue'}
        </button>

        <div className="mt-6 pt-4 border-t border-brand-border">
          <LegalFooterLinks onOpenLegal={onOpenLegal} />
        </div>
      </div>
    </div>
  );
}
