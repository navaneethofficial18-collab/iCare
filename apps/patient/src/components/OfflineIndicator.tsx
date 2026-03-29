"use client";
import { useState, useEffect } from "react";
import { useSyncEngine } from "@/hooks/useSyncEngine";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  useSyncEngine();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-primary text-white text-center text-sm z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-transform animate-in slide-in-from-bottom">
      You are currently offline. Actions are being saved locally and will sync when connection is restored.
    </div>
  );
}
