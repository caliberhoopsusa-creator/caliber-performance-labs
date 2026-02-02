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
- **Player Discovery**: Public directory with search and filters, allowing players to be discoverable by coaches and scouts.
- **Scout Hub**: Dedicated page with advanced filtering and sorting for scouting players across sports.
- **College Recruiting**: AI-powered college matching with real program statistics including win/loss records, national championships, pro draft picks, graduation rates, NIL opportunities, coach records, attendance figures, and athletic budgets. Sport-specific filtering displays basketball programs (NBA players, March Madness appearances) or football programs (NFL players, Bowl games) based on player's sport. Covers 57 programs across D1, D2, D3, NAIA, and JUCO divisions with real recruiting contact emails and URLs. Live stats sync via CollegeFootballData.com API (football) and ESPN API (basketball) - endpoint: `POST /api/colleges/sync-stats`. Features include:
  - **Express Interest**: Heart button to save colleges to player's interest list (`player_college_interests` table)
  - **Email Coach**: One-click mailto button with pre-filled subject/body including player stats, GPA, graduation year
  - **Public Profile**: Shareable player profile at `/profile/:id/public` for coaches/recruiters (no auth required)
  - **Recruiting Timeline**: Visual timeline showing key milestones (NCAA eligibility, contact periods, signing dates) based on graduation year and sport
  - **My Recruiting Dashboard**: Centralized view at `/recruiting` showing interested schools, contact history, timeline progress, and profile completeness
  - **Camp & Showcase Finder**: Searchable directory at `/camps-showcases` with filters by sport, state, event type (camps, showcases, combines), and date range. Players can save events to their interest list. 10 sample events seeded covering basketball and football.
  - **NCAA Eligibility Checklist**: Component on My Recruiting dashboard tracking progress across 5 categories: NCAA Registration, Academic Requirements, Test Scores, Transcripts, and Amateurism Status. Division-specific requirements (D1, D2, D3, NAIA, JUCO).
  - **Coach Recommendations**: Coaches can write endorsements for players with 5-star ratings across Athletic Ability, Work Ethic, Coachability, Leadership, and Character. Recommendations display on public player profiles for recruiters.
- **Performance Tools**: Live game mode for real-time stat entry, interactive shot charts, and advanced metric calculations.
- **Scheduling**: Practice scheduler and calendar.
- **Coach Features**: Team dashboard, game notes, lineup analysis, practice tracking with live mode, AI-generated drill recommendations, and one-click game verification queue with sport filtering.
- **Trust & Verification**: Player ratings system by coaches, stat verifications with digital signatures and quick-verify workflow, skill challenges with leaderboards, AI analysis for highlight verification, and secure cross-team verification prevention.
- **Subscription & Monetization**: Tiered subscription model (Free, Pro, Coach Pro) integrated with Stripe, protected by frontend components and backend middleware.
- **Wearable Integration**: Fitness dashboard with manual entry and wearable device connections. Fitbit OAuth integration with PKCE for secure token handling. Supports syncing activity, sleep, and heart rate data. Additional wearables (Apple Health, Google Fit, WHOOP) are prepared for future integration.

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