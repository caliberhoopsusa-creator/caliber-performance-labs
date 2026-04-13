// client/src/components/ui/PricingCard.tsx

import { Check, Zap } from 'lucide-react';
import { Link } from 'wouter';

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
  badge?: string;
}

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
        tier.featured
          ? 'border border-amber-500/40 shadow-glow-md'
          : 'border border-white/8 hover:border-white/12'
      }`}
      style={{
        background: tier.featured
          ? 'linear-gradient(135deg, rgba(198,208,216,0.08) 0%, rgba(15,15,15,0.9) 100%)'
          : 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #4f6878, #3d5262)',
              color: '#fff',
            }}
          >
            <Zap className="w-3 h-3" />
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-2">{tier.name}</h3>
        <div className="flex items-end gap-1 mb-3">
          <span
            className="text-4xl font-display font-bold"
            style={{ color: tier.featured ? '#4f6878' : 'white' }}
          >
            {tier.price}
          </span>
          {tier.period && (
            <span className="text-muted-foreground text-sm mb-1">/{tier.period}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-8">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: tier.featured
                  ? 'rgba(198,208,216,0.15)'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              <Check
                className="w-3 h-3"
                style={{ color: tier.featured ? '#4f6878' : '#a3a3a3' }}
              />
            </div>
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link href={tier.ctaHref}>
        <button
          className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 ${
            tier.featured
              ? 'glow-amber-sm'
              : 'border border-white/12 text-foreground hover:border-white/20 hover:bg-white/5'
          }`}
          style={
            tier.featured
              ? {
                  background: 'linear-gradient(135deg, #4f6878, #3d5262)',
                  color: '#fff',
                }
              : {}
          }
        >
          {tier.cta}
        </button>
      </Link>
    </div>
  );
}
