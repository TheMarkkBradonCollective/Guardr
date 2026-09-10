import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { subscribeDataLoadIssue } from '../lib/dataLoadStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const [retrying, setRetrying] = React.useState(false);
  const [loadIssue, setLoadIssue] = React.useState<string | null>(null);

  React.useEffect(() => subscribeDataLoadIssue(setLoadIssue), []);

  if (online && !loadIssue) return null;

  const message = !online
    ? 'You’re offline. Saved work will sync when you reconnect.'
    : loadIssue;

  return (
    <div
      className="offline-banner fixed left-0 right-0 z-[1300] flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-700/95 backdrop-blur-sm"
      style={{ top: 'max(0px, env(safe-area-inset-top))' }}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
      <button
        type="button"
        className="offline-banner-retry"
        disabled={retrying}
        onClick={() => {
          setRetrying(true);
          window.location.reload();
        }}
      >
        {retrying ? 'Reconnecting…' : 'Try again'}
      </button>
    </div>
  );
}
