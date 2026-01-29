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
- **Performance Tools**: Live game mode for real-time stat entry, interactive shot charts, and advanced metric calculations.
- **Scheduling**: Practice scheduler and calendar.
- **Coach Features**: Team dashboard, game notes, lineup analysis, practice tracking with live mode, and AI-generated drill recommendations.
- **Trust & Verification**: Player ratings system by coaches, stat verifications with digital signatures, skill challenges with leaderboards, and AI analysis for highlight verification.
- **Subscription & Monetization**: Tiered subscription model (Free, Pro, Coach Pro) integrated with Stripe, protected by frontend components and backend middleware.

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