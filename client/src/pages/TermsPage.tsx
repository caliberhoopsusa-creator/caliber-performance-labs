// client/src/pages/TermsPage.tsx

import { Navigation } from '../components/ui/Navigation';
import { PublicMobileNav } from '../components/ui/MobileNav';
import { PublicFooter } from '../components/ui/PublicFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#ffffff' }}>
      <Navigation />

      <section className="pt-32 pb-24">
        <div className="container-tight max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6">
            <span className="text-sm font-medium text-muted-foreground">Legal</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-12">Last updated: March 2026</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-white text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By creating an account or using the Caliber Performance Labs platform, you agree to these Terms of Service. If you do not agree, do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">2. Account Responsibilities</h2>
              <p>
                You are responsible for maintaining the security of your account and for all activity that occurs under it. You agree to provide accurate information and to update it as needed. You may not impersonate another person or submit false performance data.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">3. Acceptable Use</h2>
              <p>
                You agree not to use Caliber to post false stats, harass other users, violate any laws, or attempt to compromise platform security. Violations may result in account termination.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">4. Subscriptions & Payments</h2>
              <p>
                Paid plans are billed monthly or annually as selected. You may cancel at any time; your access continues through the end of the current billing period. Refunds are evaluated on a case-by-case basis. Pricing is subject to change with 30 days' notice.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">5. Intellectual Property</h2>
              <p>
                You retain ownership of the stats and content you submit. You grant Caliber a license to display this content as part of the platform. Caliber's platform design, software, and branding are owned by Caliber Performance Labs.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">6. Disclaimers</h2>
              <p>
                The platform is provided "as is." AI-generated performance grades are for informational purposes and are not official evaluations. Caliber makes no guarantees regarding recruiting outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Caliber Performance Labs is not liable for indirect, incidental, or consequential damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-3">8. Contact</h2>
              <p>
                Questions about these terms? Contact us at <a href="mailto:hello@caliber.app" className="text-amber-400 hover:underline">hello@caliber.app</a>.
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
