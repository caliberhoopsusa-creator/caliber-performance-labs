// client/src/pages/HomePage.tsx

import { tokens } from '../config/tokens';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Section } from '../components/Section';
import { HeroGradient } from '../components/HeroGradient';

const FEATURES = [
  { title: 'Real-Time Analytics', description: 'Track performance metrics', icon: '📊' },
  { title: 'AI Insights', description: 'Machine learning powered analysis', icon: '🤖' },
  { title: 'Team Management', description: 'Collaborate with your team', icon: '👥' },
];

export function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroGradient>
        <h1 style={{ color: tokens.colors.text.inverse }}>Caliber Labs</h1>
        <p style={{ color: tokens.colors.text.inverse, marginBottom: tokens.spacing.lg }}>
          Elite performance analytics
        </p>
        <Button variant="primary">Get Started</Button>
      </HeroGradient>

      {/* Features Section */}
      <Section
        title="Why Choose Us"
        description="Comprehensive tools for elite athletes"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: tokens.spacing.lg,
          }}
        >
          {FEATURES.map((feature) => (
            <Card key={feature.title} {...feature} gradient />
          ))}
        </div>
      </Section>
    </>
  );
}
