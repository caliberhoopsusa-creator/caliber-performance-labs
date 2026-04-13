import { cn } from "@/lib/utils";

const SIZES = { sm: 24, md: 40, lg: 56 };

export function SportSpinner({ 
  size = "md", 
  sport: sportProp, 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  sport?: "basketball";
  className?: string;
}) {
  const px = SIZES[size];
  return <BasketballSpinner size={px} className={className} />;
}

function BasketballSpinner({ size, className }: { size: number; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)} data-testid="spinner-basketball">
      <style>{`
        @keyframes basketball-bounce {
          0%, 100% { transform: translateY(0) scaleX(1) scaleY(1); }
          15% { transform: translateY(-${size * 0.6}px) scaleX(1) scaleY(1); }
          50% { transform: translateY(0) scaleX(1.05) scaleY(0.9); }
          55% { transform: translateY(0) scaleX(1) scaleY(1); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: scaleX(1); opacity: 0.3; }
          15% { transform: scaleX(0.6); opacity: 0.1; }
          50% { transform: scaleX(1.1); opacity: 0.4; }
        }
      `}</style>
      <svg 
        width={size} height={size} viewBox="0 0 40 40"
        style={{ animation: "basketball-bounce 0.8s ease-in-out infinite" }}
      >
        <circle cx="20" cy="20" r="18" fill="#4f6878" />
        <path d="M2 20 Q20 16 38 20" stroke="#C2410C" strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M20 2 Q16 20 20 38" stroke="#C2410C" strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M6 8 Q14 20 6 32" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M34 8 Q26 20 34 32" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.4" />
      </svg>
      <div 
        className="rounded-full bg-accent/20 mt-1"
        style={{ 
          width: size * 0.6, 
          height: size * 0.1,
          animation: "shadow-pulse 0.8s ease-in-out infinite"
        }} 
      />
    </div>
  );
}


export function SportSpinnerPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-20", className)} data-testid="loading-spinner-page">
      <SportSpinner size="lg" />
    </div>
  );
}
