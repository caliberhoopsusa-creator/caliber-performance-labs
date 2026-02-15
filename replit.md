# Caliber Performance Labs

## Overview
Caliber is a basketball-focused player analytics and performance tracking application. It helps users manage player rosters, log game statistics, and provides automated, position-weighted performance feedback. The application aims to be a leading solution in sports analytics, offering features like player leaderboards, head-to-head comparisons, performance trendlines, gamification, and AI-powered analysis to aid player development, scouting, and coaching. Note: Football support is archived (data model preserved in DB) but the UI is locked to basketball only.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Wouter for routing, TanStack React Query for state management.
- **Styling**: Tailwind CSS with shadcn/ui (New York style), Recharts for charts, React Hook Form with Zod for forms.
- **UI/UX**: Editorial sports-brand aesthetic (Nike/ESPN-inspired) with dark/light theme toggle and crimson red accent color (HSL 355 85% 50%). Typography uses Teko for headings and Inter for body text. Clean Card-based layouts with minimal shadows, no glassmorphism or glow effects. Mobile-optimized with PWA support, Instagram-style bottom tab navigation bar, and components like `FloatingActionButton`, `PullToRefreshIndicator`, `CollapsibleStatCard`, and `MobileStatGrid`. Includes a custom React Error Boundary and age-friendly accessibility features (e.g., base font size 16px, larger navigation text, enlarged touch targets, ARIA labels). Player profiles feature cover photos, overlapping avatars, badge showcase grids, XP progress bars, streak indicators (flame icon), and stat sparklines (small inline SVG trend charts on stat cards). Stock-market-style `StatsTicker` component scrolls below the header showing personal stats (PPG, grade, rank) and leaderboard data (top scorer, top rated, most active).
- **Design System**: Crimson red accent (`--accent: 355 85% 50%`). Dark mode: deep backgrounds (`--background: 220 14% 4%`), card elevation (`--card: 220 12% 8%`), border treatment (`--border: 220 10% 13%`). Light mode: clean white backgrounds (`--background: 0 0% 100%`), light card (`--card: 220 10% 97%`), subtle borders (`--border: 220 10% 90%`). Theme toggle via `DarkModeToggle` component with localStorage persistence, defaults to dark. No cyan, no neon glows, no cyber/sci-fi effects. All interactive elements use shadcn built-in hover states.
- **Branding & Logo**: `CaliberLogo` component (`client/src/components/CaliberLogo.tsx`) uses CSS mask-image technique with the uploaded PNG logo (`attached_assets/Gemini_Generated_Image_fzcsbpfzcsbpfzcs_1770855414576.png`). At runtime, processes the PNG via canvas to create a transparent mask, then applies dynamic color via `backgroundColor`. Accepts `size` and `color` props. Used in app header, landing page, sidebar, mobile drawer, and public pages. In authenticated views, color dynamically matches the player's equipped accent theme from the shop. Public pages use static crimson (#E8192C).
- **Personality & Polish**: Sport-themed loading spinners (`SportSpinner` component - bouncing basketball / spinning football based on selected sport), personalized time-of-day greeting banner on player profiles, and animated count-up effect on stat card values for a dynamic feel.
- **Contextual Help**: Integrated `HelpTooltip` and `FeatureTip` components for on-demand explanations across major hub pages.
- **New User Onboarding System**: Progressive disclosure to prevent feature overwhelm:
  - **OnboardingTour** (`OnboardingTour.tsx`): 7-step fullscreen welcome modal on first login (localStorage: `caliber_onboarding_completed`). Multi-sport aware, clickable progress dots, skip button.
  - **GettingStartedCard** (`GuidedOnboarding.tsx`): 6-step inline checklist card in feed (Create Profile, Log Game, View Grade, Set Bio, Follow Teammate, Check Leaderboard). localStorage: `caliber_guided_onboarding`. Auto-detects completion via API queries and location tracking.
  - **DiscoveryCards** (`DiscoveryCards.tsx`): Tappable feature-intro cards in feed. Shows 1 at a time, rotates through undismissed ones. Only appears after GettingStartedCard is dismissed/completed. Sport-filtered. localStorage: `caliber_discovery_dismissed`, `caliber_discovery_visited`.
  - **Role-based sidebar**: Player and Coach roles see reorganized nav with Essentials (top), Community, collapsible "More" section (starts collapsed, localStorage: `caliber_sidebar_more_expanded`), and Account (bottom).
  - **Sport-specific filtering**: Nav items can have optional `sport` property; filtered by `useSport()` to hide irrelevant items (e.g., Reel Builder only shows for basketball).

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
- **Smart Feed**: Instagram-style community feed with cursor-based pagination, infinite scroll, "New posts available" banner, and auto-loading via IntersectionObserver. Main feed filters to only show player-initiated content (games, workouts, reposts, polls, stories). System-generated notifications (badges, streaks, goals, challenges) are shown in a separate "Alerts" tab. Feed API supports `?type=social` and `?type=alerts` query parameters. Cards use clean Instagram layout: avatar + name + @username + time header, content area, and icon-based action bar (heart, comment, share, bookmark) with inline 1-2 comment preview.
- **Feed Comments & Replies**: Threaded commenting on all feed activity items with nested replies, comment likes, and delete. Tables: `feed_comments`, `feed_comment_likes`. APIs: `GET/POST /api/feed/:activityId/comments`, `POST /api/feed/comments/:id/like`.
- **Feed Repost with Caption**: Share any feed activity to your own feed with optional caption. API: `POST /api/feed/:activityId/repost`.
- **Enhanced Social Profiles**: Bio display with "add bio" prompt, profile completion bar (8 fields tracked), activity summary (badges, games this month) alongside follower/following counts.
- **Personal Bests**: Automatic career high detection on game logging. Tracks points, rebounds, assists, steals, blocks, and 3-pointers made. Shows career highs grid on player profiles. Celebration toast on new records. Table: `personal_records`. APIs: `GET /api/players/:id/personal-records`. Detection runs automatically in game creation flow.
- **Weekly Performance Recap**: Auto-generated weekly summary showing games played, average grade, PPG/RPG/APG, badges earned, best game, and week-over-week PPG change. Displayed on player profile. API: `GET /api/players/:id/weekly-recap`.
- **Goal Setting & Tracking**: Players set stat goals (PPG, RPG, APG, SPG, FG%, 3PT%, games played) with weekly/monthly/season timeframes. Progress bars on profile. Auto-updates when games are logged. Celebration toast on goal completion. Table: `player_goals`. APIs: `GET/POST /api/players/:id/player-goals`, `DELETE /api/players/:id/player-goals/:goalId`.
- **Celebration System**: Full-screen confetti/particle overlays for achievements, XP gain toasts, career high toasts, and goal completion toasts.
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
  - **Recruiting Hub**: Player recruiting journey dashboard, AI-powered college matching with real program statistics (including NCAA eligibility checklist), searchable camps/events directory, and coach recommendation system. Public recruiting profile page at `/recruit/:id` (shareable link, no login required) with player stats, grades, badges, recent performance, and AI scouting report. AI Scouting Report generated via Gemini 2.5 Flash (requires 3+ games). Shareable Recruiting Card (downloadable branded image with player photo, grade, stats, tier). Public player directory at `/discover/players` with position/state/graduation year/grade filters.
  - **Performance Hub**: Training log with workout history and fitness data dashboard (wearable integration).
  - **Analytics Hub**: Player leaderboards (with city/region filtering and shareable ranking cards), head-to-head player comparison, team comparison, skill challenges, and detailed grading system explanation.
- **Cross-Platform Export**: PlatformExportModal component for exporting shareable cards in Instagram Story (9:16), Instagram Post (1:1), TikTok (9:16), and Twitter/X (16:9) formats with Caliber branding. Integrated into ShareModal as "Export for Social" button.
- **Discover Highlights Feed**: TikTok-style public vertical-scroll video feed at `/discover/highlights` with snap scrolling, like/view counts, player info overlays, sort options (recent/popular/liked), and sport filtering. Public API at `GET /api/discover/highlights`.

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