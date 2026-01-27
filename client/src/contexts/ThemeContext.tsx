import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface ThemeData {
  active: boolean;
  theme: {
    id: number;
    name: string;
    type: string;
    value: string;
    category: string;
  } | null;
  accentColor: string;
}

interface ThemeContextValue {
  themeData: ThemeData | null;
  isLoading: boolean;
  accentColor: string;
  refreshTheme: () => void;
}

const DEFAULT_ACCENT_COLOR = "#00D4FF";

const ThemeContext = createContext<ThemeContextValue>({
  themeData: null,
  isLoading: false,
  accentColor: DEFAULT_ACCENT_COLOR,
  refreshTheme: () => {},
});

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { h: 186, s: 100, l: 50 };
  }

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function applyAccentColor(hexColor: string) {
  const hsl = hexToHSL(hexColor);
  const root = document.documentElement;
  
  root.style.setProperty("--accent", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  root.style.setProperty("--accent-foreground", "0 0% 100%");
  
  const darkerL = Math.max(hsl.l - 10, 10);
  root.style.setProperty("--accent-border", `${hsl.h} ${hsl.s}% ${darkerL}%`);
  
  const lighterL = Math.min(hsl.l + 20, 95);
  const lighterS = Math.max(hsl.s - 10, 20);
  root.style.setProperty("--accent-hover", `${hsl.h} ${lighterS}% ${lighterL}%`);
  
  root.style.setProperty("--sidebar-accent", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  root.style.setProperty("--sidebar-accent-foreground", "0 0% 100%");
  root.style.setProperty("--sidebar-accent-border", `${hsl.h} ${hsl.s}% ${darkerL}%`);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentAccentColor, setCurrentAccentColor] = useState(DEFAULT_ACCENT_COLOR);

  const { data: themeData, isLoading, isError } = useQuery<ThemeData>({
    queryKey: ["/api/shop/active-theme"],
    enabled: !!user && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      applyAccentColor(DEFAULT_ACCENT_COLOR);
      setCurrentAccentColor(DEFAULT_ACCENT_COLOR);
      return;
    }
    
    const accentColor = themeData?.accentColor || DEFAULT_ACCENT_COLOR;
    setCurrentAccentColor(accentColor);
    applyAccentColor(accentColor);
  }, [themeData, isError]);

  useEffect(() => {
    if (!user) {
      applyAccentColor(DEFAULT_ACCENT_COLOR);
      setCurrentAccentColor(DEFAULT_ACCENT_COLOR);
    }
  }, [user]);

  const refreshTheme = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/shop/active-theme"] });
  }, [queryClient]);

  return (
    <ThemeContext.Provider
      value={{
        themeData: themeData || null,
        isLoading: isLoading || authLoading,
        accentColor: currentAccentColor,
        refreshTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
