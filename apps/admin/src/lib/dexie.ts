import Dexie, { Table } from "dexie";

// Offline sync log item
export interface SyncQueueItem {
  id?: number;
  url: string;
  method: string;
  payload: any;
  timestamp: Date;
}

// Cached DB data
export interface CachedData {
  id?: number;
  key: string;
  data: any;
  updatedAt: Date;
}

export class CareSyncIndexedDB extends Dexie {
  syncQueue!: Table<SyncQueueItem, number>;
  cache!: Table<CachedData, number>;

  constructor() {
    super("CareSyncOfflineDB");
    this.version(1).stores({
      syncQueue: "++id, url, timestamp",
      cache: "++id, key", // For caching specific endpoints when offline
    });
  }
}

export const localDB = new CareSyncIndexedDB();

/**
 * Queue an HTTP Request to be fired when connection is restored.
 */
export async function queueRequest(url: string, method: string, payload: any) {
  await localDB.syncQueue.add({
    url,
    method,
    payload,
    timestamp: new Date()
  });
}

/**
 * Cache JSON responses for offline viewing
 */
export async function setCache(key: string, data: any) {
  // Overwrite existing
  const existing = await localDB.cache.where("key").equals(key).first();
  if (existing && existing.id) {
    await localDB.cache.update(existing.id, { data, updatedAt: new Date() });
  } else {
    await localDB.cache.add({ key, data, updatedAt: new Date() });
  }
}

export async function getCache(key: string) {
  const record = await localDB.cache.where("key").equals(key).first();
  return record?.data || null;
}
