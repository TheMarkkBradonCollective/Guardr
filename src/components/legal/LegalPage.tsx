import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../Logo';
import { LEGAL_DOCUMENTS, LEGAL_PAGE_SIBLINGS, type LegalPageId } from '../../lib/legalContent';
import { SITE_NAME } from '../../lib/siteConfig';
import {
  LegalEntityName,
  highlightSignatureSecurityBrand,
} from '../SignatureSecurityBrand';
import { useSurfaceKind } from '../../surfaces';

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
  const surface = useSurfaceKind();
  const compactBack = surface === 'mobile';
  const documentIds = Object.keys(LEGAL_DOCUMENTS) as LegalPageId[];

  const documentNav = onOpenLegal ? (
    <nav className="legal-document-nav" aria-label="Legal documents">
      {documentIds.map((id) => (
        <button
          key={id}
          type="button"
          className="legal-document-nav-item"
          aria-current={id === page ? 'page' : undefined}
          onClick={() => onOpenLegal(id)}
        >
          {LEGAL_DOCUMENTS[id].title}
        </button>
      ))}
    </nav>
  ) : null;

  return (
    <div className={`page-shell min-h-screen legal-document-page legal-document-page--${surface}`}>
      <header className="legal-document-header">
        <div className="legal-document-header-inner">
          <button
            type="button"
            onClick={onBack}
            className="app-subscreen-back"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {compactBack ? 'Back' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-3">
            {headerRight}
            <div className="flex items-center gap-2">
              <Logo size={24} className="text-brand-primary" />
              <span className="font-semibold text-brand-primary">{SITE_NAME}</span>
            </div>
          </div>
        </div>
        {surface === 'tablet' ? documentNav : null}
      </header>

      <div className="legal-document-frame">
        {surface === 'desktop' ? (
          <aside className="legal-document-rail">
            <p className="legal-document-rail-label">Documents</p>
            {documentNav}
            <p className="legal-document-rail-label">On this page</p>
            <nav className="legal-document-nav" aria-label="Sections">
              {doc.sections.map((section) => (
                <a key={section.title} className="legal-document-nav-item" href={`#${legalAnchor(section.title)}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>
        ) : null}

      <main className="legal-document-main">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted mb-2">
          <LegalEntityName />
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
        <p className="text-sm text-brand-text-muted mt-2">Last updated {doc.updated}</p>

        <div className="mt-6 border border-brand-primary/25 bg-brand-primary/5 px-4 py-4 text-sm leading-relaxed text-brand-text">
          <strong className="font-semibold">Marketplace notice.</strong> {SITE_NAME} is a technology
          platform operated by <LegalEntityName />. We connect clients with independent licensed
          security professionals. We do not provide security services, employ guards, or act as a
          private patrol operator.
        </div>

        <p className="mt-8 text-sm sm:text-base leading-relaxed text-brand-text-muted">
          {highlightSignatureSecurityBrand(doc.intro)}
        </p>

        <div className="mt-10 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.title} id={legalAnchor(section.title)}>
              <h2 className="text-lg font-semibold text-brand-text">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand-text-muted">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{highlightSignatureSecurityBrand(paragraph)}</p>
                ))}
                {section.bullets && (
                  <ul className="list-disc pl-5 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{highlightSignatureSecurityBrand(bullet)}</li>
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
    </div>
  );
}

function legalAnchor(title: string): string {
  return `legal-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}
