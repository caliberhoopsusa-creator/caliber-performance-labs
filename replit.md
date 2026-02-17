# Caliber Performance Labs

## Overview
Caliber is a basketball-focused player analytics and performance tracking application designed to be a leading solution in sports analytics. It enables users to manage player rosters, log game statistics, and receive automated, position-weighted performance feedback. Key features include player leaderboards, head-to-head comparisons, performance trendlines, gamification, and AI-powered analysis. The application aims to aid player development, scouting, and coaching with a vision to revolutionize sports analytics.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Wouter for routing, TanStack React Query for state management.
- **Styling**: Tailwind CSS with shadcn/ui (New York style), Recharts for charts, React Hook Form with Zod for forms.
- **UI/UX**: Editorial sports-brand aesthetic (Nike/ESPN-inspired) with dark/light theme, crimson red accent. Uses Teko for headings and Inter for body text. Clean card-based layouts, mobile-optimized with PWA support, Instagram-style bottom tab navigation, and custom components like `FloatingActionButton`, `PullToRefreshIndicator`, `CollapsibleStatCard`, and `MobileStatGrid`. Includes custom error boundaries and age-friendly accessibility features. Player profiles feature cover photos, overlapping avatars, badge grids, XP progress, streak indicators, and stat sparklines. A `StatsTicker` component displays personal and leaderboard data.
- **Design System**: Crimson red accent (`--accent: 355 85% 50%`). Dark mode uses deep backgrounds; light mode uses clean white backgrounds. Theme toggle persists via localStorage.
- **Branding & Logo**: `CaliberLogo` component dynamically colors a PNG logo via CSS mask-image and canvas, with color matching player's equipped theme in authenticated views.
- **Personality & Polish**: Sport-themed loading spinners, personalized greetings, and animated stat count-ups.
- **Contextual Help**: `HelpTooltip` and `FeatureTip` components for on-demand explanations.
- **New User Onboarding**: Progressive disclosure through an `OnboardingTour` modal, a `GettingStartedCard` checklist, and `DiscoveryCards` for feature introduction.
- **Navigation**: Role-based sidebar for Player and Coach roles, with sport-specific filtering.
- **Cross-Platform Export**: `PlatformExportModal` for exporting shareable cards in various social media formats with Caliber branding.

### Backend
- **Runtime**: Node.js with Express.
- **Language**: TypeScript with ESM modules.
- **API Design**: RESTful JSON API with typed contracts and Zod schemas for validation.

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM with drizzle-zod, comprehensive indexing.

### Core Features
- **Multi-Sport Support**: Configurable for basketball (primary focus) and football.
- **Player Management**: Profiles, stat entry, performance tracking.
- **Gamification**: XP system, tier progression, streak bonuses, skill-based badges.
- **AI Integration**: Gemini AI for video analysis and performance projections.
- **Authentication**: Replit Auth with session management and role-based access control (Player/Coach/Recruiter).
- **Social & Engagement**: Player following, in-app notifications, goal sharing, highlight clips, shareable achievements, direct messages, saved posts, and activity indicators. Includes "This Day Last Year" memories and auto-generated milestone cards.
- **Smart Feed**: Instagram-style community feed with cursor-based pagination, infinite scroll, and "New posts available" banner. Supports comments, replies, likes, and reposts with captions.
- **Enhanced Social Profiles**: Bio display, profile completion bar, activity summary, follower/following counts, and career personal bests with celebratory toasts.
- **Weekly Performance Recap**: Auto-generated summaries of player performance.
- **Goal Setting & Tracking**: Players set stat goals with progress bars and celebration toasts.
- **Celebration System**: Full-screen confetti/particle overlays for achievements.
- **Skeleton Loading**: Comprehensive skeleton loading states.
- **Unified Hubs**: Consolidated tabbed interfaces for Community, Coach, Recruiting, Performance, and Analytics.
  - **Community Hub**: Activity feed, stories, polls, player connection, DMs, discover/explore, saved posts.
  - **Coach Hub**: Team overview, game verification, player endorsements, practice tracking, lineup management, scouting, AI drill recommendations.
  - **Recruiting Hub**: Player recruiting journey dashboard, AI-powered college matching, camps/events directory, coach recommendation system, public recruiting profiles with AI scouting reports, and a recruiting game plan with target management and AI-generated intro emails.
  - **Performance Hub**: Training log, workout history, fitness data dashboard.
  - **Analytics Hub**: Player leaderboards, head-to-head comparison, team comparison, skill challenges, detailed grading system.
- **Recruiter Role System**: Dedicated role with .edu email validation, admin verification, recruiter dashboard for player search, prospect bookmarking, and interest signaling. Players have privacy controls for recruiter activity.
- **Scout View**: `ScoutView` component on player profiles (3+ games) showing efficiency metrics (True Shooting %, Turnover Rate, AST/TO ratio, Usage Rate, Offensive Rebound %, Defensive Rating), consistency rating with coefficient of variation scoring, game-by-game performance chart with trend line and big-game indicators, physical measurables panel, and coach endorsement summary.
- **Enhanced Recruiting Card**: Shareable recruiting cards now include TS%, AST/TO ratio, consistency score progress bar, and GPA alongside traditional counting stats.
- **AI Scouting Reports**: Enhanced Gemini AI prompt includes efficiency metrics with D1/D2/D3 benchmark comparisons, consistency analysis, big-game performance, and next-level projection with division-level recommendation.
- **Discover Highlights Feed**: TikTok-style public vertical-scroll video feed with snap scrolling and sport filtering.

## External Dependencies

### Database
- PostgreSQL

### UI Components
- shadcn/ui (built on Radix UI)

### Key NPM Packages
- drizzle-orm / drizzle-zod
- @tanstack/react-query
- recharts
- date-fns
- wouter
- zod

### Third-Party Services
- CollegeFootballData.com API (for football college stats)
- ESPN API (for basketball college stats)
- Fitbit OAuth (for wearable integration)
- Stripe (for subscriptions)
- Gemini AI