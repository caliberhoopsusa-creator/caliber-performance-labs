// client/src/components/sections/GradientDivider.tsx

interface GradientDividerProps {
  variant?: 'amber' | 'subtle' | 'fade';
  className?: string;
}

export function GradientDivider({ variant = 'amber', className = '' }: GradientDividerProps) {
  const gradients = {
    amber: 'linear-gradient(90deg, transparent 0%, rgba(198,208,216,0.4) 30%, rgba(198,208,216,0.6) 50%, rgba(198,208,216,0.4) 70%, transparent 100%)',
    subtle: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)',
    fade: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className="h-px w-full"
        style={{ background: gradients[variant] }}
      />
      {variant === 'amber' && (
        <div
          className="h-px w-full mt-px opacity-40"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(198,208,216,0.2) 30%, rgba(198,208,216,0.3) 50%, rgba(198,208,216,0.2) 70%, transparent 100%)',
            filter: 'blur(2px)',
          }}
        />
      )}
    </div>
  );
}
