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
- **Skill Badges**: Progressive career badges with 8 ranks (Brick → Bronze → Silver → Gold → Platinum → HOF → Legend → GOAT):
  - Sharpshooter (3-pointers): 5 → 15 → 40 → 100 → 200 → 350 → 500 → 750
  - Pure Passer (assists): 10 → 35 → 80 → 175 → 350 → 600 → 900 → 1500
  - Bucket Getter (points): 50 → 150 → 400 → 1000 → 2000 → 4000 → 7000 → 12000
  - Glass Cleaner (rebounds): 25 → 75 → 175 → 400 → 750 → 1250 → 2000 → 3500
  - Rim Protector (blocks): 5 → 15 → 40 → 90 → 175 → 300 → 500 → 800
  - Pickpocket (steals): 8 → 25 → 60 → 130 → 250 → 425 → 650 → 1000
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

### Authentication & Role-Based Access Control
- **Authentication**: Replit Auth with session management
- **User Roles**: Two roles - "player" and "coach" selected on first login
- **Player Role**: Can only view/edit their own profile and log games for themselves
- **Coach Role**: Full access to all players, coach tools, scouting, and analysis features
- **Middleware**: 
  - `isAuthenticated` - requires login
  - `isCoach` - requires coach role
  - `canModifyPlayer(req, playerId)` - checks if user can modify specific player
- **Protected Routes**:
  - `POST /api/players` - coaches only
  - `DELETE /api/players/:id` - coaches only
  - `PATCH /api/players/:id` - coaches or player's own profile
  - `POST /api/games` - coaches or player's own games
  - All coach tools routes (`/api/coach-goals`, `/api/practices`, etc.) - coaches only

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

### Coach Analysis Features
- **Team Dashboard**: Overview of entire roster with sortable stats, position filters, and best performers
- **Shot Charts / Heat Maps**: Visual basketball court with shot locations, zone statistics, and clickable shot entry
- **Game Notes**: Coach observations per game with note types (observation, improvement, praise, strategy)
- **Lineup Analysis**: Create and track player combinations, position depth charts with tier rankings
- **Practice Tracker**: Log practice sessions, attendance, effort ratings, and drill scores
- **Drill Recommendations**: AI-generated drill suggestions based on player weaknesses
- **Trend Alerts**: Automatic notifications for performance drops, streak endings, and improvements
- **Improvement Reports**: Weekly/monthly progress summaries with visual trend charts
- **Opponent Scouting**: Track opposing teams and players with tendencies, strengths, weaknesses
- **Pre-Game Reports**: Printable summaries with recent performance and opponent matchup history
- **Player Report Cards**: Comprehensive shareable reports for parents with season stats and progress
- **Coach-Assigned Goals**: Goal assignments with progress tracking and coach feedback

### Coach Data Models
- **shots**: Shot chart data with x/y coordinates, shot type, result, quarter
- **gameNotes**: Coach notes with note type, privacy settings, author
- **practices**: Practice sessions with date, duration, notes
- **practiceAttendance**: Attendance records with effort ratings
- **drills**: Available drill types by category
- **drillScores**: Player performance on drills
- **lineups**: Player combinations with names
- **lineupStats**: Lineup performance metrics
- **opponents**: Scouting reports for teams/players
- **alerts**: Trend alerts with severity levels
- **coachGoals**: Coach-assigned goals with status tracking
- **drillRecommendations**: AI-generated drill suggestions

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