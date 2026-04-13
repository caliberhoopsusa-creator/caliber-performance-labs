interface GradientAccentProps {
  opacity?: number;
  className?: string;
}

/**
 * Small decorative gradient accent.
 * Place inside a `relative overflow-hidden` parent — it fills the container
 * at very low opacity so it reads as a subtle texture, not a hero.
 */
export function GradientAccent({ opacity = 0.18, className = "" }: GradientAccentProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity,
        background: 'radial-gradient(ellipse at 30% 50%, #ff6b35 0%, #8b4513 40%, #000000 100%)',
      }}
      aria-hidden
    />
  );
}
