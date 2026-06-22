import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { tokens } from "@/config/tokens";

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
  themeName: string | null;
  refreshTheme: () => void;
}

const DEFAULT_ACCENT_COLOR = tokens.colors.primaryLight; // platinum #C6D0D8

const ThemeContext = createContext<ThemeContextValue>({
  themeData: null,
  isLoading: false,
  accentColor: DEFAULT_ACCENT_COLOR,
  themeName: null,
  refreshTheme: () => {},
});

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { h: 24, s: 95, l: 53 };
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

function applyAccentColor(hexColor: string, isCustomTheme: boolean) {
  const hsl = hexToHSL(hexColor);
  const root = document.documentElement;

  // Determine foreground: dark text on light accent colors (lightness > 60)
  const accentForeground = hsl.l > 60 ? "0 0% 5%" : "0 0% 100%";

  // Core accent colors — always applied regardless of custom theme
  root.style.setProperty("--accent", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  root.style.setProperty("--accent-foreground", accentForeground);

  const darkerL = Math.max(hsl.l - 10, 10);
  root.style.setProperty("--accent-border", `${hsl.h} ${hsl.s}% ${darkerL}%`);

  const lighterL = Math.min(hsl.l + 20, 95);
  const lighterS = Math.max(hsl.s - 10, 20);
  root.style.setProperty("--accent-hover", `${hsl.h} ${lighterS}% ${lighterL}%`);

  // Sidebar accent — always applied regardless of custom theme
  root.style.setProperty("--sidebar-accent", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  root.style.setProperty("--sidebar-accent-foreground", accentForeground);
  root.style.setProperty("--sidebar-accent-border", `${hsl.h} ${hsl.s}% ${darkerL}%`);
  
  // Premium theme effects - only apply when user has a custom theme
  if (isCustomTheme) {
    // Glow effects
    root.style.setProperty("--theme-glow", `0 0 20px hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.4)`);
    root.style.setProperty("--theme-glow-intense", `0 0 30px hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.6), 0 0 60px hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.3)`);
    root.style.setProperty("--theme-glow-subtle", `0 0 15px hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.25)`);
    
    // Border glow
    root.style.setProperty("--theme-border-glow", `0 0 10px hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.5)`);
    
    // Gradient backgrounds
    root.style.setProperty("--theme-gradient", `linear-gradient(135deg, hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.15) 0%, transparent 100%)`);
    root.style.setProperty("--theme-gradient-intense", `linear-gradient(135deg, hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.25) 0%, hsla(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 20, 10)}%, 0.1) 100%)`);
    
    // Text shadow for headers
    root.style.setProperty("--theme-text-glow", `0 0 10px hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.5)`);
    
    // Ring color for focus states
    root.style.setProperty("--theme-ring", `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.5)`);
    
    // Enable theme effects
    root.classList.add("theme-active");
  } else {
    // Remove custom theme effects
    root.style.removeProperty("--theme-glow");
    root.style.removeProperty("--theme-glow-intense");
    root.style.removeProperty("--theme-glow-subtle");
    root.style.removeProperty("--theme-border-glow");
    root.style.removeProperty("--theme-gradient");
    root.style.removeProperty("--theme-gradient-intense");
    root.style.removeProperty("--theme-text-glow");
    root.style.removeProperty("--theme-ring");
    root.classList.remove("theme-active");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentAccentColor, setCurrentAccentColor] = useState<string>(DEFAULT_ACCENT_COLOR);
  const [themeName, setThemeName] = useState<string | null>(null);

  const { data: themeData, isLoading, isError } = useQuery<ThemeData>({
    queryKey: ["/api/shop/active-theme"],
    enabled: !!user && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (themeData?.active && themeData?.accentColor) {
      applyAccentColor(themeData.accentColor, true);
      setCurrentAccentColor(themeData.accentColor);
      setThemeName(themeData.theme?.name || null);
    } else {
      applyAccentColor(DEFAULT_ACCENT_COLOR, false);
      setCurrentAccentColor(DEFAULT_ACCENT_COLOR);
      setThemeName(null);
    }
  }, [themeData, isError]);

  useEffect(() => {
    if (!user) {
      applyAccentColor(DEFAULT_ACCENT_COLOR, false);
      setCurrentAccentColor(DEFAULT_ACCENT_COLOR);
      setThemeName(null);
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
        themeName,
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
