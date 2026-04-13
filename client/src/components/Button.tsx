// client/src/components/Button.tsx

import { ButtonHTMLAttributes, CSSProperties, useMemo } from 'react';
import { tokens } from '../config/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: tokens.colors.primary,
    color: tokens.colors.text.inverse,
  },
  secondary: {
    backgroundColor: tokens.colors.neutral[200],
    color: tokens.colors.text.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    color: tokens.colors.primary,
    border: `2px solid ${tokens.colors.primary}`,
  },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    fontSize: tokens.typography.sizes.sm,
  },
  md: {
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    fontSize: tokens.typography.sizes.base,
  },
  lg: {
    padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
    fontSize: tokens.typography.sizes.lg,
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  children,
  ...props
}: ButtonProps) {
  // Memoize styles to prevent recalculation
  const styles = useMemo<CSSProperties>(() => ({
    fontFamily: tokens.typography.fonts.sans,
    fontWeight: tokens.typography.weights.semibold,
    border: 'none',
    borderRadius: tokens.radius.md,
    cursor: 'pointer',
    transition: tokens.transitions.normal,
    width: full ? '100%' : 'auto',
    ...variantStyles[variant],
    ...sizeStyles[size],
  }), [variant, size, full]);

  return (
    <button style={styles} {...props}>
      {children}
    </button>
  );
}
