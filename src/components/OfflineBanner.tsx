import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      className="offline-banner fixed left-0 right-0 z-[1300] flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-700/95 backdrop-blur-sm"
      style={{ top: 'max(0px, env(safe-area-inset-top))' }}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span>Offline — changes save locally and sync when you reconnect</span>
    </div>
  );
}
