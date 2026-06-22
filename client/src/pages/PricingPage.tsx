// client/src/pages/PricingPage.tsx

import { Navigation } from '../components/ui/Navigation';
import { PricingCard, PricingTier } from '../components/ui/PricingCard';
import { CtaSection } from '../components/sections/CtaSection';
import { PublicMobileNav } from '../components/ui/MobileNav';
import { PublicFooter } from '../components/ui/PublicFooter';
import { Check } from 'lucide-react';
import { useState } from 'react';

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For athletes just getting started on their Caliber journey.',
    features: [
      'Public player profile',
      'Up to 10 games per season',
      'Basic performance grades',
      '1 highlight reel (5 clips)',
      'Badge & XP system',
      'Community feed access',
    ],
    cta: 'Start Free',
    ctaHref: '/login',
  },
  {
    name: 'Athlete Pro',
    price: '$9',
    period: 'mo',
    description: 'For serious athletes who want every edge on their recruiting profile.',
    features: [
      'Everything in Starter',
      'Unlimited game tracking',
      'Advanced grade breakdowns',
      'Unlimited highlight reels',
      'Recruiting hub access',
      'Personal records tracking',
      'Scout & coach view analytics',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    ctaHref: '/login?redirect=/pricing',
    featured: true,
    badge: 'Most Popular',
  },
  {
    name: 'Team / Coach',
    price: '$29',
    period: 'mo',
    description: 'For coaches managing a full roster and tracking every player.',
    features: [
      'Everything in Athlete Pro',
      'Up to 25 player profiles',
      'Roster management dashboard',
      'Practice & drill tracking',
      'Team comparison analytics',
      'Bulk game entry',
      'Coach endorsements',
      'League & tournament tools',
    ],
    cta: 'Try Team Plan',
    ctaHref: '/login?redirect=/pricing',
  },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you\'ll be prorated for any difference.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Athlete Pro includes a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'How does the grading system work?',
    a: 'We analyze your game stats against position-specific benchmarks, efficiency metrics, and trend data to produce a letter grade (A+ through F) for each performance area.',
  },
  {
    q: 'Do I own my data?',
    a: 'Absolutely. You own all your stats, highlights, and profile data. You can export or delete everything at any time.',
  },
  {
    q: 'What sports are supported?',
    a: 'Currently basketball, with more sports coming soon.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#ffffff' }}>
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(198,208,216,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="container-wide relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 mb-6">
            <span className="text-sm font-medium text-amber-400">Simple, Transparent Pricing</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            Invest in Your{' '}
            <span className="text-gradient">Athletic Career</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start free, upgrade when you're ready. Every plan includes performance grades, badges, and your public player profile.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>

          {/* Enterprise note */}
          <div className="text-center mt-10">
            <p className="text-muted-foreground text-sm">
              Need a school or district license?{' '}
              <a href="mailto:hello@caliber.app" className="text-amber-400 hover:underline">
                Contact us for Enterprise pricing
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="py-20 border-t border-white/6">
        <div className="container-wide max-w-4xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Everything You Get
          </h2>

          <div className="space-y-1">
            {[
              ['Public Player Profile', true, true, true],
              ['Game Stat Tracking', '10 games', 'Unlimited', 'Unlimited (25 players)'],
              ['Performance Grades', 'Basic', 'Full breakdown', 'Full breakdown'],
              ['Highlight Reels', '1 reel / 5 clips', 'Unlimited', 'Unlimited'],
              ['Recruiting Hub', false, true, true],
              ['Scout View Analytics', false, true, true],
              ['Personal Records', true, true, true],
              ['Badges & XP', true, true, true],
              ['Coach Endorsements', false, false, true],
              ['Roster Management', false, false, true],
              ['Team Analytics', false, false, true],
            ].map(([feature, starter, pro, team]) => (
              <div
                key={feature as string}
                className="grid grid-cols-4 gap-4 py-4 border-b border-white/5 text-sm"
              >
                <div className="text-muted-foreground col-span-1">{feature}</div>
                {[starter, pro, team].map((val, i) => (
                  <div key={i} className="text-center">
                    {val === true ? (
                      <Check className="w-4 h-4 text-amber-500 mx-auto" />
                    ) : val === false ? (
                      <span className="text-muted-foreground/40">—</span>
                    ) : (
                      <span className={i === 1 ? 'text-amber-400' : 'text-foreground'}>{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/6">
        <div className="container-tight">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/6 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <button
                  className="w-full px-6 py-5 text-left flex items-center justify-between text-foreground font-medium hover:bg-white/3 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span
                    className="text-muted-foreground ml-4 transition-transform duration-200"
                    style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
      <PublicFooter />
      <PublicMobileNav />
    </div>
  );
}
