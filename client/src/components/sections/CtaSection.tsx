// client/src/components/sections/CtaSection.tsx

import { ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

const benefits = [
  'Free to start — no credit card',
  'Basketball stats',
  'AI grades on every game',
  'Recruiting-ready profile',
];

export function CtaSection() {
  return (
    <section className="section-py relative overflow-hidden" style={{ background: '#060606' }}>
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(198,208,216,0.18) 0%, transparent 60%)',
        }}
      />

      <div className="container-wide relative z-10">
        <div
          className="rounded-3xl overflow-hidden border border-amber-500/20 relative"
          style={{
            background:
              'linear-gradient(135deg, rgba(198,208,216,0.07) 0%, rgba(10,10,10,0.95) 50%, rgba(139,69,19,0.05) 100%)',
          }}
        >
          {/* Inner grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/8 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-medium text-amber-400">Join 2,400+ Athletes</span>
            </div>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              Ready to Show Scouts
              <br />
              <span className="text-gradient">What You've Got?</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Create your free Caliber profile today. Start tracking stats, earning grades, and
              building the recruiting profile that gets you noticed.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-10">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <button
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 hover:-translate-y-0.5 glow-amber"
                  style={{
                    background: 'linear-gradient(135deg, #4f6878 0%, #3d5262 100%)',
                    color: '#fff',
                    minWidth: '200px',
                  }}
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border border-white/12 text-foreground transition-all duration-200 hover:border-white/20 hover:bg-white/5">
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
