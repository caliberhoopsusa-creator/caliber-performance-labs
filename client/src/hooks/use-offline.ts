import { useState, useEffect, useCallback } from "react";
import { syncQueuedMutations } from "@/lib/offlineStorage";
import { queryClient } from "@/lib/queryClient";

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineAt: Date | null;
  isSyncing?: boolean;
}

export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleOnline = useCallback(async () => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
    
    // Sync queued mutations when coming back online
    setIsSyncing(true);
    try {
      await syncQueuedMutations();
      // Invalidate queries to refresh data after sync
      queryClient.invalidateQueries();
    } catch (error) {
      console.error("Failed to sync mutations:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineAt,
    isSyncing,
  };
}
