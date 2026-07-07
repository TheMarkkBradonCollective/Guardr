import { useEffect, useCallback } from 'react';
import { flushOfflineQueue, installOfflineSyncListener, type OfflineSyncResult } from '../lib/platform/offlineSync';

export function useOfflineSync(guardId?: string, onFlush?: (result: OfflineSyncResult) => void) {
  useEffect(() => {
    if (!guardId) return;
    return installOfflineSyncListener(guardId, onFlush);
  }, [guardId, onFlush]);

  const flushNow = useCallback(async () => flushOfflineQueue(guardId), [guardId]);

  return { flushNow };
}
