import { Crown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedRankBadgeProps {
  type: 'state' | 'country';
  rank: number;
  state?: string;
  className?: string;
}

export function AnimatedRankBadge({ type, rank, state, className }: AnimatedRankBadgeProps) {
  const isState = type === 'state';
  const color = isState ? '#D4AF37' : '#3B82F6';
  const colorRgb = isState ? '212,175,55' : '59,130,246';
  const label = isState ? `#${rank} IN ${state}` : `#${rank} IN USA`;

  return (
    <div 
      className={cn(
        "relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full overflow-hidden",
        "font-bold text-lg tracking-wide cursor-default select-none",
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)',
      }}
      data-testid={isState ? "state-rank-badge" : "country-rank-badge"}
    >
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${color}`,
          animation: 'rankBadgePulse 2s ease-in-out infinite',
        }}
      />
      
      <div 
        className="absolute inset-0 rounded-full opacity-60"
        style={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          animation: 'rankBadgeGlow 2s ease-in-out infinite',
        }}
      />

      <div 
        className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(${colorRgb},0.3) 50%, transparent 100%)`,
            animation: 'rankBadgeShimmer 3s linear infinite',
          }}
        />
      </div>

      <div 
        className="absolute inset-0 overflow-hidden rounded-full pointer-events-none opacity-40"
      >
        <div 
          className="absolute w-full h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${colorRgb},0.8), transparent)`,
            animation: 'rankBadgeScan 2s linear infinite',
          }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 6px ${color}`,
              animation: `rankBadgeOrbit ${3 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
              transformOrigin: 'center center',
              left: '50%',
              top: '50%',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-0"
            style={{
              background: color,
              boxShadow: `0 0 4px ${color}`,
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animation: `rankBadgeSparkle 2s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      <div 
        className="absolute -inset-1 rounded-full opacity-30 blur-md pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(${colorRgb},0.4) 0%, transparent 70%)`,
          animation: 'rankBadgeAmbient 3s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 flex items-center gap-2.5">
        {isState ? (
          <Crown 
            className="w-5 h-5" 
            style={{ 
              color,
              filter: `drop-shadow(0 0 6px ${color})`,
              animation: 'rankBadgeIconFloat 2s ease-in-out infinite',
            }} 
          />
        ) : (
          <Globe 
            className="w-5 h-5" 
            style={{ 
              color,
              filter: `drop-shadow(0 0 6px ${color})`,
              animation: 'rankBadgeIconSpin 8s linear infinite',
            }} 
          />
        )}
        <span 
          style={{ 
            color,
            textShadow: `0 0 10px rgba(${colorRgb},0.5)`,
          }}
        >
          {label}
        </span>
      </div>

      <style>{`
        @keyframes rankBadgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        
        @keyframes rankBadgeGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes rankBadgeShimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes rankBadgeScan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        
        @keyframes rankBadgeOrbit {
          0% { 
            transform: rotate(0deg) translateX(50px) rotate(0deg) scale(0.5);
            opacity: 0;
          }
          10% { opacity: 0.8; }
          50% { transform: rotate(180deg) translateX(50px) rotate(-180deg) scale(1); }
          90% { opacity: 0.8; }
          100% { 
            transform: rotate(360deg) translateX(50px) rotate(-360deg) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes rankBadgeSparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes rankBadgeAmbient {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes rankBadgeIconFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-5deg); }
          75% { transform: translateY(2px) rotate(5deg); }
        }
        
        @keyframes rankBadgeIconSpin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
