import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../Logo';
import { LEGAL_DOCUMENTS, LEGAL_PAGE_SIBLINGS, type LegalPageId } from '../../lib/legalContent';
import { LEGAL_ENTITY_NAME, SITE_NAME } from '../../lib/siteConfig';

interface LegalPageProps {
  page: LegalPageId;
  onBack: () => void;
  onOpenLegal?: (page: LegalPageId) => void;
  headerRight?: React.ReactNode;
}

export function LegalPage({ page, onBack, onOpenLegal, headerRight }: LegalPageProps) {
  const doc = LEGAL_DOCUMENTS[page];
  const siblings = (LEGAL_PAGE_SIBLINGS[page] ?? (page === 'terms' ? ['privacy'] : ['terms'])).filter(
    (id) => id !== page
  );

  return (
    <div className="page-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-brand-border/80 bg-brand-bg/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="app-subscreen-back"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            {headerRight}
            <div className="flex items-center gap-2">
              <Logo size={24} className="text-brand-primary" />
              <span className="font-semibold text-brand-primary">{SITE_NAME}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 pb-16">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted mb-2">
          {LEGAL_ENTITY_NAME}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
        <p className="text-sm text-brand-text-muted mt-2">Last updated {doc.updated}</p>

        <div className="mt-6 border border-brand-primary/25 bg-brand-primary/5 px-4 py-4 text-sm leading-relaxed text-brand-text">
          <strong className="font-semibold">Marketplace notice.</strong> {SITE_NAME} is a technology
          platform operated by {LEGAL_ENTITY_NAME}. We connect clients with independent licensed
          security professionals. We do not provide security services, employ guards, or act as a
          private patrol operator.
        </div>

        <p className="mt-8 text-sm sm:text-base leading-relaxed text-brand-text-muted">{doc.intro}</p>

        <div className="mt-10 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-brand-text">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand-text-muted">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="list-disc pl-5 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {onOpenLegal && siblings.length > 0 && (
          <p className="mt-12 pt-8 border-t border-brand-border text-sm text-brand-text-muted">
            See also{' '}
            {siblings.map((sibling, index) => (
              <React.Fragment key={sibling}>
                {index > 0 && (index === siblings.length - 1 ? ', and ' : ', ')}
                <button
                  type="button"
                  onClick={() => onOpenLegal(sibling)}
                  className="font-semibold text-brand-primary hover:underline"
                >
                  {LEGAL_DOCUMENTS[sibling].title}
                </button>
              </React.Fragment>
            ))}
            .
          </p>
        )}

        <p className="mt-8 text-xs text-brand-text-muted leading-relaxed">
          This document is provided for platform transparency and is not legal advice. Licensing
          requirements for marketplaces and security services vary by state and locality. Consult
          qualified counsel before operating or relying on the Platform.
        </p>
      </main>
    </div>
  );
}
