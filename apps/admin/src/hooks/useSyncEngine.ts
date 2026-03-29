"use client";
import { useEffect, useCallback } from "react";
import { localDb } from "@/lib/db/indexeddb";

export function useSyncEngine() {
  const syncWithServer = useCallback(async () => {
    if (!navigator.onLine) return;

    const pending = await localDb.pendingActions.where('status').equals('pending').toArray();
    if (pending.length === 0) return;

    for (const action of pending) {
      try {
        const response = await fetch(action.payload.url, {
          method: action.payload.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload.data),
        });

        if (response.ok) {
          await localDb.pendingActions.delete(action.id!);
        } else {
          await localDb.pendingActions.update(action.id!, { 
            status: 'failed', 
            retryCount: action.retryCount + 1 
          });
        }
      } catch (err) {
        await localDb.pendingActions.update(action.id!, { 
          retryCount: action.retryCount + 1 
        });
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("online", syncWithServer);
    // Background sync polling fallback
    const interval = setInterval(syncWithServer, 30000);

    return () => {
      window.removeEventListener("online", syncWithServer);
      clearInterval(interval);
    };
  }, [syncWithServer]);

  return { syncWithServer };
}
