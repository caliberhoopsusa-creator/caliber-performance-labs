// client/src/components/sections/FeatureGrid.tsx

import { CSSProperties } from 'react';
import { BarChart3, Trophy, Video, Users, Brain, Target } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
}

const features: Feature[] = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI Performance Grades',
    description: 'Get letter grades (A–F) based on your stats, efficiency metrics, and consistency — just like a real report card.',
    accent: true,
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Multi-Sport Analytics',
    description: 'Basketball stat tracking with sport-specific metrics that actually matter to scouts and coaches.',
  },
  {
    icon: <Video className="w-6 h-6" />,
    title: 'Highlight Reel Builder',
    description: 'Clip, tag, and share your best moments. Build a professional highlight reel recruiters can watch anywhere.',
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: 'Badges & XP System',
    description: 'Earn achievement badges, level up your profile, and showcase your progress to scouts and coaches.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Recruiting Hub',
    description: 'Connect with college programs, view recruit posts, and get discovered by coaches looking for your position.',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Goal Tracking',
    description: 'Set personal records, track milestones, and monitor your improvement over an entire season.',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="section-py relative" style={{ background: '#080808' }}>
      {/* Glow backdrop */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(198,208,216,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="container-wide relative z-10">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/5 mb-4">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Everything You Need</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Built for Athletes,{' '}
            <span className="text-gradient">Designed for Scouts</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Every feature on Caliber was designed with one goal: helping athletes get seen by the right people.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 ${
                feature.accent
                  ? 'border-amber-500/25 hover:border-amber-500/40'
                  : 'border-white/6 hover:border-white/12'
              }`}
              style={{
                background: feature.accent
                  ? 'linear-gradient(135deg, rgba(198,208,216,0.06) 0%, rgba(15,15,15,0.8) 100%)'
                  : 'rgba(255,255,255,0.015)',
                animationDelay: `${i * 0.07}s`,
                animationFillMode: 'both',
              } as CSSProperties}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: feature.accent
                    ? 'rgba(198,208,216,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  color: feature.accent ? '#4f6878' : '#a3a3a3',
                }}
              >
                {feature.icon}
              </div>

              <h3 className="font-display text-lg font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow */}
              {feature.accent && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at top left, rgba(198,208,216,0.06) 0%, transparent 60%)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
