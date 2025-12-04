# DealRush Platform

## Overview

DealRush is a group-buying e-commerce platform where prices dynamically decrease as more participants join a deal. The platform implements position-based dynamic pricing with tier systems, creating urgency through countdown timers while maintaining transparency. Users always pay the lowest price achieved by the time a deal closes, regardless of when they joined.

**Core Mechanic**: The more people who purchase, the lower the price drops for everyone - fostering a collaborative shopping experience with significant savings (10-70% discounts).

**Technology Stack**: React + TypeScript frontend with Express backend, designed for RTL (Hebrew) interface with real-time price updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**December 2024**:
- Replaced Replit Auth with custom email/password authentication system
- Added Social Login via Replit OIDC (supports Google, Apple, GitHub, X)
  - Dual authentication: users can login via email/password OR social providers
  - Social login automatically verifies email and merges with existing accounts
  - setupSocialAuth function in server/replitAuth.ts
- Integrated Stripe for payment processing with card validation before joining deals
- Updated participants table to track payment status and Stripe payment method IDs
- Added card validation requirement before users can join deals
- Implemented automatic deal closure service:
  - Scheduled closure: each deal is scheduled to close exactly when its timer reaches 0
  - New deals are automatically scheduled when created
  - Deal updates reschedule the closure time
  - Checks minimum participants requirement
  - If minimum not met: cancels deal, notifies all participants (no charge)
  - If minimum met: charges all participants using stored payment methods
  - Handles partial payment failures with proper status tracking
- Added email notifications:
  - sendDealCancelledNotification - when deal doesn't reach minimum
  - sendTierUnlockedNotification - when new discount tier is reached
  - sendPaymentChargedNotification - after successful payment
- Added WebSocket notifications for real-time updates:
  - deal_cancelled, deal_closed, tier_unlocked message types
- Added idempotency guards to prevent duplicate deal processing
- Added Admin Analytics Dashboard (AdminPage.tsx):
  - Summary stats: active deals, closed deals, new registrations, total users
  - Units sold tracking with participant counts
  - Revenue and platform profit calculations
  - Vendor payout tracking with commission breakdowns
  - Daily statistics chart (registrations, participants, revenue)
  - Date range filters (today, 7 days, 30 days)
- Added animated video placeholder in "How it Works" section
- Modern minimalist countdown timer design (removed aggressive FOMO messaging)
- Fixed Israel timezone handling using Intl.DateTimeFormat with Asia/Jerusalem (DST-aware)
- Added Closed Deals Dashboard in Admin Panel:
  - API: GET `/api/admin/closed-deals` returns comprehensive stats per deal
  - Stats: units sold, total revenue, customer savings, platform profit
  - Expandable deal cards with financial breakdown
  - Participant list showing initials (privacy), position, discount, payment status
  - Status display: completed, closed, cancelled with appropriate styling
- Updated Stripe payment flow:
  - Uses Stripe Elements (CardElement) for card collection
  - SetupIntent flow with proper error handling and retry
  - Guards against missing clientSecret with error UI

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
- Position-based pricing calculations handled client-side via utility functions
- Real-time countdown timers with visual urgency indicators

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js.

**API Structure**: RESTful API with routes prefixed under `/api`. Route registration happens through `registerRoutes()` function in `server/routes.ts`.

**Development Mode**: Vite dev server integration for HMR (Hot Module Replacement) during development via custom middleware.

**Static File Serving**: Production builds serve static files from `dist/public` directory with SPA fallback to `index.html`.

**Storage Interface**: DatabaseStorage implementation using Drizzle ORM with PostgreSQL for persistent data storage.

**API Endpoints**:
- GET `/api/deals` - List all active deals
- GET `/api/deals/:id` - Get single deal by ID
- POST `/api/deals` - Create new deal (admin only)
- PATCH `/api/deals/:id` - Update existing deal (admin only)
- DELETE `/api/deals/:id` - Delete deal (admin only)
- POST `/api/deals/:id/join` - Join a deal (requires authentication and card validation)
- POST `/api/upload` - Upload images (multer middleware)
- GET `/api/admin/analytics` - Get analytics data with date range filter (admin only)
- GET `/api/admin/participants` - Get all participants with deal names (admin only)
- GET `/api/admin/closed-deals` - Get closed deals with comprehensive stats (admin only)
- GET `/api/social/login` - Initiate OAuth social login via Replit OIDC
- GET `/api/callback` - OAuth callback handler

**Build System**: Custom esbuild configuration that bundles server code with selective dependency bundling (allowlist approach) to optimize cold start times.

### Data Architecture

**Database ORM**: Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`).

**Schema Design**: Includes users, deals, and participants tables. Schema definitions use Drizzle's pg-core with Zod validation via `drizzle-zod`.

**Users Schema** (`shared/schema.ts`):
- id, email, passwordHash (bcrypt hashed)
- firstName, lastName, phone
- isEmailVerified, emailVerificationToken, emailVerificationExpires
- passwordResetToken, passwordResetExpires
- stripeCustomerId
- isAdmin, profileImageUrl
- createdAt, updatedAt

**Deals Schema** (`shared/schema.ts`):
- id, name, description, category
- images (array of URLs)
- originalPrice, currentPrice, participants, targetParticipants
- endTime (timestamp)
- tiers (JSON array with minParticipants, maxParticipants, discount, price)
- specs (JSON array of label/value pairs)
- isActive, status, minParticipants
- createdAt

**Participants Schema** (`shared/schema.ts`):
- id, dealId, name, pricePaid, position, joinedAt
- userId, email, phone
- paymentStatus (pending, card_validated, charged, failed, refunded, cancelled)
- stripePaymentIntentId, stripeSetupIntentId, stripePaymentMethodId
- cardLast4, cardBrand, tierAtJoin
- Position determines price within tier (±2.5% variance)
- Privacy: UI displays initials only (e.g., "ד.ל." instead of full name)

**Categories**: apartments, electrical, furniture, electronics, home, fashion

**Migration Strategy**: Drizzle Kit for schema migrations, using `npm run db:push` to sync schema changes.

**Data Validation**: Zod schemas for runtime validation, co-located with Drizzle table definitions for type safety.

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
- **AdminPage**: Full CRUD management for deals with forms for images, pricing, and tiers
- **ParticipantsList**: Shows all deal participants with privacy-protected initials, individual prices, and position-based discounts
- **AuthModal**: Login/Register modal with email/password authentication

**Deal Detail Layout** (RTL):
- Right side: Product title, description, pricing, countdown timer, join button
- Left side: Image gallery with thumbnails

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

### Authentication System

**Implementation**: Custom email/password authentication with bcrypt password hashing

**Key Files**:
- `server/auth.ts` - Password hashing, verification, token generation
- `server/routes.ts` - Auth API endpoints
- `client/src/hooks/useAuth.ts` - React hook for auth state
- `client/src/components/AuthModal.tsx` - Login/Register UI

**Auth Endpoints**:
- POST `/api/auth/register` - Register new user with email/password
- POST `/api/auth/login` - Login with email/password
- POST `/api/auth/logout` - Logout user
- GET `/api/auth/user` - Returns current user (protected)
- POST `/api/auth/verify-email` - Verify email with token
- POST `/api/auth/resend-verification` - Resend verification email
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password with token
- GET `/api/user/purchases` - User purchase history (protected)

**Session Configuration**:
- MemoryStore-backed sessions for development
- Secure cookie flag based on NODE_ENV
- 7-day session expiration

**Password Security**:
- bcrypt hashing with 12 salt rounds
- Minimum 8 character requirement
- Email verification tokens expire in 24 hours
- Password reset tokens expire in 1 hour

### Payment System

**Implementation**: Stripe integration for card validation and payment processing

**Key Files**:
- `server/stripeClient.ts` - Stripe client initialization and credentials
- `server/stripeService.ts` - Stripe operations (customers, payments, cards)
- `server/webhookHandlers.ts` - Stripe webhook processing

**Stripe Endpoints**:
- GET `/api/stripe/publishable-key` - Get Stripe publishable key for frontend
- POST `/api/stripe/create-setup-intent` - Create setup intent for card saving
- POST `/api/stripe/validate-card` - Validate a payment method
- POST `/api/stripe/attach-payment-method` - Attach card to customer
- GET `/api/stripe/payment-methods` - List user's saved payment methods

**Payment Flow**:
1. User adds card via Stripe Elements (saved with Setup Intent)
2. Card is validated before user can join a deal
3. Payment is held until deal closes
4. When deal closes successfully, all participants are charged
5. If deal doesn't reach minimum, participants are notified (no charge)

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
- bcrypt for password hashing
- Stripe for payment processing
- stripe-replit-sync for Stripe data sync

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

### Email Service

**Provider**: Gmail API via Google OAuth2
- Sends verification emails, password reset emails
- Deal notifications (join confirmation, tier unlocks, deal closure)
