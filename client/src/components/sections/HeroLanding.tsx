// client/src/components/sections/HeroLanding.tsx

import { CSSProperties } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Play, TrendingUp, Shield, Star } from 'lucide-react';

const floatingStats = [
  { label: 'Performance Grade', value: 'A+', icon: <Star className="w-4 h-4" />, delay: '0s' },
  { label: 'Points Per Game', value: '24.6', icon: <TrendingUp className="w-4 h-4" />, delay: '0.8s' },
  { label: 'Scout Views', value: '142', icon: <Shield className="w-4 h-4" />, delay: '0.4s' },
];

export function HeroLanding() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0" style={{ background: '#080808' }} />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at 60% 30%, rgba(198,208,216,0.12) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(139,69,19,0.08) 0%, transparent 40%)',
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container-wide relative z-10 pt-32 pb-20 w-full">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-amber-400">Multi-Sport Analytics Platform</span>
          </div>

          {/* Headline */}
          <h1
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 animate-fade-up"
            style={{ animationDelay: '0.1s', animationFillMode: 'both' } as CSSProperties}
          >
            <span className="text-white">Track Every </span>
            <span className="text-gradient">Rep.</span>
            <br />
            <span className="text-white">Elevate Every </span>
            <span className="text-gradient">Game.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-10 animate-fade-up"
            style={{ animationDelay: '0.2s', animationFillMode: 'both' } as CSSProperties}
          >
            Caliber gives athletes and coaches professional-grade analytics — AI performance grades,
            highlight reels, recruiting tools, and real-time stat tracking. All in one platform.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 animate-fade-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'both' } as CSSProperties}
          >
            <Link href="/login">
              <button
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5 glow-amber"
                style={{
                  background: 'linear-gradient(135deg, #4f6878 0%, #3d5262 100%)',
                  color: '#fff',
                }}
              >
                Start for Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border border-white/12 text-foreground transition-all duration-200 hover:border-white/20 hover:bg-white/5"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Play className="w-4 h-4" style={{ color: '#4f6878' }} />
              See It In Action
            </button>
          </div>

          {/* Social proof */}
          <div
            className="flex items-center gap-6 mt-10 animate-fade-up"
            style={{ animationDelay: '0.4s', animationFillMode: 'both' } as CSSProperties}
          >
            <div className="flex -space-x-2">
              {['#4f6878', '#3d5262', '#2a3d4a', '#1a2d38'].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: color }}
                >
                  {['JD', 'MK', 'LR', 'AT'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">2,400+</span> athletes already on the platform
            </p>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="hidden lg:block">
          {floatingStats.map((stat, i) => (
            <div
              key={stat.label}
              className="absolute right-0 glass rounded-xl p-4 min-w-[160px] animate-float"
              style={{
                top: `${30 + i * 22}%`,
                right: `${4 + (i % 2) * 8}%`,
                animationDelay: stat.delay,
                animationDuration: `${4 + i * 0.8}s`,
              } as CSSProperties}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: '#4f6878' }}>{stat.icon}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="stat-number text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #080808, transparent)' }}
      />
    </section>
  );
}
