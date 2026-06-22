// client/src/components/Section.tsx

import { ReactNode, CSSProperties } from 'react';
import { tokens } from '../config/tokens';
import { commonStyles } from '../utils/createStyledComponent';

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  gradient?: boolean;
}

export function Section({ title, description, children, gradient }: SectionProps) {
  const styles: Record<string, CSSProperties> = {
    wrapper: {
      position: 'relative',
      paddingTop: tokens.spacing['3xl'],
      paddingBottom: tokens.spacing['3xl'],
      paddingLeft: tokens.spacing.lg,
      paddingRight: tokens.spacing.lg,
      backgroundColor: tokens.colors.bg.primary,
    },
    content: {
      maxWidth: '80rem',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: tokens.spacing['3xl'],
    },
    titleStyle: {
      fontSize: tokens.typography.sizes['4xl'],
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.md,
      ...commonStyles.textHeading,
    },
    descriptionStyle: {
      fontSize: tokens.typography.sizes.lg,
      color: tokens.colors.text.secondary,
      maxWidth: '42rem',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  };

  return (
    <section style={styles.wrapper}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h2 style={styles.titleStyle}>{title}</h2>
          {description && <p style={styles.descriptionStyle}>{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
