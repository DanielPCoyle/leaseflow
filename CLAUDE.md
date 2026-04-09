# LeaseFlow - Apartment Leasing SaaS Platform

## Overview
Multi-tenant apartment leasing platform targeting property management companies with multiple properties. Smart scheduling accounts for agent travel time between properties. Full lifecycle: prospect inquiry through lease signing and resident management.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5 (JWT strategy, credentials provider)
- **Payments**: Stripe (subscription billing + rent collection)
- **Email**: Resend
- **Styling**: Tailwind CSS 4
- **Icons**: Material Icons (not emojis)

## Key Commands
- `npm run dev` - Start dev server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to DB (no migration)
- `npm run db:seed` - Seed with Alterra Property Group data
- `npm run db:studio` - Open Prisma Studio

## Architecture
- Multi-tenant: Company > Region > Property > Unit hierarchy
- Agents belong to a company and can be assigned to multiple properties
- Travel time between properties is estimated using haversine distance + transport mode
- Prospect-facing booking pages can be per-property (branded) or portfolio-wide
- Role hierarchy: SUPER_ADMIN > COMPANY_ADMIN > REGIONAL_MANAGER > PROPERTY_MANAGER > AGENT

## Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/lib/` - Shared utilities (prisma, auth, travel calculations)
- `src/components/` - React components (ui/, admin/, booking/, layout/)
- `src/types/` - TypeScript type declarations
- `prisma/` - Schema and migrations

## Seed Data
Based on real Alterra Property Group / APG Living portfolio:
- 7 Philadelphia properties across 7 regions
- 20 sample units with realistic pricing
- 5 agents with multi-property assignments and transport modes
- 3 sample prospects at different pipeline stages
- Login: any seeded email / password: leaseflow2026

## Conventions
- Use Material Icons, never emojis in UI
- All API routes under `/api/admin/` require authentication
- Public booking routes under `/api/public/` and `/book/`
- Prisma models use `@@map()` for snake_case table names
