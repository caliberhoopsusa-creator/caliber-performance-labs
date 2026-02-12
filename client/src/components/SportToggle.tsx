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

export function SportProvider({ children }: { children: ReactNode }) {
  return (
    <SportContext.Provider value={{ sport: 'basketball', setSport: () => {} }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): Sport {
  return 'basketball';
}

export function useSportContext(): SportContextType {
  return { sport: 'basketball', setSport: () => {} };
}

interface SportToggleProps {
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'default';
}

export function SportToggle({ className, showLabels = true, size = 'default' }: SportToggleProps) {
  return null;
}
