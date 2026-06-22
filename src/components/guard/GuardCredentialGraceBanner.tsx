import React from 'react';
import { SecurityGuard } from '../../types';
import { guardCredentialGraceNotice } from '../../lib/guardCredentialGrace';
import { AlertTriangle } from 'lucide-react';

interface GuardCredentialGraceBannerProps {
  guard: SecurityGuard;
  onOpenCredentials?: () => void;
}

export function GuardCredentialGraceBanner({ guard, onOpenCredentials }: GuardCredentialGraceBannerProps) {
  const notice = guardCredentialGraceNotice(guard);
  if (!notice) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 space-y-2">
      <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Upload missing credentials
      </p>
      <p className="text-xs text-brand-text-muted leading-relaxed">
        Your account was activated without: <strong className="text-brand-text">{notice.missing.join(', ')}</strong>.
        Add them in Credentials within <strong className="text-brand-text">{notice.timeRemainingLabel}</strong>
        {' '}or your account will be deactivated.
      </p>
      {onOpenCredentials && (
        <button
          type="button"
          onClick={onOpenCredentials}
          className="app-button-primary !w-auto !h-9 !px-4 !text-xs"
        >
          Open Credentials
        </button>
      )}
    </div>
  );
}
