# DealRush Platform

## Overview

DealRush is a group-buying e-commerce platform where prices dynamically decrease as more participants join a deal. The platform implements position-based dynamic pricing with tier systems, creating urgency through countdown timers while maintaining transparency. Users always pay the lowest price achieved by the time a deal closes, regardless of when they joined.

**Core Mechanic**: The more people who purchase, the lower the price drops for everyone - fostering a collaborative shopping experience with significant savings (10-70% discounts).

**Technology Stack**: React + TypeScript frontend with Express backend, designed for RTL (Hebrew) interface with real-time price updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and bundler.

**Routing**: Client-side routing via Wouter (lightweight React router).

**UI Component Library**: Shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS. Design system follows "new-york" style variant with RTL support for Hebrew.

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. No global state management library - relies on React's built-in state and context.

**Styling Approach**: 
- Tailwind CSS with custom design tokens for consistent spacing (4, 6, 8, 12, 16px units)
- RTL-first layout system (Hebrew interface)
- Custom CSS variables for theming (light mode optimized for deal urgency)
- Typography: Rubik and Heebo fonts from Google Fonts for Hebrew readability

**Key Frontend Patterns**:
- Component-driven architecture with reusable UI primitives
- Mock data implementations (marked with "todo: remove mock functionality") for frontend-first development
- Position-based pricing calculations handled client-side via utility functions
- Real-time countdown timers with visual urgency indicators

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js.

**API Structure**: RESTful API with routes prefixed under `/api`. Route registration happens through `registerRoutes()` function in `server/routes.ts`.

**Development Mode**: Vite dev server integration for HMR (Hot Module Replacement) during development via custom middleware.

**Static File Serving**: Production builds serve static files from `dist/public` directory with SPA fallback to `index.html`.

**Storage Interface**: Abstracted storage layer (`IStorage` interface) with in-memory implementation (`MemStorage`). Designed to be swapped with database implementations without changing business logic.

**Build System**: Custom esbuild configuration that bundles server code with selective dependency bundling (allowlist approach) to optimize cold start times.

### Data Architecture

**Database ORM**: Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`).

**Schema Design**: Currently minimal with a users table. Schema definitions use Drizzle's pg-core with Zod validation via `drizzle-zod`.

**Migration Strategy**: Drizzle Kit for schema migrations, output to `./migrations` directory.

**Data Validation**: Zod schemas for runtime validation, co-located with Drizzle table definitions for type safety.

**Future Schema Needs** (based on application logic):
- Deals table (products, pricing tiers, participant counts, end times)
- Orders/Transactions table
- Participants junction table (users to deals)
- Price history for tier tracking

### Design System & UI Patterns

**Core Design Principles**:
- Reference-based design inspired by Wolt/DoorDash, Booking.com, Amazon, and Groupon
- Urgency and FOMO through bold visual hierarchy
- RTL-first with Hebrew typography
- Trust signals and social proof patterns

**Component Architecture**:
- Atomic design with base UI components in `client/src/components/ui/`
- Composite components for business logic (DealCard, TierProgress, CountdownTimer)
- Page-level components in `client/src/pages/`

**Key UI Components**:
- **DealCard**: Displays deal with real-time pricing, progress bars, countdown timers
- **CountdownTimer**: Multi-state timer with urgency indicators (safe/warning/urgent/critical)
- **TierProgress**: Shows pricing tiers and progress toward next discount level
- **PriceDisplay**: Formatted pricing with original/current price and savings
- **ActivityFeed**: Real-time social proof of other users joining

### Pricing System

**Position-Based Pricing Logic** (`client/src/lib/pricing.ts`):
- Each tier has a min/max participant range and associated discount
- Price variance of ±2.5% within each tier based on join position
- First buyers in a tier pay slightly more, last buyers pay slightly less
- Everyone pays the lowest price achieved when deal closes

**Tier Configuration**:
- Defined per deal with flexible min/max participants
- Supports percentage discounts or absolute prices
- Current participant count determines active tier
- Next tier unlocked when participant threshold reached

## External Dependencies

### Core Dependencies

**Frontend**:
- React 18.x with React DOM
- Wouter for routing
- TanStack Query v5 for data fetching
- React Hook Form with Zod resolvers for form validation
- date-fns for date manipulation

**UI Components**:
- Radix UI component primitives (@radix-ui/react-*)
- Embla Carousel for image galleries
- Lucide React for icons
- class-variance-authority for component variants
- tailwind-merge + clsx for className utilities

**Styling**:
- Tailwind CSS v3
- PostCSS with autoprefixer
- Google Fonts (Rubik, Heebo)

**Backend**:
- Express.js v4
- Drizzle ORM v0.39
- @neondatabase/serverless for PostgreSQL connection
- Zod for validation
- connect-pg-simple for session storage (configured but not yet implemented)

### Build Tools & Development

- Vite v5 for frontend bundling and dev server
- esbuild for server bundling
- TypeScript v5 with strict mode
- tsx for running TypeScript in development

### Replit-Specific Plugins

- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer (dev only)
- @replit/vite-plugin-dev-banner (dev only)

### Database

**Provider**: Neon Database (PostgreSQL serverless)
- Connection via `@neondatabase/serverless` driver
- Configured through `DATABASE_URL` environment variable
- Drizzle Kit for schema management and migrations

### Future Integration Points

Based on checkout and payment flows in components:
- Payment processor integration needed (Stripe dependencies present)
- Email service for notifications (nodemailer present)
- Session management (express-session configured)
- File upload handling (multer present)