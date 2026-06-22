// client/src/components/ui/Navigation.tsx

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Menu, X } from 'lucide-react';
import { CaliberLogo } from '../CaliberLogo';

interface NavLink {
  label: string;
  href: string;
}

interface NavigationProps {
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
}

const defaultLinks: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

export function Navigation({
  links = defaultLinks,
  ctaLabel = 'Get Started',
  ctaHref = '/login',
}: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3 backdrop-blur-xl border-b border-white/5'
          : 'py-5'
      }`}
      style={{
        background: scrolled ? 'rgba(10,10,10,0.9)' : 'transparent',
      }}
    >
      <div className="container-wide flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <CaliberLogo size={30} color="#4f6878" />
            <span
              className="font-display text-lg font-bold tracking-widest uppercase transition-colors"
              style={{ color: '#4f6878' }}
            >
              CALIBER
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
              Sign In
            </button>
          </Link>
          <Link href={ctaHref}>
            <button
              className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 glow-amber-sm"
              style={{
                background: 'linear-gradient(135deg, #4f6878, #3d5262)',
                color: '#fff',
              }}
            >
              {ctaLabel}
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden mt-2 mx-4 rounded-2xl overflow-hidden border border-white/10 animate-fade-in"
          style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex flex-col p-4 gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2 flex flex-col gap-2">
              <Link href="/login">
                <button
                  className="w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </button>
              </Link>
              <Link href={ctaHref}>
                <button
                  className="w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all text-center"
                  style={{
                    background: 'linear-gradient(135deg, #4f6878, #3d5262)',
                    color: '#fff',
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {ctaLabel}
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
