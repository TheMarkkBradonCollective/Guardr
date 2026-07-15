import React from 'react';
import { ChevronRight, Info, Lock } from 'lucide-react';
import { showAppAlert, type AppAlertTone } from '../AppConfirm';

export function openAppNotice(title: string, message: string, tone: AppAlertTone = 'default'): void {
  void showAppAlert({ title, message, tone });
}

interface AppBlockedAccessScreenProps {
  title: string;
  message: string;
  tone?: AppAlertTone;
  placeholders?: string[];
}

/** Full-section placeholder — tap any row to open the access notice popup. */
export function AppBlockedAccessScreen({
  title,
  message,
  tone = 'default',
  placeholders = ['Open section'],
}: AppBlockedAccessScreenProps) {
  const open = () => openAppNotice(title, message, tone);

  return (
    <div className="app-screen animate-fade-in max-w-lg space-y-3">
      {placeholders.map((label) => (
        <button key={label} type="button" onClick={open} className="app-blocked-access-row">
          <span className="app-blocked-access-row-icon" aria-hidden>
            <Lock className="w-4 h-4" />
          </span>
          <span className="app-blocked-access-row-label">{label}</span>
          <ChevronRight className="w-4 h-4 shrink-0 opacity-50" aria-hidden />
        </button>
      ))}
    </div>
  );
}

interface AppNoticeChipProps {
  label: string;
  title: string;
  message: string;
  tone?: AppAlertTone;
  className?: string;
}

/** Compact clickable warning / empty notice — details live in the popup. */
export function AppNoticeChip({ label, title, message, tone = 'warning', className = '' }: AppNoticeChipProps) {
  return (
    <button
      type="button"
      className={`app-notice-chip app-notice-chip--${tone} ${className}`.trim()}
      onClick={() => openAppNotice(title, message, tone)}
    >
      <Info className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60 ml-auto" aria-hidden />
    </button>
  );
}
