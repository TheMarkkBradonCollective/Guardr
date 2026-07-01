import React from 'react';
import { formatTeamCodeDisplay } from '../../lib/teamCode';
import { showAppToast } from '../ui/AppToast';
import { Copy } from 'lucide-react';

interface TeamCodeShareBlockProps {
  code: string;
  title?: string;
  subtitle?: string;
}

export function TeamCodeShareBlock({ code, title, subtitle }: TeamCodeShareBlockProps) {
  const display = formatTeamCodeDisplay(code);
  if (display === '—') return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(display);
      showAppToast('Crew code copied.', { tone: 'success' });
    } catch {
      showAppToast(display, { tone: 'info' });
    }
  };

  return (
    <div className="rounded-lg border border-brand-primary/25 bg-brand-primary/10 px-3 py-2.5 space-y-1.5">
      {title && <p className="text-sm font-semibold text-brand-text truncate">{title}</p>}
      {subtitle && <p className="text-xs text-brand-text-muted truncate">{subtitle}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 text-base font-bold tracking-widest text-brand-primary">{display}</code>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="app-button-outline app-btn-sm inline-flex items-center gap-1 shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
      </div>
    </div>
  );
}
