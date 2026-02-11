import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("caliber-theme");
      if (stored) return stored === "dark";
      return true;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("caliber-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setIsDark(!isDark)}
      data-testid="button-theme-toggle"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
