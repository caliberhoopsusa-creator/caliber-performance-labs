// client/src/pages/PrivacyPage.tsx

import { Navigation } from '../components/ui/Navigation';
import { PublicMobileNav } from '../components/ui/MobileNav';
import { PublicFooter } from '../components/ui/PublicFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#ffffff' }}>
      <Navigation />

      <section className="pt-32 pb-24">
        <div className="container-tight max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6">
            <span className="text-sm font-medium text-muted-foreground">Legal</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-12">Last updated: March 2026</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-white text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p>
                Caliber Performance Labs collects information you provide directly, including your name, email address, athletic statistics, and profile data. We also collect usage data about how you interact with our platform.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p>
                We use your information to provide and improve the Caliber platform, process payments, send product updates, and generate performance analytics. We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">3. Data Sharing</h2>
              <p>
                Your public player profile and stats are visible to coaches, scouts, and recruiters on the platform as intended. Private data is never shared without your consent. We share data with service providers (Stripe for payments, etc.) only as necessary to operate the platform.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">4. Data Retention & Deletion</h2>
              <p>
                You own your data. You may export or delete your account at any time by contacting us at <a href="mailto:hello@caliber.app" className="text-amber-400 hover:underline">hello@caliber.app</a>. We retain data for up to 90 days after account deletion for legal compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">5. Cookies</h2>
              <p>
                We use session cookies to keep you logged in and analytics cookies to understand platform usage. You can disable cookies in your browser settings, though some features may not function correctly.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">6. Children's Privacy</h2>
              <p>
                Caliber is intended for athletes 13 years of age and older. Users under 18 should have a parent or guardian review this policy. Guardian accounts are available for minors on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">7. Contact</h2>
              <p>
                For privacy questions or data requests, contact us at <a href="mailto:hello@caliber.app" className="text-amber-400 hover:underline">hello@caliber.app</a>.
              </p>
            </section>
          </div>
        </div>
      </section>

      <PublicFooter />
      <PublicMobileNav />
    </div>
  );
}
