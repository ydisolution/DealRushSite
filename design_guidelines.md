# Design Guidelines for DealRush Platform

## Design Approach

**Reference-Based Approach** inspired by high-converting deal and e-commerce platforms:
- **Wolt/DoorDash**: Dynamic card layouts with real-time updates
- **Booking.com**: Urgency indicators and social proof patterns
- **Amazon**: Product detail pages and trust signals
- **Groupon**: Deal presentation and countdown emphasis

**Core Principle**: Create urgency and FOMO through bold visual hierarchy while maintaining trust through clear information architecture.

## RTL Hebrew Considerations

- All layouts flow right-to-left
- Typography: Use **Rubik** or **Heebo** (Google Fonts) for clean Hebrew readability
- Numbers and prices remain LTR within RTL context
- Progress bars fill from right to left

## Typography System

**Font Stack**: 
- Primary: Rubik (400, 500, 700)
- Fallback: Heebo

**Hierarchy**:
- Hero headlines: text-5xl font-bold (48px)
- Section headers: text-3xl font-bold (30px)
- Product names: text-2xl font-semibold (24px)
- Prices (current): text-4xl font-bold (36px)
- Body text: text-base (16px)
- Timer digits: text-6xl font-black (60px) for maximum urgency

## Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16** for consistency
- Card padding: p-6
- Section spacing: py-16 desktop, py-12 mobile
- Component gaps: gap-6 for cards, gap-4 for smaller elements
- Container max-width: max-w-7xl

**Grid System**:
- Deal cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Product detail: 2-column split (60/40) on desktop
- Dashboard: sidebar + main content layout

## Component Library

### Deal Cards (Critical Component)
**Structure** (every card includes):
- Product image (aspect-ratio-square, object-cover)
- Live participant badge (absolute top-right): "👥 67 קונים"
- Product name (2 lines max, truncate)
- **Countdown timer** (MOST PROMINENT):
  - Large digit boxes with background
  - Format: [HH]:[MM]:[SS] with labels
  - High contrast, impossible to miss
- Price display:
  - Strikethrough original (text-lg opacity-60)
  - Current price (text-4xl font-bold, primary accent)
  - Discount badge (rounded-full, green background)
- **Progress bar** (full-width at card bottom):
  - Visual fill showing tier completion
  - Text: "67/100 משתתפים"
- Next tier teaser: "עוד 33 קונים ל-₪3,510"
- CTA button (w-full, prominent)

### Progress Bars
- Height: h-3 for compact, h-4 for emphasized
- Rounded: rounded-full
- Fill from right to left (RTL)
- Gradient fills for visual interest
- Always show numeric progress above bar

### Countdown Timers
- Large segmented displays with individual boxes per unit
- Background contrast for readability
- Red accent when under 24 hours
- Update every second with smooth transitions

### Activity Feed
- Compact list with avatars (circular, w-8 h-8)
- Relative timestamps ("לפני 2 דקות")
- Icon indicators for different actions
- Subtle animations for new entries

### Trust Badges
- Icon + text horizontal layout
- Grouped in rows of 2-4
- Small size (text-sm), high scanability
- Icons from Heroicons

### Call-to-Action Buttons
- Primary: Large, bold, full-width on mobile
- Size variations: py-4 px-8 (hero), py-3 px-6 (standard)
- High contrast with background
- Clear action text

## Page-Specific Layouts

### Homepage
- Hero section: 60vh with statistics grid (3 columns)
- "Deals Grid" section: 16-24px spacing between cards
- "How It Works": 3-column icon-text layout (stacks on mobile)
- Trust indicators footer: centered, 4-column grid

### Single Deal Page
- Split layout: 50/50 image gallery + deal details (desktop)
- Sticky "Join Now" section on mobile
- Tab navigation for product details
- Real-time activity feed sidebar (300px width)

### Dashboard
- Fixed sidebar (280px) with navigation
- Main content area with tabbed sections
- Deal status cards in list view
- Statistics cards: 3-column grid at top

### Checkout
- Single column, stepped progress indicator at top
- Wide form fields (max-w-2xl)
- Order summary sticky sidebar on desktop
- Large confirmation screen with next steps

## Visual Treatment

**Emphasis Hierarchy**:
1. Countdown timers (largest, most dramatic)
2. Current price (bold accent color)
3. Progress bars (visual movement)
4. Participant count (social proof)
5. Product image (supporting visual)

**Urgency Indicators**:
- Red accents for timers under 24h
- Pulsing animations on "almost full" progress bars
- "Limited time" badges with clock icons
- Real-time counters with live updates

**Social Proof Elements**:
- Avatar stacks (max 5 visible, "+23 more")
- Large participant counts with icons
- Recent activity timestamps
- Star ratings and review counts

## Images

**Hero Section**: Full-width background image (1920x600px) showing happy shoppers or product collage with gradient overlay for text readability

**Deal Cards**: Square product photos (600x600px minimum), clean white backgrounds, professional photography

**Product Gallery**: 4-6 high-quality images per product, zoomable on click

**Trust Sections**: Icon-based, no images needed except for customer avatars (generated/placeholder 40x40px circular)

**Dashboard**: Product thumbnails only (100x100px), no decorative images

Note: Buttons over hero images use backdrop-blur-sm with semi-transparent backgrounds for legibility.