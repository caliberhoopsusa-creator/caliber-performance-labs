# Caliber Performance Labs

## Overview
Caliber is a multi-sport player analytics and performance tracking application, currently supporting basketball and football. It helps users manage player rosters, log game statistics, and provides automated, position-weighted performance feedback with letter grades (A-F). The application aims to be a leading solution in sports analytics, offering features like player leaderboards, head-to-head comparisons, performance trendlines, gamification, and AI-powered analysis to aid player development, scouting, and coaching.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui (New York style)
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **UI/UX**: Features a sleek, futuristic dark theme with sci-fi inspired aesthetics, including cyber-grid backgrounds, gradient text, glowing elements, and Framer-motion animations. It utilizes custom utility classes like `cyber-grid`, `neon-border`, and `tech-panel`. Typography uses Teko for headings and Inter for body text. The design is mobile-optimized with PWA support.
- **Mobile Components**: 
  - `FloatingActionButton`: Expandable FAB with role-specific quick actions (players: Log Game, Highlights, Goals; coaches: Scout, Endorse, Lineup). Hidden on /analyze, /video, /role-selection, / routes.
  - `PullToRefreshIndicator`: Visual pull-to-refresh UI component with animated spinner.
  - `CollapsibleStatCard`: Collapsible stat sections with accessible button-based header, keyboard navigation, and aria-expanded state.
  - `MobileStatGrid`: Grid layout optimized for mobile stat displays.
- **Error Boundary**: A custom React Error Boundary provides a futuristic error UI with graceful handling and debugging information.

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API with typed contracts.
- **Validation**: Zod schemas for request/response validation.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod
- **Schema**: Defined in `shared/schema.ts`
- **Database Indexes**: Comprehensive indexing on all relevant columns for query optimization.

### Core Features
- **Multi-Sport Support**: Configurable for basketball and football, with position-specific stats and grading.
- **Player Management**: Comprehensive profiles, stat entry, and performance tracking.
- **Gamification**: XP system, tier progression (Rookie to Hall of Fame), streak bonuses, and skill-based badges.
- **AI Integration**: Gemini AI for video analysis to extract game statistics and AI Projections for future performance.
- **Authentication**: Replit Auth with session management and role-based access control (Player/Coach), including robust error handling for session expiry, network issues, and profile validation.
- **Social & Engagement**: Player following, in-app notifications, goal sharing, highlight clips, and shareable achievements.
- **Community Hub** (`/community`): A unified tabbed interface consolidating all social features. Uses URL parameters for tab navigation (?tab=feed|stories|polls|connect). Old routes redirect for backwards compatibility.
  - **Feed Tab** (`?tab=feed`): Activity feed showing latest updates from players and teams with All/Following/Team filters
  - **Stories Tab** (`?tab=stories`): Instagram-style 24-hour stories with creation, viewing, and player grouping
  - **Polls Tab** (`?tab=polls`): Community polls and matchup predictions with voting and results
  - **Connect Tab** (`?tab=connect`): Find and follow players with discovery and following activity views
  - **Backwards Compatibility**: `/feed`, `/newsfeed`, `/stories`, `/social-hub` all redirect to appropriate Community Hub tabs
- **Coach Hub** (`/coach`): A unified tabbed interface consolidating all coach-related features. Uses URL parameters for tab navigation (?tab=dashboard|verify|endorse|practices|lineups|scouting|alerts). Old routes redirect for backwards compatibility.
  - **Dashboard Tab** (`?tab=dashboard`): Team overview with roster stats, position distribution, best performers, and recent activity
  - **Verify Tab** (`?tab=verify`): Game verification queue for reviewing player-submitted statistics
  - **Endorse Tab** (`?tab=endorse`): Player endorsements with search/filter and recommendation writing
  - **Practices Tab** (`?tab=practices`): Practice tracking with attendance, live sessions, and drill scoring (Coach Pro)
  - **Lineups Tab** (`?tab=lineups`): Lineup management, depth chart, and lineup comparison tools (Coach Pro)
  - **Scouting Tab** (`?tab=scouting`): Opponent scouting with team/player notes and game preparation (Coach Pro)
  - **Alerts Tab** (`?tab=alerts`): Performance alerts and trend notifications for team players (Coach Pro)
  - **Backwards Compatibility**: `/coach/dashboard`, `/coach/hub`, `/coach/verify`, `/coach/endorsements`, `/coach/practices`, `/coach/lineups`, `/coach/scouting`, `/coach/alerts` all redirect to appropriate Coach Hub tabs
- **Scout Hub**: Dedicated page with advanced filtering and sorting for scouting players across sports. Includes search, sport/position/state/graduation year filters, and public player profiles.
- **Recruiting Hub** (`/recruiting`): A unified tabbed interface consolidating all recruiting-related features. Uses URL parameters for tab navigation (?tab=journey|schools|events). Old routes redirect for backwards compatibility.
  - **My Journey Tab** (`?tab=journey`): Recruiting dashboard showing timeline, NCAA eligibility checklist, interested schools, contact history, and profile completeness
  - **Find Schools Tab** (`?tab=schools`): AI-powered college matching with real program statistics including win/loss records, national championships, pro draft picks, graduation rates, NIL opportunities. Sport-specific filtering displays basketball programs (NBA players, March Madness appearances) or football programs (NFL players, Bowl games). Covers 57 programs across D1, D2, D3, NAIA, and JUCO divisions with real recruiting contact emails and URLs. Live stats sync via CollegeFootballData.com API (football) and ESPN API (basketball) - endpoint: `POST /api/colleges/sync-stats`
  - **Camps & Events Tab** (`?tab=events`): Searchable directory with filters by sport, state, event type (camps, showcases, combines), and date range. Players can save events to their interest list. Coaches can create team-specific or public events.
  - **Express Interest**: Heart button to save colleges to player's interest list (`player_college_interests` table)
  - **Email Coach**: One-click mailto button with pre-filled subject/body including player stats, GPA, graduation year
  - **Public Profile**: Shareable player profile at `/profile/:id/public` for coaches/recruiters (no auth required)
  - **Recruiting Timeline**: Visual timeline showing key milestones (NCAA eligibility, contact periods, signing dates) based on graduation year and sport
  - **NCAA Eligibility Checklist**: Tracking progress across 5 categories: NCAA Registration, Academic Requirements, Test Scores, Transcripts, and Amateurism Status. Division-specific requirements (D1, D2, D3, NAIA, JUCO).
  - **Coach Recommendations**: Coaches can write endorsements for players with 5-star ratings across Athletic Ability, Work Ethic, Coachability, Leadership, and Character. Recommendations display on public player profiles for recruiters.
- **Performance Tools**: Live game mode for real-time stat entry, interactive shot charts, and advanced metric calculations.
- **Scheduling**: Practice scheduler and calendar.
- **Coach Features**: Team dashboard, game notes, lineup analysis, practice tracking with live mode, AI-generated drill recommendations, and one-click game verification queue with sport filtering.
- **Trust & Verification**: Player ratings system by coaches, stat verifications with digital signatures and quick-verify workflow, skill challenges with leaderboards, AI analysis for highlight verification, and secure cross-team verification prevention.
- **Subscription & Monetization**: Tiered subscription model (Free, Pro, Coach Pro) integrated with Stripe, protected by frontend components and backend middleware.
- **Performance Hub** (`/performance`): A unified tabbed interface consolidating workout and fitness tracking. Uses URL parameters for tab navigation (?tab=workouts|fitness). Old routes redirect for backwards compatibility.
  - **Workouts Tab** (`?tab=workouts`): Training log with workout history, intensity tracking, and duration stats
  - **Fitness Tab** (`?tab=fitness`): Wearable data dashboard with recovery score, sleep, HRV, activity tracking, and manual entry
  - **Backwards Compatibility**: `/workouts`, `/fitness` redirect to appropriate Performance Hub tabs
- **Wearable Integration**: Fitness dashboard with manual entry and wearable device connections. Fitbit OAuth integration with PKCE for secure token handling. Supports syncing activity, sleep, and heart rate data. Additional wearables (Apple Health, Google Fit, WHOOP) are prepared for future integration.
- **Analytics Hub** (`/analytics`): A unified tabbed interface consolidating all competitive analytics and ranking features. Uses URL parameters for tab navigation (?tab=leaderboard|compare|teams|challenges|grading). Old routes redirect for backwards compatibility.
  - **Leaderboard Tab** (`?tab=leaderboard`): Player rankings with filters by state, position, level, and sport
  - **Compare Tab** (`?tab=compare`): Head-to-head player comparison with statistical breakdowns (Pro feature)
  - **Teams Tab** (`?tab=teams`): Team comparison with aggregate stats, best performers, and roster lists
  - **Challenges Tab** (`?tab=challenges`): Skill challenges with leaderboards, progress tracking, and coach-created challenges
  - **Grading Tab** (`?tab=grading`): Grading system explanation with grade scale, stat weights, position adjustments, and bonuses
  - **Backwards Compatibility**: `/leaderboard`, `/compare`, `/team-comparison`, `/challenges`, `/grading` all redirect to appropriate Analytics Hub tabs

## External Dependencies

### Database
- PostgreSQL

### UI Components
- shadcn/ui (built on Radix UI)

### Development Tools
- Vite
- Replit Plugins
- esbuild

### Key NPM Packages
- drizzle-orm / drizzle-zod
- @tanstack/react-query
- recharts
- date-fns
- wouter
- zod