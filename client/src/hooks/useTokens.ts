// client/src/hooks/useTokens.ts

import { tokens } from '../config/tokens';
import { useMemo } from 'react';

/**
 * Hook to get tokens with memoization
 * Prevents unnecessary re-renders
 */
export function useTokens() {
  return useMemo(() => tokens, []);
}

/**
 * Hook for theme-aware styling
 */
export function useThemeStyles() {
  return useMemo(
    () => ({
      text: 'var(--text-primary)',
      textSecondary: 'var(--text-secondary)',
      background: 'var(--bg-primary)',
      backgroundSecondary: 'var(--bg-secondary)',
      border: 'var(--border-color)',
    }),
    []
  );
}
