// client/src/components/Card.tsx

import { CSSProperties, useState } from 'react';
import { tokens } from '../config/tokens';

interface CardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  gradient?: boolean;
}

export function Card({ title, description, icon, gradient = true }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Pre-computed styles for performance
  const styles: Record<string, CSSProperties> = {
    container: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: tokens.radius.lg,
      border: `1px solid ${tokens.colors.border}`,
      transition: tokens.transitions.normal,
      cursor: 'pointer',
    },
    gradientLayer: {
      position: 'absolute',
      inset: 0,
      opacity: isHovered ? 1 : 0,
      transition: `opacity ${tokens.transitions.normal}`,
    },
    content: {
      position: 'relative',
      zIndex: 10,
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.bg.primary,
      backdropFilter: 'blur(8px)',
      transition: `all ${tokens.transitions.normal}`,
    },
    iconBox: {
      marginBottom: tokens.spacing.md,
      fontSize: '2rem',
    },
    title: {
      fontSize: tokens.typography.sizes.xl,
      fontWeight: tokens.typography.weights.bold,
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.sm,
    },
    description: {
      fontSize: tokens.typography.sizes.base,
      color: tokens.colors.text.secondary,
      lineHeight: tokens.typography.lineHeights.normal,
    },
  };

  return (
    <div
      style={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {gradient && isHovered && (
        <div style={{
          ...styles.gradientLayer,
          background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.15) 0%, transparent 70%)',
        }} />
      )}

      <div style={styles.content}>
        {icon && <div style={styles.iconBox}>{icon}</div>}
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.description}>{description}</p>
      </div>
    </div>
  );
}
