/**
 * Offline field-mode queue — design foundation for guard self-audits,
 * incident reports, and activity logs that sync when connectivity returns.
 */

export type OfflineRecordType = 'self-audit' | 'incident-report' | 'activity-report' | 'job-snapshot';

export interface OfflineRecord<T = unknown> {
  id: string;
  guardId: string;
  requestId: string;
  type: OfflineRecordType;
  payload: T;
  createdAt: string;
  synced: boolean;
}

const DB_NAME = 'guardr-offline';
const DB_VERSION = 1;
const STORE = 'queue';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('guardId', 'guardId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

export async function enqueueOfflineRecord<T>(
  record: Omit<OfflineRecord<T>, 'id' | 'createdAt' | 'synced'>
): Promise<OfflineRecord<T>> {
  const entry: OfflineRecord<T> = {
    ...record,
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return entry;
}

export async function getPendingOfflineRecords(guardId?: string): Promise<OfflineRecord[]> {
  const db = await openDb();
  const records = await new Promise<OfflineRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const request = guardId ? store.index('guardId').getAll(guardId) : store.getAll();
    request.onsuccess = () => resolve(request.result as OfflineRecord[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records.filter((r) => !r.synced);
}

export async function markOfflineRecordSynced(id: string): Promise<void> {
  const db = await openDb();
  const record = await new Promise<OfflineRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result as OfflineRecord | undefined);
    request.onerror = () => reject(request.error);
  });
  if (record) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ ...record, synced: true });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  db.close();
}
