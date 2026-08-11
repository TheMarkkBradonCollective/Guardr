import React from 'react';
import { Download, FileText } from 'lucide-react';
import {
  manualsForAudience,
  resolveManualAudience,
  type UserManualFile,
} from '../../lib/userManuals';

interface UserManualDownloadsProps {
  /** Guide filter tab id or platform role string */
  audienceFilter?: string;
  variant?: 'mobile' | 'desktop';
}

function ManualDownloadRow({
  manual,
  isDesktop,
}: {
  manual: UserManualFile;
  isDesktop: boolean;
}) {
  return (
    <a
      href={manual.href}
      download={manual.fileName}
      type="application/pdf"
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

/** PDF file downloads for the Guide hub (web + app). Links are .pdf only. */
export function UserManualDownloads({
  audienceFilter = 'all',
  variant = 'mobile',
}: UserManualDownloadsProps) {
  const isDesktop = variant === 'desktop';
  const audience = resolveManualAudience(audienceFilter);
  const manuals = manualsForAudience(audience);

  return (
    <div className={isDesktop ? 'adm-guide-manuals' : 'px-4 pt-2 pb-4 border-b border-brand-border'}>
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
            Real PDF files (US Letter). Tap to download and print or keep offline.
          </p>
        </div>

        <div className={isDesktop ? 'adm-guide-manual-list' : 'space-y-2'}>
          {manuals.map((manual) => (
            <ManualDownloadRow key={manual.id} manual={manual} isDesktop={isDesktop} />
          ))}
        </div>
      </div>
    </div>
  );
}
