# Design Guidelines - Nova GuardianTech DNS Blocking SaaS

## Design Approach

**Reference-Based Strategy**: Draw inspiration from modern SaaS security platforms that balance trust, professionalism, and ease of use:
- **Cloudflare**: Authority in DNS/security space - clean dashboards, technical credibility
- **Linear**: Modern SaaS aesthetics - sharp typography, efficient layouts
- **Stripe**: Trust and professionalism - clear information hierarchy
- **Vercel**: Developer-friendly - modern, approachable design

**Core Design Principles**:
1. **Trust & Security First**: Professional, confident visual language that communicates reliability
2. **Clarity Over Decoration**: Information-dense dashboards prioritize readability
3. **Progressive Disclosure**: Landing page is bold/visual, dashboards are functional/efficient
4. **Consistent Hierarchy**: Clear visual distinction between marketing and application experiences

---

## Typography System

**Font Families** (Google Fonts):
- **Primary**: Inter (UI, body text, dashboards)
- **Display**: Cal Sans or Space Grotesk (landing page headlines only)

**Scale & Hierarchy**:
- Hero headline: `text-5xl md:text-6xl lg:text-7xl font-bold`
- Section headers: `text-3xl md:text-4xl font-bold`
- Dashboard titles: `text-2xl font-semibold`
- Card headers: `text-lg font-semibold`
- Body: `text-base` (16px)
- Captions/metadata: `text-sm text-gray-600`

**Line Heights**: `leading-tight` for headlines, `leading-relaxed` for body text

---

## Layout System

**Spacing Primitives**: Use Tailwind units `2, 4, 8, 12, 16, 24` consistently
- Component padding: `p-4` to `p-8`
- Section spacing: `py-16 md:py-24`
- Card gaps: `gap-6` to `gap-8`
- Form field spacing: `space-y-4`

**Grid System**:
- Landing sections: `max-w-7xl mx-auto px-6`
- Dashboards: full-width containers with internal `max-w-6xl`
- Feature grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`

**Responsive Breakpoints**: Mobile-first, stack to single column on mobile, expand to multi-column on `md:` and `lg:`

---

## Component Library

### Navigation
- **Landing Header**: Full-width transparent/blur on scroll, logo left, nav center, CTA button right
- **Dashboard Sidebar**: Fixed left sidebar (desktop), collapsible hamburger (mobile), logo top, nav items with icons, user menu bottom

### Buttons
- Primary CTA: Solid background, medium shadow, rounded corners `rounded-lg`
- Secondary: Outline variant
- Icon buttons: Ghost style for dashboard actions
- All buttons: Implement blur background when over images

### Cards
- Dashboard cards: `border rounded-xl p-6`, subtle shadow `shadow-sm`
- Stat cards: Grid layout, large numbers `text-4xl font-bold`, labels `text-sm`
- Domain list items: Hover state, toggle switches, delete icons aligned right

### Forms
- Input fields: `border rounded-lg px-4 py-3`, focus ring
- Labels: `text-sm font-medium mb-2`
- Validation: Inline error messages below fields
- Submit buttons: Full-width on mobile, auto-width on desktop

### Data Display
- Tables: Alternating row backgrounds, fixed header on scroll
- Empty states: Centered icons + helpful text + CTA
- Loading states: Skeleton screens matching content structure

### Modals & Overlays
- Backdrop: Semi-transparent dark overlay
- Modal: Centered, `max-w-lg`, rounded corners, close button top-right

---

## Page-Specific Guidelines

### Landing Page
**Structure** (5-6 sections):
1. **Hero**: Full viewport height, large headline + subheadline, primary CTA, hero image/graphic showing DNS blocking concept
2. **How It Works**: 3-step process with icons, `grid-cols-1 md:grid-cols-3`
3. **Features**: 2-column grid showcasing key capabilities (multi-tenant, instant blocking, statistics)
4. **Pricing**: Centered pricing card, clear value proposition, "Start Free Trial" CTA
5. **Social Proof**: Client logos or testimonial cards if available
6. **Footer**: Newsletter signup left, navigation center, social links right

**Visual Treatment**: Bold, confident, use gradients sparingly for accents, generous whitespace

### Authentication Pages
- Centered card layout `max-w-md mx-auto`
- Clear headlines "Welcome back" / "Create your account"
- Social login buttons (Google, GitHub via Replit Auth)
- Divider with "or continue with email"
- Form fields stacked vertically
- Links to alternate action ("Don't have an account? Sign up")

### Client Dashboard
**Layout**: Sidebar navigation + main content area

**Main Content**:
- Page header: Title + action button (e.g., "Add Domain")
- Stats overview: 4 stat cards in grid showing total domains, active blocks, last updated
- Domain management: Searchable table/list, toggle switches for enable/disable, delete icons
- Activity feed: Recent changes, timestamped

### Admin Panel
- Enhanced sidebar with admin-specific sections
- Client management table: Search, filter, status indicators
- Container configuration: Form for IP public input, tenant assignment
- Global metrics: Charts showing system-wide usage, top blocked domains
- Action buttons for bulk operations

---

## Images

**Hero Section**: Large hero image showing abstract network/DNS visualization or dashboard preview mockup (right side of hero in 2-column layout)

**Feature Sections**: Icons for each feature (use Heroicons), optional supporting graphics for complex concepts

**Dashboard**: No decorative images - focus on data visualization through charts/graphs using a charting library

---

## Visual Consistency Rules

- Maintain consistent border radius: `rounded-lg` for cards/buttons, `rounded-xl` for larger containers
- Shadow hierarchy: `shadow-sm` for cards, `shadow-md` for elevated elements, `shadow-lg` for modals
- Transitions: `transition-all duration-200` for interactive elements
- Icons: Use Heroicons exclusively, 20px/24px sizes, consistent stroke width
- Spacing rhythm: Never use random spacing values - stick to the defined primitives