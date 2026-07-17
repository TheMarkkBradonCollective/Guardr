import { enqueueOfflineRecord } from './offlineQueue';

export async function captureGuardSelfAuditOffline(
  guardId: string,
  requestId: string,
  payload: unknown,
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine) return false;
  await enqueueOfflineRecord({
    guardId,
    requestId,
    type: 'self-audit',
    payload,
  });
  return true;
}

export async function captureGuardIncidentOffline(
  guardId: string,
  requestId: string,
  payload: unknown,
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine) return false;
  await enqueueOfflineRecord({
    guardId,
    requestId,
    type: 'incident-report',
    payload,
  });
  return true;
}

export async function captureGuardActivityOffline(
  guardId: string,
  requestId: string,
  payload: unknown,
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine) return false;
  await enqueueOfflineRecord({
    guardId,
    requestId,
    type: 'activity-report',
    payload,
  });
  return true;
}
