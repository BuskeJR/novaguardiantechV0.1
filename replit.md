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
- Port 5000 for API
- Stateless, scalable architecture

### System Flow

```
Cliente com IP Público
    ↓
Cadastra IP na plataforma ("Seu IP Público")
    ↓
IP automaticamente vai pra whitelist
    ↓
Cliente adiciona domínios bloqueados
    ↓
Backend API (Express)
    ↓
PostgreSQL Database
    ↓
Verificação: IP na whitelist? → Domínio bloqueado?
    ↓
Resposta: /api/block-check retorna true/false
```

## 📊 Data Model

### Core Entities

**users** - System users (authenticated via Replit Auth)
- Fields: id, email, firstName, lastName, profileImageUrl, role, timestamps
- Roles: `admin` (full access) | `user` (tenant access only)

**tenants** - Client organizations (multi-tenant isolation)
- Fields: id, name, slug, ownerId, isActive, publicIp, subscriptionStatus, timestamps
- Relations: belongs to user (owner), has many domains/whitelist/audit logs
- **New Feature**: publicIp campo que automaticamente adiciona o IP à whitelist

**domain_rules** - Blocked domains per tenant
- Fields: id, tenantId, domain, kind (exact/regex), status (active/inactive), reason, timestamps
- Relations: belongs to tenant, created by user

**ip_whitelist** - Authorized IP addresses per tenant
- Fields: id, tenantId, ipAddress, label, timestamps
- Relations: belongs to tenant, created by user
- **Auto-populated**: Quando cliente coloca publicIp, é adicionado automaticamente com label "IP Público - Automático"

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

4. **IP Whitelisting & Auto-Configuration** (NEW! 🎯)
   - Client adds IP Public → automatically added to whitelist
   - Label: "IP Público - Automático"
   - Removing publicIp also removes from whitelist
   - Manual IP addition still available

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

9. **Block Check API** (NEW! 🎯)
   - GET /api/block-check?domain=example.com&ip=1.2.3.4
   - Returns: { blocked: true/false, message: string }
   - Validates IP is in whitelist
   - Checks if domain is blocked for that tenant
   - Can be used by external DNS forwarders or clients

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
│   │   │   ├── whitelist.tsx      # Network configuration (IP + auto-whitelist)
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

### Phase 2: Backend & Email ✅ COMPLETE

Completed:
- ✅ User authentication (signup/login with password)
- ✅ Password reset flow with email verification
- ✅ SendGrid integration for transactional emails
- ✅ Admin user management
- ✅ Database foreign key constraints (SET NULL for soft deletions)
- ✅ Audit logging system
- ✅ All REST API endpoints
- ✅ **Auto-whitelist on publicIp** - Client adds IP → automatically in whitelist
- ✅ **Block Check API** - Verify if domain blocked for IP
- ✅ Multi-tenant isolation complete

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
- `button-save-public-ip` - Save IP button
- `input-public-ip` - IP input field
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

1. **Test Block Check API**
   - Try: GET /api/block-check?domain=example.com&ip=203.0.113.42
   - Verify it returns correct blocked status

2. **Implement Client Integration**
   - Create SDK/script that clients use
   - Script calls /api/block-check for each DNS query
   - Blocks locally if API says blocked

3. **Advanced Features**
   - Stripe Integration for payments
   - Real-time statistics dashboard
   - Cloudflare advanced zone features

4. **Production Deployment**
   - Deploy to Replit or DigitalOcean
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

## 🌐 Block Check API Usage

The /api/block-check endpoint can be used by external systems to verify if a domain should be blocked:

### Request
```
GET /api/block-check?domain=tiktok.com&ip=203.0.113.42
```

### Response (Blocked)
```json
{
  "success": true,
  "domain": "tiktok.com",
  "ip": "203.0.113.42",
  "blocked": true,
  "message": "Domínio tiktok.com está bloqueado para este IP"
}
```

### Response (Not Blocked)
```json
{
  "success": true,
  "domain": "google.com",
  "ip": "203.0.113.42",
  "blocked": false,
  "message": "Domínio google.com não está bloqueado"
}
```

**How It Works:**
1. Client queries: Is domain X blocked for IP Y?
2. API checks: Is IP Y in any tenant's whitelist?
3. If yes: Is domain X in that tenant's blocked domains?
4. Returns true/false

---

**Last Updated:** 2025-11-24 00:05
**Status:** Phase 2 Complete ✅ | Phase 3 Next (MercadoPago Payment)

**Latest Changes:**
- ✅ Auto-whitelist on publicIp configuration (2025-11-24)
- ✅ Block Check API endpoint added (GET /api/block-check)
- ✅ Simplified UI: one click to configure IP
- ✅ Whitelist automatically updated when IP added/removed
- ✅ Multi-tenant isolation fully working
- ✅ Ready for external client integration
