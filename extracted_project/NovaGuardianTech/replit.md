# NovaGuardianTech - SaaS de Bloqueio DNS Multi-Cliente

## Overview
NovaGuardianTech is a comprehensive SaaS platform for enterprise DNS blocking with multi-client support. It allows administrators to manage domain blocking rules per client with intelligent routing based on source IP. The platform provides a complete DNS blocking system, including a React frontend with an administrative panel, a robust FastAPI API with JWT authentication and RBAC, and a DNS infrastructure utilizing `dnsdist` and individual Pi-hole instances per client. This system enables multi-client management, IP whitelisting, and comprehensive action auditing, aiming to deliver a scalable and efficient solution for granular network control and advanced domain filtering.

## User Preferences
- Idioma: Português do Brasil
- Público-alvo: Dev júnior (explicações detalhadas)
- Formato: Arquivos completos, nunca diffs
- Testes: Sempre com critérios de aceite documentados
- Documentação: Ultra-detalhada com exemplos práticos

## System Architecture

### Core Stack
**Frontend** (`apps/web/`): React 18 with Vite 5, TanStack Query v5, Tailwind CSS 3 + shadcn/ui, React Router DOM v6, Axios.
**Backend** (`apps/api/`): Python 3.11+ with FastAPI, SQLAlchemy 2.0 + Alembic, PostgreSQL 16, python-jose for JWT, passlib + bcrypt, Pydantic 2.6, Uvicorn.
**Infrastructure** (`infra/`): dnsdist 1.8, Pi-hole (1 container per client), Docker Compose 3.8.

### Production Tooling (Nov 2024)
- **Makefile**: 20+ comandos utilitários (dev, build, test, seed, backup, health, logs, shell access)
- **Backup System**: Script automatizado (`tools/backup_postgres.sh`) com suporte S3/Spaces, compressão gzip, retenção de 7 dias
- **Health Monitoring**: Endpoint `/health` com status de database e Docker, integrado ao Makefile
- **Docker Compose**: Serviços completos (postgres, api, web, dnsdist, pihole-demo) com healthchecks, depends_on conditions, restart policies
- **Deployment Guide**: DEPLOY.md com checklist completo para produção (80+ passos documentados)

### UI/UX Decisions
The platform features a modern, responsive layout with a sidebar, utilizing Tailwind CSS and shadcn/ui for a consistent design. It includes protected routes for authentication management.

### Technical Implementations and Features
- **Authentication**: JWT with Bearer tokens (with future transition to HttpOnly cookies).
- **Authorization**: Role-Based Access Control (RBAC) with ADMIN and USER roles.
- **DNS Blocking**: Uses NXDOMAIN standard for blocked domains.
- **Multi-client Management**: Individual Pi-hole instances and granular domain/IP rule management per client.
- **Database**: PostgreSQL with SQLAlchemy for data management and Alembic for migrations.
- **API Endpoints**: Structured modules for authentication, domain management, IP whitelisting, DNS operations, and administrative tasks.
- **Pi-hole Synchronization**: Incremental and idempotent synchronization of domain rules to Pi-hole's `gravity.db`.
- **Project Structure**: Monorepo approach (`apps/web`, `apps/api`) for streamlined development.
- **HMR in Replit**: Configured with WebSocket Secure (wss) and clientPort 443.
- **Vite Proxy**: Used for `/api` communication to avoid CORS issues.
- **PiholeManager Service**: Handles Docker lifecycle management for Pi-hole instances, including auto IP allocation, port mapping, dynamic dnsdist config generation, and volume management.
- **Admin Panel**: Features 9 functional pages including Dashboard, Clients, Domains, Whitelist, My IP, Pi-hole Instances, Users, Audit Logs, and Settings, all integrated with TanStack Query v5.
- **IP Capture Tool**: Dedicated page to detect and display user's public IP address with support for proxy headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP), copy to clipboard functionality, and networking diagnostics display.
- **Graceful Degradation**: Sistema continua operacional mesmo sem Docker (retorna 503 com mensagens claras).
- **Dependency Protection**: DELETE operations com proteção contra remoção de registros com dependências (HTTP 409).
- **Audit Trail**: Registro completo de todas as ações administrativas com timestamps e user tracking.

### System Design Choices
- **Monorepo**: Chosen for streamlined development and deployment.
- **Microservices-adjacent**: Frontend and Backend are distinct applications with a shared DNS infrastructure pattern.
- **Scalability**: Designed to provision individual Pi-hole instances per client for isolation and specific configurations.
- **Observability (Planned)**: Future integration with Prometheus and Grafana.

## External Dependencies
- **PostgreSQL 16**: Primary database, supports Neon for managed instances.
- **dnsdist**: For intelligent DNS traffic routing.
- **Pi-hole**: For DNS-level ad blocking and domain filtering.
- **Docker Compose**: For orchestrating `dnsdist`, Pi-hole, and local PostgreSQL containers.
- **Docker SDK for Python**: Manages Pi-hole container lifecycle.
- **TanStack Query**: For frontend data fetching, caching, and state management.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Component library for UI elements.
- **Axios**: HTTP client for frontend.
- **python-jose**: For JWT handling.
- **passlib + bcrypt**: For secure password hashing.
- **Pydantic**: For data validation and serialization.
- **Uvicorn**: ASGI server for FastAPI.