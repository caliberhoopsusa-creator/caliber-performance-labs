// client/src/pages/BlogPage.tsx

import { Navigation } from '../components/ui/Navigation';
import { CtaSection } from '../components/sections/CtaSection';
import { PublicMobileNav } from '../components/ui/MobileNav';
import { PublicFooter } from '../components/ui/PublicFooter';
import { Clock, Tag } from 'lucide-react';
import { useState } from 'react';

interface Post {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  featured?: boolean;
}

const posts: Post[] = [
  {
    slug: 'ai-performance-grades-explained',
    category: 'Product',
    title: 'How Caliber\'s AI Performance Grades Actually Work',
    excerpt: 'A deep dive into the position-specific benchmarks, efficiency metrics, and trend data behind every letter grade we produce.',
    readTime: '6 min read',
    date: 'Mar 4, 2026',
    featured: true,
  },
  {
    slug: 'recruiting-profile-mistakes',
    category: 'Recruiting',
    title: '5 Recruiting Profile Mistakes That Cost Athletes Offers',
    excerpt: 'College coaches spend less than 90 seconds on most profiles. Here\'s what separates the ones they bookmark from the ones they skip.',
    readTime: '5 min read',
    date: 'Feb 24, 2026',
  },
  {
    slug: 'highlight-reel-guide',
    category: 'Film & Highlights',
    title: 'The Winning Formula for a Basketball Highlight Reel',
    excerpt: 'What to put first, how long it should run, and which plays scouts actually want to see — based on feedback from 40+ college programs.',
    readTime: '7 min read',
    date: 'Feb 14, 2026',
  },
  {
    slug: 'stat-tracking-habits',
    category: 'Performance',
    title: 'Why Athletes Who Track Stats Develop 2x Faster',
    excerpt: 'Logging your numbers after every game isn\'t busywork. It\'s the feedback loop that separates serious athletes from the rest.',
    readTime: '4 min read',
    date: 'Feb 3, 2026',
  },
  {
    slug: 'team-analytics-for-coaches',
    category: 'Coaching',
    title: 'Using Team Analytics to Make Better In-Season Adjustments',
    excerpt: 'How coaches on Caliber use lineup data, trend charts, and efficiency splits to make decisions their opponents can\'t predict.',
    readTime: '6 min read',
    date: 'Jan 10, 2026',
  },
];

const categories = ['All', 'Product', 'Recruiting', 'Performance', 'Film & Highlights', 'Coaching'];

const featured = posts.find((p) => p.featured)!;
const grid = posts.filter((p) => !p.featured);

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(198,208,216,0.1)', color: '#4f6878' }}
    >
      <Tag className="w-3 h-3" />
      {label}
    </span>
  );
}

function FeaturedPost({ post }: { post: Post }) {
  return (
      <div
        className="group relative rounded-2xl border border-white/8 overflow-hidden transition-all duration-300"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Ambient glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(198,208,216,0.07) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <CategoryBadge label={post.category} />
              <span className="text-xs text-muted-foreground">Featured</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-snug mb-4 group-hover:text-amber-50 transition-colors">
              {post.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{post.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{post.date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </span>
              </div>
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: 'rgba(198,208,216,0.1)', color: '#4f6878' }}
              >
                Coming soon
              </span>
            </div>
          </div>

          {/* Decorative right side */}
          <div className="hidden md:flex items-center justify-center">
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, rgba(198,208,216,0.15) 0%, rgba(198,208,216,0.03) 70%, transparent 100%)' }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center font-display font-bold text-4xl"
                style={{ background: 'rgba(198,208,216,0.1)', color: '#4f6878', border: '1px solid rgba(198,208,216,0.2)' }}
              >
                A+
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
      <div
        className="rounded-xl border border-white/6 p-6 transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <CategoryBadge label={post.category} />
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: 'rgba(198,208,216,0.08)', color: '#6b7280' }}
          >
            Coming soon
          </span>
        </div>
        <h3 className="font-display font-bold text-white text-lg leading-snug mb-2">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{post.date}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
        </div>
      </div>
  );
}

export default function BlogPage() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#ffffff' }}>
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(198,208,216,0.1) 0%, transparent 55%)',
          }}
        />
        <div className="container-wide relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 mb-6">
            <span className="text-sm font-medium text-amber-400">Caliber Blog</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            Insights for{' '}
            <span className="text-gradient">Serious Athletes</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Recruiting advice, performance science, and product updates from the Caliber team.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="pb-12 border-b border-white/6">
        <div className="container-wide">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-150"
                style={
                  i === 0
                    ? { background: 'rgba(198,208,216,0.15)', color: '#4f6878', border: '1px solid rgba(198,208,216,0.3)' }
                    : { background: 'rgba(255,255,255,0.03)', color: '#a3a3a3', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured post */}
      <section className="py-12">
        <div className="container-wide">
          <FeaturedPost post={featured} />
        </div>
      </section>

      {/* Post grid */}
      <section className="pb-24">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {grid.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 border-t border-white/6">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Stay in the Loop
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Get recruiting tips, platform updates, and performance insights delivered to your inbox.
          </p>
          {subscribed ? (
            <p className="text-sm font-medium" style={{ color: '#4f6878' }}>
              Thanks! We'll be in touch soon.
            </p>
          ) : (
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubscribed(true);
            }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(198,208,216,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #4f6878 0%, #3d5262 100%)' }}
            >
              Subscribe
            </button>
          </form>
          )}
        </div>
      </section>

      <CtaSection />
      <PublicFooter />
      <PublicMobileNav />
    </div>
  );
}
