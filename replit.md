# Caliber Performance Labs

## Overview
Caliber is a multi-sport player analytics and performance tracking application, currently supporting basketball and football. It helps users manage player rosters, log game statistics, and provides automated, position-weighted performance feedback. The application aims to be a leading solution in sports analytics, offering features like player leaderboards, head-to-head comparisons, performance trendlines, gamification, and AI-powered analysis to aid player development, scouting, and coaching.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Wouter for routing, TanStack React Query for state management.
- **Styling**: Tailwind CSS with shadcn/ui (New York style), Recharts for charts, React Hook Form with Zod for forms.
- **UI/UX**: Features a sleek, futuristic dark theme with sci-fi aesthetics, including cyber-grid backgrounds, gradient text, glowing elements, and Framer-motion animations. Typography uses Teko for headings and Inter for body text. Mobile-optimized with PWA support, including components like `FloatingActionButton`, `PullToRefreshIndicator`, `CollapsibleStatCard`, and `MobileStatGrid`. Includes a custom React Error Boundary and age-friendly accessibility features (e.g., base font size 16px, larger navigation text, enlarged touch targets, ARIA labels).
- **Personality & Polish**: Sport-themed loading spinners (`SportSpinner` component - bouncing basketball / spinning football based on selected sport), personalized time-of-day greeting banner on player profiles, and animated count-up effect on stat card values for a dynamic feel.
- **Contextual Help**: Integrated `HelpTooltip` and `FeatureTip` components for on-demand explanations across major hub pages.

### Backend
- **Runtime**: Node.js with Express.
- **Language**: TypeScript with ESM modules.
- **API Design**: RESTful JSON API with typed contracts and Zod schemas for validation.

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM with drizzle-zod, schema defined in `shared/schema.ts`, comprehensive indexing for query optimization.

### Core Features
- **Multi-Sport Support**: Configurable for basketball and football with position-specific stats and grading.
- **Player Management**: Comprehensive profiles, stat entry, and performance tracking.
- **Gamification**: XP system, tier progression (Rookie to Hall of Fame), streak bonuses, and skill-based badges with animations and celebration triggers.
- **AI Integration**: Gemini AI for video analysis and performance projections.
- **Authentication**: Replit Auth with session management and role-based access control (Player/Coach).
- **Social & Engagement**: Player following, in-app notifications, goal sharing, highlight clips, shareable achievements, quick reaction buttons, and online/activity indicators. Includes "This Day Last Year" memories and auto-generated shareable milestone cards.
- **Direct Messages**: Full DM system with inbox, threaded conversations, unread counts, and real-time polling. Tables: `directMessageThreads`, `directMessages`, `threadParticipants`. APIs: `GET/POST /api/messages/threads`, `GET/POST /api/messages/threads/:id/messages`, `POST /api/messages/threads/:id/read`.
- **Saved Posts**: Bookmark/save any feed activity for later viewing. Table: `savedPosts`. APIs: `GET /api/saved-posts`, `POST/DELETE /api/feed/:activityId/save`.
- **Discover/Explore**: Instagram-style discover page with search, trending players (from leaderboard), suggested follows, and top performances of the week.
- **Training Social Sharing**: Strava-style workout sharing to the activity feed. Share workouts with auto-generated summaries. APIs: `POST /api/workouts/:id/share`, `GET /api/workouts/:id/shared`.
- **Smart Feed**: Cursor-based pagination with infinite scroll, "New posts available" banner, and auto-loading via IntersectionObserver.
- **Feed Comments & Replies**: Threaded commenting on all feed activity items with nested replies, comment likes, and delete. Tables: `feed_comments`, `feed_comment_likes`. APIs: `GET/POST /api/feed/:activityId/comments`, `POST /api/feed/comments/:id/like`.
- **Feed Repost with Caption**: Share any feed activity to your own feed with optional caption. API: `POST /api/feed/:activityId/repost`.
- **Enhanced Social Profiles**: Bio display with "add bio" prompt, profile completion bar (8 fields tracked), activity summary (badges, games this month) alongside follower/following counts.
- **Celebration System**: Full-screen confetti/particle overlays for achievements and XP gain toasts.
- **Skeleton Loading**: Comprehensive skeleton loading states on key pages for improved perceived performance.
- **Live Game Mode**: Coach-only real-time stat tracking with multi-player selection, large tap-target buttons, undo functionality, haptic feedback, audio cues, and offline capability with data syncing.
- **Scheduling**: Practice scheduler and calendar.
- **Coach Features**: Team dashboard, game notes, lineup analysis, practice tracking with live mode, AI-generated drill recommendations, and one-click game verification queue.
- **Trust & Verification**: Player ratings by coaches, stat verifications, skill challenges, AI analysis for highlight verification, and secure cross-team verification prevention.
- **Subscription & Monetization**: Tiered subscription model (Free, Pro, Coach Pro) integrated with Stripe.
- **Wearable Integration**: Fitness dashboard with manual entry and Fitbit OAuth integration, with preparations for Apple Health, Google Fit, and WHOOP.
- **Unified Hubs**: Consolidated tabbed interfaces for Community, Coach, Recruiting, Performance, and Analytics features, with URL parameter navigation and backwards compatibility for old routes.
  - **Community Hub**: Activity feed, Instagram-style stories, polls, player connection, direct messages, discover/explore, and saved posts features.
  - **Coach Hub**: Team overview, game verification, player endorsements, practice tracking, lineup management, scouting, and performance alerts.
  - **Recruiting Hub**: Player recruiting journey dashboard, AI-powered college matching with real program statistics (including NCAA eligibility checklist), searchable camps/events directory, and coach recommendation system.
  - **Performance Hub**: Training log with workout history and fitness data dashboard (wearable integration).
  - **Analytics Hub**: Player leaderboards, head-to-head player comparison, team comparison, skill challenges, and detailed grading system explanation.

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
- CollegeFootballData.com API (for football college stats)
- ESPN API (for basketball college stats)
- Fitbit OAuth (for wearable integration)
- Stripe (for subscriptions)
- Gemini AI