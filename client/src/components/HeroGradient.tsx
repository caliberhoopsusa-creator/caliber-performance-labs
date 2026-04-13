// client/src/components/HeroGradient.tsx

import { ReactNode, CSSProperties } from 'react';
import { tokens } from '../config/tokens';
import { commonStyles } from '../utils/createStyledComponent';

interface HeroGradientProps {
  children: ReactNode;
  minHeight?: string;
}

export function HeroGradient({ children, minHeight = '100vh' }: HeroGradientProps) {
  const styles: Record<string, CSSProperties> = {
    wrapper: {
      position: 'relative',
      overflow: 'hidden',
      minHeight,
    },
    gradient: {
      ...commonStyles.absoluteFill,
      background: 'radial-gradient(ellipse at 60% 40%, #1a1a2e 0%, #0d0d1a 40%, #000000 100%)',
      zIndex: 0,
    },
    overlay: {
      ...commonStyles.absoluteFill,
      background: 'linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.7) 100%)',
      zIndex: 1,
    },
    content: {
      ...commonStyles.flexCenter,
      position: 'relative',
      zIndex: 2,
      flexDirection: 'column',
      textAlign: 'center',
      padding: `${tokens.spacing['4xl']} ${tokens.spacing.lg}`,
      minHeight,
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.gradient} />
      <div style={styles.overlay} />
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}
