import React from 'react';
import { Download, ExternalLink, FileText, Printer } from 'lucide-react';
import {
  STAKEHOLDER_DOCUMENTS,
  resolveStakeholderPdfUrl,
  type StakeholderDocument,
} from '../../lib/stakeholderDocuments';

interface StakeholderDocumentDownloadsProps {
  variant?: 'mobile' | 'desktop' | 'embedded';
  onViewMarkdown?: (source: 'executive-summary' | 'company-package') => void;
}

function DocumentRow({
  doc,
  isDesktop,
  onViewMarkdown,
}: {
  doc: StakeholderDocument;
  isDesktop: boolean;
  onViewMarkdown?: (source: 'executive-summary' | 'company-package') => void;
}) {
  const pdfHref = resolveStakeholderPdfUrl(doc.href);
  const htmlHref = doc.htmlPath ? resolveStakeholderPdfUrl(doc.htmlPath) : null;

  const rowClass = isDesktop
    ? 'adm-guide-manual-row'
    : 'flex flex-col gap-2 rounded-xl border border-brand-border bg-brand-surface px-3 py-3';

  const actionClass = isDesktop
    ? 'adm-guide-manual-action'
    : 'inline-flex items-center gap-1 text-xs font-semibold text-brand-primary';

  return (
    <div className={rowClass} data-stakeholder-doc={doc.id}>
      <div className={isDesktop ? 'flex items-start gap-3 w-full' : 'flex items-start gap-3'}>
        <span
          className={
            isDesktop
              ? 'adm-guide-manual-icon'
              : 'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg-sec text-brand-text'
          }
          aria-hidden
        >
          <FileText className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={isDesktop ? 'adm-guide-manual-title' : 'block text-sm font-semibold text-brand-text'}>
            {doc.title}
          </span>
          <span
            className={
              isDesktop
                ? 'adm-guide-manual-desc'
                : 'block text-xs text-brand-text-muted leading-relaxed mt-0.5'
            }
          >
            {doc.description}
          </span>
        </span>
      </div>
      <div className={isDesktop ? 'flex flex-wrap gap-2 mt-2' : 'flex flex-wrap gap-3 pl-12'}>
        <a
          href={pdfHref}
          download={doc.fileName}
          type="application/pdf"
          target="_blank"
          rel="noopener noreferrer"
          className={actionClass}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          PDF
        </a>
        <a
          href={pdfHref}
          target="_blank"
          rel="noopener noreferrer"
          className={actionClass}
          onClick={(e) => {
            e.preventDefault();
            const w = window.open(pdfHref, '_blank', 'noopener,noreferrer');
            w?.addEventListener('load', () => w.print());
          }}
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Print
        </a>
        {doc.markdownSource && onViewMarkdown ? (
          <button
            type="button"
            className={actionClass}
            onClick={() => onViewMarkdown(doc.markdownSource!)}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            View
          </button>
        ) : null}
        {htmlHref ? (
          <a href={htmlHref} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Fill in browser
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Printable stakeholder PDFs — Manager+ staff only (counsel, advisors, investors). */
export function StakeholderDocumentDownloads({
  variant = 'mobile',
  onViewMarkdown,
}: StakeholderDocumentDownloadsProps) {
  const isDesktop = variant === 'desktop';
  const isEmbedded = variant === 'embedded';

  const list = (
    <div className={isDesktop ? 'adm-guide-manual-list space-y-2' : 'space-y-2'}>
      {STAKEHOLDER_DOCUMENTS.map((doc) => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          isDesktop={isDesktop}
          onViewMarkdown={onViewMarkdown}
        />
      ))}
    </div>
  );

  const header = (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
        Printable stakeholder documents
      </p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1.5">
        Manager+ only. Download or print for legal counsel, advisors, and investors.
      </p>
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="space-y-3" data-tour="stakeholder-documents">
        {header}
        {list}
      </div>
    );
  }

  return (
    <div
      className={isDesktop ? 'adm-guide-manuals' : 'px-4 pt-2 pb-4 border-b border-brand-border'}
      data-tour="stakeholder-documents"
    >
      <div
        className={
          isDesktop
            ? 'adm-card adm-guide-manuals-card'
            : 'rounded-xl border border-brand-border bg-brand-bg-sec/40 p-4 space-y-3'
        }
      >
        {header}
        {list}
      </div>
    </div>
  );
}
