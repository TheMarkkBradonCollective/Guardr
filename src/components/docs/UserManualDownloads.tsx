import React from 'react';
import { Download, FileText } from 'lucide-react';
import {
  manualsForAudience,
  resolveManualAudience,
  resolveManualPdfUrl,
  type UserManualFile,
} from '../../lib/userManuals';

interface UserManualDownloadsProps {
  /** Guide filter tab id or platform role string */
  audienceFilter?: string;
  variant?: 'mobile' | 'desktop' | 'embedded';
}

function ManualDownloadRow({
  manual,
  isDesktop,
}: {
  manual: UserManualFile;
  isDesktop: boolean;
}) {
  const href = resolveManualPdfUrl(manual.href);

  return (
    <a
      href={href}
      download={manual.fileName}
      type="application/pdf"
      target="_blank"
      rel="noopener noreferrer"
      className={
        isDesktop
          ? 'adm-guide-manual-row'
          : 'flex items-start gap-3 rounded-xl border border-brand-border bg-brand-surface px-3 py-3 hover:bg-brand-bg-sec/70 transition-colors'
      }
    >
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
          {manual.title}
        </span>
        <span
          className={
            isDesktop
              ? 'adm-guide-manual-desc'
              : 'block text-xs text-brand-text-muted leading-relaxed mt-0.5'
          }
        >
          {manual.description}
        </span>
      </span>
      <span
        className={
          isDesktop
            ? 'adm-guide-manual-action'
            : 'inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-brand-primary pt-1'
        }
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        PDF
      </span>
    </a>
  );
}

/** PDF file downloads — Guide, Settings, pending screens (web + app). */
export function UserManualDownloads({
  audienceFilter = 'all',
  variant = 'mobile',
}: UserManualDownloadsProps) {
  const isDesktop = variant === 'desktop';
  const isEmbedded = variant === 'embedded';
  const audience = resolveManualAudience(audienceFilter);
  const manuals = manualsForAudience(audience);

  const list = (
    <div className={isDesktop ? 'adm-guide-manual-list' : 'space-y-2'}>
      {manuals.map((manual) => (
        <ManualDownloadRow key={manual.id} manual={manual} isDesktop={isDesktop} />
      ))}
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="space-y-3" data-tour="user-manual-downloads">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Download PDF manuals
          </p>
          <p className="text-xs text-brand-text-muted leading-relaxed mt-1.5">
            Open or save these PDF files on your phone or computer.
          </p>
        </div>
        {list}
      </div>
    );
  }

  return (
    <div
      className={isDesktop ? 'adm-guide-manuals' : 'px-4 pt-2 pb-4 border-b border-brand-border'}
      data-tour="user-manual-downloads"
    >
      <div
        className={
          isDesktop
            ? 'adm-card adm-guide-manuals-card'
            : 'rounded-xl border border-brand-border bg-brand-bg-sec/40 p-4 space-y-3'
        }
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Download PDF manuals
          </p>
          <p className="text-xs text-brand-text-muted leading-relaxed mt-1.5">
            Real PDF files for the website and app. Tap to open or download.
          </p>
        </div>
        {list}
      </div>
    </div>
  );
}
