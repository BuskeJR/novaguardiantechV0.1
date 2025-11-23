# NovaGuardianTech - Enterprise DNS Blocking SaaS

## 🎯 Project Overview

**NovaGuardianTech** is a multi-tenant DNS blocking SaaS platform that enables businesses to protect their entire network infrastructure by blocking malicious domains, ads, and unwanted content. Built with modern web technologies and designed for enterprise-scale deployments.

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- TanStack Query v5 (data fetching & caching)
- Wouter (routing)
- Tailwind CSS + shadcn/ui (styling)
- Replit Auth (authentication)

**Backend:**
- Node.js + Express + TypeScript
- Drizzle ORM + PostgreSQL (database)
- Replit Auth (OIDC authentication)
- Express Sessions (session management)

**Infrastructure:**
- PostgreSQL (Neon serverless)
- UDP DNS Server (dns2 library)
- Port 53 for DNS queries (production-ready)

### System Flow

```
User → Login (Replit Auth) → Dashboard → Manage Domains/Whitelist
                                ↓
                          Backend API (Express)
                                ↓
                          PostgreSQL Database
                                ↓
                          DNS Config Updates
```

## 📊 Data Model

### Core Entities

**users** - System users (authenticated via Replit Auth)
- Fields: id, email, firstName, lastName, profileImageUrl, role, timestamps
- Roles: `admin` (full access) | `user` (tenant access only)

**tenants** - Client organizations (multi-tenant isolation)
- Fields: id, name, slug, ownerId, isActive, publicIp, subscriptionStatus, timestamps
- Relations: belongs to user (owner), has many domains/whitelist/audit logs

**domain_rules** - Blocked domains per tenant
- Fields: id, tenantId, domain, kind (exact/regex), status (active/inactive), reason, timestamps
- Relations: belongs to tenant, created by user

**ip_whitelist** - Authorized IP addresses per tenant
- Fields: id, tenantId, ipAddress, label, timestamps
- Relations: belongs to tenant, created by user

**audit_logs** - Complete audit trail
- Fields: id, actorUserId, tenantId, action, resourceType, resourceId, payloadJson, timestamp
- Relations: belongs to user (actor) and tenant

**sessions** - Replit Auth session storage
- Fields: sid, sess, expire

## 🎨 Design System

Based on `design_guidelines.md`:

**Typography:**
- Primary: Inter (UI, body, dashboards)
- Display: Space Grotesk (landing page headlines)

**Color Palette:**
- Primary: Blue (#217 91% 60% in dark mode)
- Neutral grays for backgrounds/borders
- Semantic colors: destructive (red), success (green)

**Components:**
- All shadcn/ui components configured
- Custom sidebar navigation
- Hover/active elevations via CSS utilities
- Dark mode support with theme toggle

**Spacing:** Consistent use of Tailwind units (4, 6, 8, 12, 16, 24)

## 🚀 Key Features

### Implemented ✅

1. **Authentication & Authorization**
   - Replit Auth (Google, GitHub, Email)
   - Role-Based Access Control (admin/user)
   - Protected routes and API endpoints

2. **User Dashboard**
   - Overview statistics (active blocks, total domains, whitelist count)
   - Tenant status and configuration
   - Quick access to main features

3. **Domain Management**
   - Add/remove blocked domains
   - Toggle active/inactive status
   - Support for exact match and regex patterns
   - Reason tracking for each block

4. **IP Whitelisting**
   - Manage authorized IP addresses
   - Label IPs for easy identification
   - Per-tenant whitelist isolation

5. **Admin Panel**
   - Manage all client tenants
   - Configure public IP addresses
   - View global system metrics
   - Complete audit log access

6. **Audit Logging**
   - Track all administrative actions
   - Resource type and action classification
   - Timestamp and actor tracking
   - JSON payload for detailed context

7. **Beautiful UI/UX**
   - Responsive design (mobile, tablet, desktop)
   - Dark mode support
   - Loading skeletons
   - Error handling with toasts
   - Empty states with helpful CTAs

8. **Email System (Password Reset)**
   - SendGrid integration for transactional emails
   - Password reset via 6-digit code sent to email
   - Secure token expiration (15 minutes)
   - Professional HTML email templates
   - Currently using: scnovatec@gmail.com (can upgrade to custom domain)

9. **DNS Blocking System (NEW!) 🎯**
   - UDP DNS server on port 53 (production-ready)
   - Real-time domain blocking (responds with 127.0.0.1)
   - In-memory cache with 5-minute refresh from database
   - Automatic wildcard subdomain blocking
   - Supports active/inactive domain toggle
   - Fallback to public DNS (8.8.8.8) for non-blocked domains
   - Complete setup guide in web interface

### Pending Implementation

- **Cloudflare DNS integration** (Optional - for zone management)
- **MercadoPago payment integration** (Final phase - PIX + Cartão)
- **Real-time statistics dashboard**
- **Domain-based email authentication** (when user has custom domain)

## 📁 Project Structure

```
/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/             # Utilities and configs
│   │   │   ├── queryClient.ts
│   │   │   ├── authUtils.ts
│   │   │   └── utils.ts
│   │   ├── pages/           # Page components
│   │   │   ├── landing.tsx        # Public landing page
│   │   │   ├── home.tsx           # User dashboard
│   │   │   ├── domains.tsx        # Domain management
│   │   │   ├── whitelist.tsx      # IP whitelist
│   │   │   ├── dns-setup.tsx      # DNS configuration guide
│   │   │   ├── admin-clients.tsx  # Admin: manage clients
│   │   │   ├── admin-audit.tsx    # Admin: audit logs
│   │   │   └── not-found.tsx      # 404 page
│   │   ├── App.tsx          # Main app with routing
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles + Tailwind
│   └── index.html           # HTML template
│
├── server/                   # Backend Express application
│   ├── app.ts               # Express app configuration
│   ├── index-dev.ts         # Development server
│   ├── index-prod.ts        # Production server
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Data access layer
│   ├── dns.ts               # UDP DNS server implementation
│   ├── email.ts             # SendGrid email integration
│   ├── auth-utils.ts        # Password hashing & validation
│   ├── cloudflare.ts        # Cloudflare API integration
│   └── replitAuth.ts        # Replit Auth setup
│
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Drizzle ORM models + Zod schemas
│
├── design_guidelines.md     # UI/UX design system
├── package.json             # Dependencies
├── tailwind.config.ts       # Tailwind configuration
├── drizzle.config.ts        # Database configuration
└── replit.md               # This file
```

## 🔐 Security

- **Authentication:** Replit OIDC (OpenID Connect)
- **Session Management:** Express sessions with PostgreSQL store
- **Authorization:** Role-based access control (RBAC)
- **Data Isolation:** Tenant-scoped queries
- **Input Validation:** Zod schemas on frontend and backend
- **SQL Injection Protection:** Drizzle ORM parameterized queries

## 🚧 Development Status

### Phase 1: Schema & Frontend ✅ COMPLETED

All React components and pages built with:
- Pixel-perfect design following guidelines
- Responsive layouts (mobile-first)
- Dark mode support
- Loading and error states
- Accessibility (data-testid attributes)
- Type-safe with TypeScript + Zod
- Database migrations with Drizzle ORM
- Password reset via email flow

### Phase 2: Backend, Email & DNS ✅ COMPLETE

Completed:
- ✅ User authentication (signup/login with password)
- ✅ Password reset flow with email verification
- ✅ SendGrid integration for transactional emails
- ✅ Admin user management
- ✅ Database foreign key constraints (SET NULL for soft deletions)
- ✅ Audit logging system
- ✅ All REST API endpoints
- ✅ **UDP DNS server on port 53** - Production-ready DNS blocking
- ✅ **DNS Setup guide page** - Complete configuration instructions
- ✅ **Real-time domain blocking** - 127.0.0.1 responses

### Phase 3: Payment & Advanced Features (NEXT)

- **MercadoPago** - Subscription payment processing (PIX + Cartão)
- **Cloudflare Integration** (Optional) - For zone management
- **Email Domain Upgrade** - Change from scnovatec@gmail.com to custom domain
- **Real-time statistics dashboard**
- End-to-end testing
- Production deployment documentation

## 🧪 Testing

**Data Test IDs:** All interactive elements have `data-testid` attributes for automated testing.

Examples:
- `button-login` - Login button
- `input-domain` - Domain input field
- `row-domain-{id}` - Domain table row
- `text-page-title` - Page title

## 📝 Environment Variables

### Secrets (Replit Secrets)

```
DATABASE_URL          - PostgreSQL connection string (auto-created by Replit)
SESSION_SECRET        - Express session secret key
SENDGRID_API_KEY      - SendGrid API key for email sending
```

### Shared Environment Variables

```
SENDGRID_FROM_EMAIL   - Email address for sending reset codes (currently: scnovatec@gmail.com)
                        Can be upgraded to custom domain email when available
```

### Development

```env
NODE_ENV=development
```

## 🎯 Next Steps

1. **Complete Backend Implementation**
   - Set up Replit Auth with session management
   - Implement all API endpoints
   - Create database migrations
   - Add sample seed data

2. **Integrate Frontend with Backend**
   - Connect TanStack Query to real APIs
   - Test all user flows
   - Add error handling

3. **DNS System**
   - Implement DNS config file generation
   - Add webhook/queue system for updates
   - Document deployment for production

4. **Stripe Integration**
   - Add subscription management
   - Webhook handlers for payment events
   - Trial period logic

5. **Production Deployment**
   - Deploy to Replit (or DigitalOcean)
   - Configure environment variables
   - Set up monitoring and logging
   - Create deployment documentation

## 📖 Resources

- [Replit Auth Docs](https://docs.replit.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [TanStack Query Docs](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)

## 📧 Email Configuration Notes

**Current Setup:**
- Provider: SendGrid
- From Email: scnovatec@gmail.com (verified sender)
- API Key: Stored in Replit Secrets as `SENDGRID_API_KEY`
- Feature: Password reset emails with 6-digit codes

**Future Upgrade:**
- When user purchases custom domain, change `SENDGRID_FROM_EMAIL` from `scnovatec@gmail.com` to `noreply@yourdomain.com`
- Requires SendGrid domain verification (add DKIM/SPF records)
- No code changes needed - just update environment variable

## 🌐 DNS System Architecture

The DNS blocking system runs in parallel with Express API on port 53:

```
Client Network ──┐
                 │ (port 53)
                 └→ UDP DNS Server
                    ├─ Query: tiktok.com?
                    ├─ Check: Is blocked? YES
                    └─ Response: 127.0.0.1 (blocked)
                    
                 Query: google.com?
                 Check: Is blocked? NO
                 └─ Fallback: Forward to 8.8.8.8
```

**Key Features:**
- Uses `dns2` library for UDP socket handling
- In-memory cache of blocked domains (refreshed every 5 minutes)
- Reads from `domain_rules` table via storage interface
- Supports exact match and wildcard blocking
- Graceful fallback for non-blocked domains
- Automatic port 53 binding (requires sudo/admin on production)

---

**Last Updated:** 2025-11-23 22:47
**Status:** Phase 1 Complete ✅ | Phase 2 Complete ✅ | Phase 3 Next (MercadoPago Payment)

**Latest Changes:**
- ✅ DNS server implemented with UDP port 53 (2025-11-23)
- ✅ Real-time domain blocking working (127.0.0.1 responses)
- ✅ DNS setup guide page added to interface
- ✅ In-memory cache with database sync every 5 minutes
- ✅ Sidebar navigation updated with DNS setup link
- ✅ SendGrid email integration implemented
- ✅ Password reset email flow working end-to-end
- ✅ Foreign key constraints fixed (no CASCADE issues)
