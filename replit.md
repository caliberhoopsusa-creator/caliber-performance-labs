# Caliber Performance Labs

## Overview

Caliber is a basketball player analytics and performance tracking application. It allows users to manage a roster of players, log individual game statistics, and receive automated performance grades and feedback. The system generates letter grades (A through F) based on traditional stats weighted by player position, along with efficiency metrics. Key features include a player leaderboard, head-to-head comparison between players, and trendline visualizations for tracking performance over time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with HMR for development
- **Charts**: Recharts for performance trendline visualizations
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API with typed contracts defined in `shared/routes.ts`
- **Validation**: Zod schemas for request/response validation, shared between client and server

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push`

### Key Data Models
- **Players**: Name, position (Guard/Wing/Big), height, team, jersey number, photo URL, banner URL, bio, totalXp, currentTier
- **Games**: Per-game statistics including points, rebounds, assists, shooting splits, advanced metrics, and calculated grades with feedback
- **Badges**: Virtual awards earned through performance (12 types including twenty_piece, double_double, hot_streak, etc.)
- **Goals**: Player-set targets for improvement with progress tracking
- **Streaks**: Automatic tracking of consecutive achievements (grade streaks, point streaks, etc.)
- **ActivityStreaks**: Daily activity tracking with current/longest streak counters per player
- **Conversations/Messages**: Chat history tables for AI integration support

### Gamification System
- **XP System**: Players earn XP for actions (game logged: 50, badge earned: 25, A grade: 30, A+ grade: 50, daily login: 10)
- **Tier Progression**: Rookie (0) → Starter (500) → All-Star (2,000) → MVP (5,000) → Hall of Fame (10,000)
- **Streak Bonuses**: 3-day (+25 XP), 7-day (+75 XP), 14-day (+150 XP), 30-day (+400 XP)
- **Milestone Badges**: Special badges for tier promotions (starter_unlock, allstar_unlock, etc.)
- **Skill Badges**: Progressive career badges that upgrade as players accumulate stats:
  - Sharpshooter (3-pointers): Bronze(10) → Silver(50) → Gold(150) → HOF(300)
  - Pure Passer (assists): Bronze(25) → Silver(100) → Gold(250) → HOF(500)
  - Bucket Getter (points): Bronze(100) → Silver(500) → Gold(1500) → HOF(3000)
  - Glass Cleaner (rebounds): Bronze(50) → Silver(200) → Gold(500) → HOF(1000)
  - Rim Protector (blocks): Bronze(10) → Silver(50) → Gold(125) → HOF(250)
  - Pickpocket (steals): Bronze(15) → Silver(75) → Gold(175) → HOF(350)
- **Constants**: TIER_THRESHOLDS, XP_REWARDS, and SKILL_BADGE_TYPES defined in shared/schema.ts

### AI Video Analysis
- **Integration**: Gemini AI via Replit AI Integrations (no API key required)
- **Video Upload**: Accepts MP4, WebM, MOV files up to 50MB
- **Play-by-Play**: Text-based stat extraction as alternative to video
- **Output**: Extracts points, rebounds, assists, steals, blocks, turnovers, shooting stats, hustle/defense ratings

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route-level page components
    hooks/        # Custom React hooks including API hooks
    lib/          # Utility functions and query client
server/           # Express backend
  index.ts        # Entry point and middleware
  routes.ts       # API route handlers and analysis logic
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client and server
  schema.ts       # Drizzle table definitions
  routes.ts       # API contract definitions with Zod schemas
```

### Analysis Logic
The grading algorithm in `server/routes.ts` calculates a performance score using position-weighted stats. Guards are penalized more for turnovers, Bigs get bonuses for rebounds and blocks, and Wings get extra credit for steals. The score maps to a letter grade with generated feedback text.

### Features
- **Dashboard**: Overview of players and recent games
- **Player Management**: Add/view/edit/delete players with position, height, team info, profile photo, and banner
- **Game Analysis**: Full stat entry with instant grade calculation
- **Leaderboard**: Rankings by average performance grade
- **Head-to-Head**: Compare two players' stats side-by-side
- **Video Analysis**: AI-powered stat extraction from game footage
- **Grading System**: Visual explanation of how grades are calculated
- **Trend Tracking**: Performance charts over time
- **Virtual Badges**: Auto-awarded achievements for performance milestones (20 Piece, Ironman, Hot Streak, etc.)
- **Shareable Player Cards**: Premium-styled graphics with one-click social sharing
- **Play Style Archetypes**: "You play like a 3&D Wing" comparisons based on stats
- **Goals & Streaks**: Player-set targets with progress tracking and streak monitoring
- **Season Statistics**: Comprehensive averages with radar chart visualization
- **Top 5 Games**: Highlighted best performances with expandable details
- **Social Engagement**: Public likes and comments on game performances
- **Scout Mode**: Recruiter discovery page with position, height, and grade filters
- **Challenges & Events**: Weekly/monthly app-wide challenges with leaderboards and badge rewards
- **Team Message Boards**: Create/join teams with shared discussion boards

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Connection Pool**: Uses `pg` package with connection pooling

### UI Component Library
- **shadcn/ui**: Pre-built accessible components using Radix UI primitives
- **Radix UI**: Underlying headless component primitives

### Development Tools
- **Vite**: Development server with HMR
- **Replit Plugins**: Dev banner and cartographer for Replit environment
- **esbuild**: Production bundling for server code

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `@tanstack/react-query`: Async state management
- `recharts`: Data visualization
- `date-fns`: Date formatting
- `wouter`: Client-side routing
- `zod`: Schema validation