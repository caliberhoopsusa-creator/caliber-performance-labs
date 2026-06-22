// client/src/config/tokens.ts
// SINGLE SOURCE OF TRUTH for all design tokens (colors, spacing, typography, shadows).
// Every color used in the app should reference a token here or a CSS variable in index.css.
// Run: grep -rn "#[0-9a-fA-F]\{6\}" client/src/ --include="*.tsx" --include="*.ts"
// to audit for escaped hardcoded hex values that need to be migrated here.

export const tokens = {
  // COLOR PALETTE
  colors: {
    primary: '#4f6878',
    primaryDark: '#3d5262',
    primaryLight: '#C6D0D8',

    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },

    semantic: {
      success: '#10b981',
      warning: '#C6D0D8',
      error: '#ef4444',
      info: '#3b82f6',
    },

    // Computed for text/background based on theme
    text: {
      primary: 'var(--foreground)',
      secondary: 'var(--muted-foreground)',
      inverse: '#ffffff',
    },

    bg: {
      primary: 'var(--background)',
      secondary: 'var(--card)',
      dark: '#0a0a0a',
    },

    border: 'var(--border)',
  },

  // TYPOGRAPHY
  typography: {
    fonts: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"Fira Code", monospace',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // SPACING (8px base)
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },

  // SHADOW & BORDERS
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  // ANIMATIONS
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // GRADIENTS (Pre-configured)
  gradients: {
    hero: {
      from: '#4f6878',
      to: '#1a2d38',
      angle: '135deg',
    },
    subtle: {
      from: '#4f6878',
      to: '#3d5262',
      angle: '90deg',
    },
  },
} as const;

// Type-safe token access
export type Tokens = typeof tokens;

// Helper to get nested token values
export const getToken = (path: string) => {
  return path.split('.').reduce((obj: any, key) => obj?.[key], tokens);
};
