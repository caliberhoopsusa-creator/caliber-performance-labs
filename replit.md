# Caliber Performance Labs

## Overview
Caliber is a basketball player analytics and performance tracking application designed to help users manage player rosters, log game statistics, and receive automated performance feedback. It generates letter grades (A-F) based on position-weighted traditional stats and efficiency metrics. The application includes features like a player leaderboard, head-to-head comparisons, and performance trendline visualizations. The project aims to provide comprehensive tools for player development and scouting, incorporating gamification, AI-powered analysis, and robust coach features, positioning itself as a leading solution in sports analytics.

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

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API with typed contracts (shared/routes.ts)
- **Validation**: Zod schemas for request/response validation

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod
- **Schema**: Defined in `shared/schema.ts`

### Core Features
- **Player Management**: Add, view, edit, delete players with comprehensive profiles.
- **Game Analysis**: Full stat entry with instant grade calculation based on position-weighted metrics.
- **Gamification**: XP system, tier progression (Rookie to Hall of Fame), streak bonuses, and skill-based badges with progressive ranks (e.g., Sharpshooter, Pure Passer).
- **AI Integration**: Gemini AI for video analysis to extract game statistics from uploaded footage.
- **Authentication**: Replit Auth with session management and role-based access control (Player/Coach).
- **Social & Engagement**: Player following, in-app notifications, goal sharing, highlight clips gallery, and shareable achievement graphics.
- **Player Discovery**: Public player directory (/discover) with search and filters. Players can toggle "Open to Opportunities" in their profile settings and add location (city, state), school, and graduation year to be found by coaches and scouts.
- **Performance Tools**: Live game mode for real-time stat entry, interactive shot charts, off-court workout tracker, and advanced metric calculations (True Shooting %, PER, etc.).
- **Scheduling**: Practice scheduler and calendar for managing events.
- **Coach Features**: Team dashboard, shot charts, game notes, lineup analysis, practice tracking, AI-generated drill recommendations, and comprehensive player report cards.
- **UI/UX**: Minimal dark theme with glassmorphic design elements, clean white primary accent, dot-grid background pattern (40px grid), and subtle glow effects. Features include:
  - Glassmorphic cards: `glass-card` utility class (bg-card/60, backdrop-blur-xl, border-white/5)
  - Sidebar: Dark elevated background with subtle borders, minimal nav items with white accent for active states
  - Mobile nav: Clean bottom navigation with floating action button
  - Typography: Teko font for headings, Inter for body text
  - Premium utility classes for visual flair including gradient effects and animations
  - Mobile-optimized with PWA support and offline capabilities

### Subscription & Monetization
- **Stripe Integration**: Subscription-based monetization with Stripe payment processing
- **Subscription Tiers**:
  - `free`: Basic player management, game logging, leaderboards
  - `pro`: Advanced analytics, AI video analysis, shot charts, live game mode, report cards, head-to-head comparisons
  - `coach_pro`: All pro features + team dashboard, lineup analysis, practice tracker, opponent scouting, trend alerts
- **Owner Bypass**: User ID 53178287 has permanent full access bypassing all subscription checks
- **Paywall System**:
  - Frontend: `<Paywall>` component wraps premium pages, showing upgrade prompt for non-subscribers
  - Backend: `requiresSubscription` middleware protects premium API routes, returning 403 SUBSCRIPTION_REQUIRED
  - Hook: `useSubscription()` provides `isPremium`, `hasAccess(tier)` for checking subscription status

## External Dependencies

### Database
- **PostgreSQL**

### UI Components
- **shadcn/ui** (built on Radix UI)

### Development Tools
- **Vite**
- **Replit Plugins** (Dev banner, Cartographer)
- **esbuild**

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`
- `@tanstack/react-query`
- `recharts`
- `date-fns`
- `wouter`
- `zod`