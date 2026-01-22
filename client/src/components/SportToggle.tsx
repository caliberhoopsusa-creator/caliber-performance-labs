import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Sport = 'basketball' | 'football';

interface SportToggleProps {
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'default';
}

export function SportToggle({ className, showLabels = true, size = 'default' }: SportToggleProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentSport, setCurrentSport] = useState<Sport>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('caliber_sport');
      return (stored as Sport) || 'basketball';
    }
    return 'basketball';
  });

  const updateSportMutation = useMutation({
    mutationFn: async (sport: Sport) => {
      if (user) {
        const res = await apiRequest("PATCH", "/api/user/sport", { sport });
        return res.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/discover"] });
    },
  });

  const handleSportChange = (sport: Sport) => {
    if (sport === currentSport) return;
    
    if (!isPro && sport !== currentSport) {
      toast({
        title: "Multi-Sport Pass Required",
        description: "Upgrade to Pro to access both basketball and football.",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentSport(sport);
    localStorage.setItem('caliber_sport', sport);
    updateSportMutation.mutate(sport);
    
    toast({
      title: `Switched to ${sport === 'basketball' ? 'Basketball' : 'Football'}`,
      description: "Content is now filtered for your selected sport.",
    });
  };

  useEffect(() => {
    const stored = localStorage.getItem('caliber_sport');
    if (stored && (stored === 'basketball' || stored === 'football')) {
      setCurrentSport(stored);
    }
  }, []);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonPadding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-2';

  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-background/50 border border-border/50", className)}>
      <Button
        variant={currentSport === 'basketball' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSportChange('basketball')}
        className={cn(
          buttonPadding,
          "relative transition-all duration-200",
          currentSport === 'basketball' && "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
        )}
        data-testid="sport-toggle-basketball"
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M12 2C12 12 12 12 12 22" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 12C12 12 12 12 22 12" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4.5 4.5C8 8 8 16 4.5 19.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M19.5 4.5C16 8 16 16 19.5 19.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
        {showLabels && <span className="ml-1.5 text-xs font-medium">Basketball</span>}
      </Button>
      
      <Button
        variant={currentSport === 'football' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSportChange('football')}
        className={cn(
          buttonPadding,
          "relative transition-all duration-200",
          currentSport === 'football' && "bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-lg shadow-amber-700/25"
        )}
        data-testid="sport-toggle-football"
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(-30 12 12)"/>
          <path d="M7 12L17 12" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 10L9 14" stroke="currentColor" strokeWidth="1"/>
          <path d="M11 9L11 15" stroke="currentColor" strokeWidth="1"/>
          <path d="M13 9L13 15" stroke="currentColor" strokeWidth="1"/>
          <path d="M15 10L15 14" stroke="currentColor" strokeWidth="1"/>
        </svg>
        {showLabels && <span className="ml-1.5 text-xs font-medium">Football</span>}
        {!isPro && currentSport !== 'football' && (
          <Lock className="w-3 h-3 ml-1 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

export function useSport(): Sport {
  const [sport, setSport] = useState<Sport>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('caliber_sport');
      return (stored as Sport) || 'basketball';
    }
    return 'basketball';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('caliber_sport');
      if (stored && (stored === 'basketball' || stored === 'football')) {
        setSport(stored);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const stored = localStorage.getItem('caliber_sport');
      if (stored && stored !== sport) {
        setSport(stored as Sport);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [sport]);

  return sport;
}
