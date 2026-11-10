import React from 'react';
import { ChevronRight, Info } from 'lucide-react';
import { showAppAlert, type AppAlertTone } from '../AppConfirm';
import { RestrictedState } from '../../states/StateViews';
import '../../states/states.css';

export function openAppNotice(title: string, message: string, tone: AppAlertTone = 'default'): void {
  void showAppAlert({ title, message, tone });
}

interface AppBlockedAccessScreenProps {
  title: string;
  message: string;
  tone?: AppAlertTone;
  placeholders?: string[];
}

/** Real restricted state. Audience names are text, not tappable stand-ins. */
export function AppBlockedAccessScreen({
  title,
  message,
  placeholders = [],
}: AppBlockedAccessScreenProps) {
  return <RestrictedState title={title} message={message} audience={placeholders} />;
}

interface AppNoticeChipProps {
  label: string;
  title: string;
  message: string;
  tone?: AppAlertTone;
  className?: string;
}

/** Compact notice. The button opens the real alert; it is not a stand-in row. */
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
