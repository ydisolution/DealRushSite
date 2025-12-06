# DealRush Platform

## Overview

DealRush is a group-buying e-commerce platform featuring dynamic, position-based pricing that decreases as more users join a deal. It offers significant savings (10-70% discounts) through a collaborative shopping experience, with users always paying the lowest price achieved by deal closure. The platform integrates a React + TypeScript frontend with an Express backend, designed for an RTL (Hebrew) interface and real-time price updates. Key features include a custom authentication system, social login, Stripe integration for payments, automated deal closure with participant charging, email and WebSocket notifications, and comprehensive admin and supplier dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite.
**Routing**: Wouter.
**UI Component Library**: Shadcn/ui (Radix UI, Tailwind CSS) with RTL support for Hebrew.
**State Management**: TanStack Query for server state.
**Styling**: Tailwind CSS with custom design tokens, RTL-first layout, custom CSS variables for theming, and Rubik/Heebo fonts.
**Key Patterns**: Component-driven, client-side pricing calculations, real-time countdowns.

### Backend Architecture

**Server Framework**: Express.js with TypeScript.
**API Structure**: RESTful API under `/api`, registered via `registerRoutes()`.
**Development**: Vite dev server integration with HMR.
**Static File Serving**: Serves from `dist/public` with SPA fallback.
**Storage Interface**: Drizzle ORM with PostgreSQL.
**Key API Endpoints**: Deals CRUD, join deal, image upload, admin analytics, social login, and Stripe-related endpoints.
**Build System**: Custom esbuild configuration for optimized bundling.

### Data Architecture

**Database ORM**: Drizzle ORM for PostgreSQL (`@neondatabase/serverless`).
**Schema Design**: Users, deals, and participants tables with Drizzle's pg-core and Zod validation.
**Key Schemas**:
- **Users**: id, email, passwordHash, firstName, lastName, phone, authentication and verification tokens, Stripe customer ID, admin/supplier roles.
- **Deals**: id, name, description, category, images, pricing details (originalPrice, currentPrice, tiers), endTime, status, minParticipants.
- **Participants**: id, dealId, userId, pricePaid, position, paymentStatus, Stripe payment details, tierAtJoin.
**Migration Strategy**: Drizzle Kit.
**Data Validation**: Zod schemas.

### Design System & UI Patterns

**Core Design Principles**: Inspired by leading e-commerce platforms, emphasizing urgency, FOMO, RTL-first design, and trust signals.
**Component Architecture**: Atomic design with base UI components (`client/src/components/ui/`), composite components (DealCard, TierProgress), and page-level components.
**Key UI Components**: DealCard, CountdownTimer, TierProgress, PriceDisplay, ActivityFeed, AdminPage, ParticipantsList, AuthModal.
**Layout**: RTL layout for deal details with product info on the right and image gallery on the left.

### Pricing System

**Position-Based Pricing**: Prices decrease with more participants; variance of ±2.5% within tiers based on join position. All participants pay the lowest final price.
**Tier Configuration**: Flexible tiers per deal with min/max participants and discount rules.

### Authentication System

**Implementation**: Custom email/password authentication with bcrypt hashing, session management, and email verification.
**Auth Endpoints**: Register, login, logout, get current user, email verification, password reset.
**Security**: bcrypt hashing (12 salt rounds), 8-character minimum password, token expirations.

### Payment System

**Implementation**: Stripe integration for card validation and payment processing.
**Payment Flow**: Users save cards via Stripe Elements (Setup Intent). Card validation occurs before joining a deal. Payments are processed only upon successful deal closure; otherwise, no charge.

## External Dependencies

### Core Dependencies

**Frontend**: React, Wouter, TanStack Query, React Hook Form, Zod, date-fns.
**UI Components**: Radix UI, Embla Carousel, Lucide React, class-variance-authority, tailwind-merge, clsx.
**Styling**: Tailwind CSS, PostCSS, Google Fonts.
**Backend**: Express.js, Drizzle ORM, @neondatabase/serverless, Zod, bcrypt, Stripe.

### Build Tools & Development

Vite, esbuild, TypeScript, tsx.

### Replit-Specific Plugins

@replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner.

### Database

Neon Database (PostgreSQL serverless) via `DATABASE_URL` environment variable and Drizzle Kit.

### Email Service

Gmail API via Google OAuth2 for verification, password resets, and deal notifications.