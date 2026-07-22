import React, { useMemo, useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, LabelSmall, ParagraphSmall } from 'baseui/typography';
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
import { SITE_NAME } from '../../lib/siteConfig';
import { LegalEntityName } from '../SignatureSecurityBrand';
import { GuardrModal } from '../baseui/overlays/GuardrModal';
import { AppButton } from '../ui/AppButton';
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
    <GuardrModal
      open
      onClose={() => {}}
      dismissable={false}
      align="center"
      zIndex={10000}
      ariaLabelledBy="legal-acceptance-title"
      className="w-full max-w-lg"
    >
      <Block padding="scale800">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-muted mb-2">
          <LegalEntityName />
        </p>
        <HeadingMedium id="legal-acceptance-title" marginTop={0} marginBottom="scale400">
          Marketplace agreements required
        </HeadingMedium>
        <ParagraphSmall color="contentSecondary" marginBottom="scale600">
          {SITE_NAME} is a technology platform connecting clients with independent licensed security
          professionals. Review and accept the agreements below to continue.
        </ParagraphSmall>

        <Block as="ul" marginTop={0} marginBottom="scale600" paddingLeft={0} $style={{ listStyle: 'none' }}>
          {missing.map((documentId) => (
            <Block as="li" key={documentId} marginBottom="scale400">
              <label className="legal-accept-row cursor-pointer flex gap-3 items-start">
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
                    className="font-semibold uber-text-accent hover:underline"
                    onClick={() => onOpenLegal(documentId)}
                  >
                    {legalDocumentLabel(documentId)}
                  </button>{' '}
                  (version {CURRENT_LEGAL_VERSIONS[documentId]})
                </span>
              </label>
              <ParagraphSmall color="contentSecondary" marginTop="scale200" marginLeft="scale1000">
                {LEGAL_DOCUMENTS[documentId].intro.slice(0, 140)}…
              </ParagraphSmall>
            </Block>
          ))}
        </Block>

        <AppButton type="button" variant="primary" fullWidth disabled={!allChecked || submitting} onClick={handleSubmit}>
          {submitting ? 'Saving…' : 'Accept and continue'}
        </AppButton>

        <Block marginTop="scale600" paddingTop="scale600" overrides={{ Block: { style: { borderTop: '1px solid', borderColor: 'borderOpaque' } } }}>
          <LegalFooterLinks onOpenLegal={onOpenLegal} />
        </Block>
      </Block>
    </GuardrModal>
  );
}
