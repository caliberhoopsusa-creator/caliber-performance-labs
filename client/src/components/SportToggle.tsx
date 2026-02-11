import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Sport = 'basketball' | 'football';

interface SportContextType {
  sport: Sport;
  setSport: (sport: Sport) => void;
}

const SportContext = createContext<SportContextType | null>(null);

function getInitialSport(): Sport {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('caliber_sport');
    if (stored === 'basketball' || stored === 'football') {
      return stored;
    }
  }
  return 'basketball';
}

export function SportProvider({ children }: { children: ReactNode }) {
  const [sport, setSportState] = useState<Sport>(getInitialSport);

  const setSport = useCallback((newSport: Sport) => {
    setSportState(newSport);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caliber_sport', newSport);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('caliber_sport');
    if (stored && (stored === 'basketball' || stored === 'football')) {
      if (stored !== sport) {
        setSportState(stored);
      }
    }
  }, []);

  return (
    <SportContext.Provider value={{ sport, setSport }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): Sport {
  const context = useContext(SportContext);
  if (!context) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('caliber_sport');
      return (stored as Sport) || 'basketball';
    }
    return 'basketball';
  }
  return context.sport;
}

export function useSportContext(): SportContextType {
  const context = useContext(SportContext);
  if (!context) {
    throw new Error('useSportContext must be used within SportProvider');
  }
  return context;
}

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
  const context = useContext(SportContext);
  
  const [localSport, setLocalSport] = useState<Sport>(getInitialSport);
  
  const currentSport = context?.sport ?? localSport;

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
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-events"] });
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
    
    if (context) {
      context.setSport(sport);
    } else {
      setLocalSport(sport);
      localStorage.setItem('caliber_sport', sport);
    }
    
    updateSportMutation.mutate(sport);
    
    toast({
      title: `Switched to ${sport === 'basketball' ? 'Basketball' : 'Football'}`,
      description: "Content is now filtered for your selected sport.",
    });
  };

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
          currentSport === 'basketball' && "bg-gradient-to-r from-accent to-accent/90 text-accent-foreground shadow-lg shadow-accent/25"
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
          currentSport === 'football' && "bg-gradient-to-r from-accent/80 to-accent/70 text-accent-foreground shadow-lg shadow-accent/25"
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
