import React, { useState } from 'react';
import { BadgeCheck, FileText, Shield, X } from 'lucide-react';
import { motion } from 'motion/react';
import {
  companyDocumentTypeById,
  companyPlacardHeadline,
  formatPlacardDate,
  type CompanyPublicDocument,
} from '../../lib/companyPlacard';
import { LEGAL_ENTITY_NAME } from '../../lib/siteConfig';

interface CompanyPublicPlacardProps {
  documents: CompanyPublicDocument[];
}

function PlacardItem({ doc }: { doc: CompanyPublicDocument }) {
  const typeDef = companyDocumentTypeById(doc.documentType);
  const isInsurance = doc.documentType.includes('insurance');

  return (
    <article className="company-placard-item">
      <div className="company-placard-item-icon" aria-hidden="true">
        {isInsurance ? <Shield className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      </div>
      <div className="company-placard-item-body">
        <p className="company-placard-item-title">{doc.title}</p>
        {doc.documentNumber && (
          <p className="company-placard-item-meta">
            {typeDef?.numberLabel ?? 'Number'}: <span>{doc.documentNumber}</span>
          </p>
        )}
        {doc.issuer && (
          <p className="company-placard-item-meta">
            {typeDef?.issuerLabel ?? 'Issuer'}: <span>{doc.issuer}</span>
          </p>
        )}
        {doc.expiryDate && (
          <p className="company-placard-item-meta">
            Valid through: <span>{formatPlacardDate(doc.expiryDate)}</span>
          </p>
        )}
      </div>
      <span className="company-placard-item-badge">
        <BadgeCheck className="w-3.5 h-3.5" />
        On file
      </span>
    </article>
  );
}

export function CompanyPublicPlacard({ documents }: CompanyPublicPlacardProps) {
  const [previewDoc, setPreviewDoc] = useState<CompanyPublicDocument | null>(null);

  if (documents.length === 0) return null;

  return (
    <>
      <section className="landing-section company-placard-section border-t border-brand-border bg-brand-bg" aria-label="Company license and insurance">
        <div className="landing-container">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45 }}
            className="company-placard-card"
          >
            <div className="company-placard-header">
              <p className="experience-badge">Public credentials</p>
              <h2 className="company-placard-headline">{companyPlacardHeadline()}</h2>
              <p className="company-placard-lead">
                {LEGAL_ENTITY_NAME} operates Guardr. These credentials are posted for public
                reference — like a license placard at our place of business.
              </p>
            </div>
            <div className="company-placard-grid">
              {documents.map((doc) => (
                <div key={doc.id} className="company-placard-grid-cell">
                  <PlacardItem doc={doc} />
                  {doc.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="company-placard-view-doc"
                    >
                      View document
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {previewDoc?.imageUrl && (
        <div
          className="company-placard-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`${previewDoc.title} document`}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="company-placard-preview-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="company-placard-preview-header">
              <p className="font-bold text-brand-text">{previewDoc.title}</p>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="company-placard-preview-close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewDoc.imageUrl}
              alt={previewDoc.title}
              className="company-placard-preview-image"
            />
          </div>
        </div>
      )}
    </>
  );
}
