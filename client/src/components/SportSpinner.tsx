import { useSport } from "@/components/SportToggle";
import { cn } from "@/lib/utils";

const SIZES = { sm: 24, md: 40, lg: 56 };

export function SportSpinner({ 
  size = "md", 
  sport: sportProp, 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  sport?: "basketball" | "football"; 
  className?: string;
}) {
  let detectedSport: string = "basketball";
  try {
    detectedSport = useSport();
  } catch {
    // useSport might not be in context
  }
  const sport = sportProp || detectedSport;
  const px = SIZES[size];

  if (sport === "football") {
    return <FootballSpinner size={px} className={className} />;
  }
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
        <circle cx="20" cy="20" r="18" fill="#F97316" />
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

function FootballSpinner({ size, className }: { size: number; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)} data-testid="spinner-football">
      <style>{`
        @keyframes football-spiral {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(90deg) translateY(-${size * 0.2}px); }
          50% { transform: rotate(180deg) translateY(0); }
          75% { transform: rotate(270deg) translateY(-${size * 0.2}px); }
          100% { transform: rotate(360deg) translateY(0); }
        }
      `}</style>
      <svg 
        width={size} height={size * 0.6} viewBox="0 0 50 30"
        style={{ animation: "football-spiral 1s linear infinite" }}
      >
        <ellipse cx="25" cy="15" rx="22" ry="12" fill="#92400E" stroke="#78350F" strokeWidth="1.5" />
        <line x1="25" y1="6" x2="25" y2="24" stroke="#FEFCE8" strokeWidth="1.2" opacity="0.8" />
        <line x1="22" y1="9" x2="28" y2="9" stroke="#FEFCE8" strokeWidth="0.8" opacity="0.7" />
        <line x1="21.5" y1="12" x2="28.5" y2="12" stroke="#FEFCE8" strokeWidth="0.8" opacity="0.7" />
        <line x1="21.5" y1="18" x2="28.5" y2="18" stroke="#FEFCE8" strokeWidth="0.8" opacity="0.7" />
        <line x1="22" y1="21" x2="28" y2="21" stroke="#FEFCE8" strokeWidth="0.8" opacity="0.7" />
        <ellipse cx="25" cy="15" rx="22" ry="12" fill="none" stroke="#78350F" strokeWidth="0.5" opacity="0.3" />
      </svg>
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
