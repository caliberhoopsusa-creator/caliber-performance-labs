import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { WifiOff, X } from "lucide-react";
import { useOffline } from "@/hooks/use-offline";
import { Button } from "@/components/ui/button";

export function OfflineBanner() {
  const { isOffline } = useOffline();
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setDismissed(false);
  }, [location]);

  useEffect(() => {
    if (!isOffline) {
      setDismissed(false);
    }
  }, [isOffline]);

  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 flex items-center justify-center gap-3"
      data-testid="banner-offline"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium">
        You're offline - some features may be limited
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-white hover:bg-orange-600"
        onClick={() => setDismissed(true)}
        data-testid="button-dismiss-offline"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function OfflineIndicator() {
  const { isOffline } = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div 
      className="flex items-center gap-1.5 text-orange-500"
      title="Offline mode - using cached data"
      data-testid="indicator-offline"
    >
      <WifiOff className="w-4 h-4" />
      <span className="text-xs hidden sm:inline">Offline</span>
    </div>
  );
}
