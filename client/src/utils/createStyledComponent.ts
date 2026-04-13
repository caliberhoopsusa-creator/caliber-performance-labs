// client/src/utils/createStyledComponent.ts

import { CSSProperties } from 'react';
import { tokens } from '../config/tokens';

/**
 * Factory function to create consistent styled components
 * Reduces code duplication and ensures consistency
 */
export function createStyles(styleObj: Record<string, CSSProperties>) {
  return styleObj;
}

// Pre-defined style collections
export const commonStyles = {
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  cardBase: {
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.colors.border}`,
    boxShadow: tokens.shadows.sm,
    transition: tokens.transitions.normal,
  },

  buttonBase: {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    borderRadius: tokens.radius.md,
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.semibold,
    border: 'none',
    cursor: 'pointer',
    transition: tokens.transitions.normal,
  },

  textBase: {
    fontFamily: tokens.typography.fonts.sans,
    lineHeight: tokens.typography.lineHeights.normal,
  },

  textHeading: {
    fontFamily: tokens.typography.fonts.sans,
    fontWeight: tokens.typography.weights.bold,
    lineHeight: tokens.typography.lineHeights.tight,
  },
};
