import React from 'react';
import { UserManualDownloads } from '../docs/UserManualDownloads';
import { StakeholderDocumentDownloads } from '../docs/StakeholderDocumentDownloads';
import { LegalInfoCards } from '../legal/LegalInfoCards';
import type { LegalPageId } from '../../lib/legalContent';
import type { SessionUser } from '../../types';

interface WebsiteAccountDocumentsProps {
  currentUser: SessionUser;
  onOpenLegal?: (page: LegalPageId) => void;
}

export function WebsiteAccountDocuments({ currentUser, onOpenLegal }: WebsiteAccountDocumentsProps) {
  return (
    <div className="website-account-panel" style={{ padding: 20 }}>
      <h1 className="website-account-home h1" style={{ fontSize: '1.5rem', marginBottom: 8 }}>
        Documents
      </h1>
      <p className="website-account-lead">Manuals, company package, agreements, and legal documents for this account.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <StakeholderDocumentDownloads distribution="public" variant="embedded" />
        <UserManualDownloads audienceFilter={currentUser.role} variant="embedded" />
      </div>
      {onOpenLegal ? (
        <div style={{ marginTop: 24 }}>
          <LegalInfoCards onOpenLegal={onOpenLegal} />
        </div>
      ) : null}
    </div>
  );
}
