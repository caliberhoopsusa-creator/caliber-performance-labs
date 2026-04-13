// client/src/components/ui/PublicFooter.tsx
// Shared footer for all public-facing pages.

import { Link } from 'wouter';
import { CaliberLogo } from '../CaliberLogo';

const LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'For Athletes', href: '/login' },
    { label: 'For Coaches', href: '/login' },
    { label: 'For Recruiters', href: '/login' },
  ],
  Resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Help Center', href: '/blog' },
    { label: 'API Status', href: '/debug' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export function PublicFooter() {
  return (
    <footer
      style={{
        background: '#07090c',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '64px 0 32px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Top row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr repeat(3, 1fr)',
            gap: 40,
            marginBottom: 56,
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <CaliberLogo size={28} color="#4f6878" />
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#C6D0D8',
                  textTransform: 'uppercase',
                }}
              >
                CALIBER
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.7,
                maxWidth: 260,
                marginBottom: 20,
              }}
            >
              AI-powered basketball analytics for serious athletes and the coaches who develop them.
            </p>
            <Link href="/login">
              <button
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #4f6878, #3d5262)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                Get Started Free →
              </button>
            </Link>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                {section}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>
                      <a
                        style={{
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.45)',
                          textDecoration: 'none',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => ((e.target as HTMLElement).style.color = '#C6D0D8')}
                        onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)')}
                      >
                        {link.label}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
            © {new Date().getFullYear()} Caliber Performance Labs. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
            ].map((l) => (
              <Link key={l.label} href={l.href}>
                <a
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.25)',
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.25)')}
                >
                  {l.label}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
