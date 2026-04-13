// client/src/components/sections/TestimonialSlider.tsx

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  sport: string;
  grade?: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Caliber helped me see exactly where I was losing points in my game. My assist-to-turnover ratio grade went from a C to an A- in one season. Coach noticed.",
    name: "Marcus T.",
    role: "Point Guard",
    sport: "Basketball",
    grade: "A-",
  },
  {
    quote: "I sent my Caliber profile link to 12 college programs. Three reached out within a week. The recruiting hub actually works.",
    name: "Devon R.",
    role: "Wide Receiver",
    sport: "Basketball",
    grade: "A",
  },
  {
    quote: "As a coach, having grades for every player every game changed how I give feedback. It's objective, it's data-driven, and players actually listen.",
    name: "Coach Williams",
    role: "Varsity Head Coach",
    sport: "Basketball",
  },
  {
    quote: "My highlight reel on Caliber looks more professional than anything I could've made myself. I got an offer a month after creating it.",
    name: "Jordan K.",
    role: "Linebacker",
    sport: "Basketball",
    grade: "B+",
  },
];

export function TestimonialSlider() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const next = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % testimonials.length);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating]);

  const prev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const t = testimonials[current];

  return (
    <section className="section-py relative" style={{ background: '#070707' }}>
      <div className="container-wide relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/3 mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Athlete Stories</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
            Real Results from{' '}
            <span className="text-gradient">Real Athletes</span>
          </h2>
        </div>

        {/* Testimonial card */}
        <div className="max-w-3xl mx-auto">
          <div
            className={`rounded-2xl p-10 border border-white/8 transition-all duration-200 ${
              isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            }`}
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Quote icon */}
            <Quote className="w-8 h-8 mb-6 opacity-30" style={{ color: '#4f6878' }} />

            {/* Quote text */}
            <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8 font-medium">
              "{t.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base"
                  style={{
                    background: 'linear-gradient(135deg, #4f6878, #3d5262)',
                    color: '#fff',
                  }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{t.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {t.role} · {t.sport}
                  </div>
                </div>
              </div>
              {t.grade && (
                <div
                  className="px-4 py-2 rounded-xl font-display font-bold text-xl"
                  style={{
                    background: 'rgba(198,208,216,0.12)',
                    color: '#4f6878',
                    border: '1px solid rgba(198,208,216,0.2)',
                  }}
                >
                  {t.grade}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? '24px' : '8px',
                    height: '8px',
                    background: i === current ? '#4f6878' : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
