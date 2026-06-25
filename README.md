# MotoTrust

MotoTrust is a motorcycle servicing platform MVP focused on transparent pricing, pickup and drop, genuine parts, service proof, and digital service history.

## MVP Architecture

The simplest production-ready architecture is a modular monorepo:

- `apps/api`: NestJS API. Owns business rules, Firebase auth validation, Prisma access, Redis cache, and service workflows.
- `apps/web`: Next.js web app. Starts with customer booking and admin/service-center operations.
- `apps/worker`: Background workers for notifications, proof processing, and scheduled tasks. This can stay small until traffic requires it.
- `packages/database`: Prisma schema, migrations, seed data, and Prisma Client boundary.
- `packages/contracts`: Shared DTOs, validation schemas, and API contracts.
- `packages/config`: Shared environment validation.
- `packages/ui`: Shared React components for the web app.
- `packages/logger`: Shared logging helpers.
- `infra`: Local and deployment infrastructure notes.
- `docs`: Product, architecture, and operating documentation.

This keeps the MVP simple while leaving clean scale paths for 10,000 customers: horizontal API scaling, a separate worker process, Postgres as the source of truth, Redis for cache and async coordination, and object storage for service proof media.

## Core Flow

1. Customer signs in.
2. Customer adds motorcycle details.
3. Customer selects fixed-price service package.
4. Pickup slot is booked.
5. Service order is created and tracked.
6. Mechanic/admin uploads CCTV or activity proof.
7. Parts used are recorded with genuine-part metadata.
8. Customer receives invoice, media proof, and digital service history.

The first implemented vertical slice is documented in `docs/customer-booking-flow.md`.
Service lifecycle tracking is documented in `docs/service-lifecycle-tracking.md`.

## Getting Started

Use Node.js 20 and pnpm.

```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm install
pnpm dev
```

Copy `.env.example` to `.env` and fill in Neon, Firebase, and Upstash values.
