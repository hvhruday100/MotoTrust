# Folder Structure

```text
mototrust/
  apps/
    api/
    web/
    worker/
  packages/
    config/
    contracts/
    database/
    logger/
    ui/
  infra/
    docker/
    firebase/
    deployments/
  docs/
  scripts/
```

## `apps/api`

NestJS backend. This is the core system. It owns all write operations and business rules.

## `apps/web`

Next.js frontend. Starts with customer booking and account history, then grows into operations/admin screens.

## `apps/worker`

Background worker app. It is separated early so heavy tasks do not slow down customer-facing APIs.

## `packages/database`

Prisma schema, migrations, and database client. Any database model change should start here.

## `packages/contracts`

Shared API contracts and Zod validation schemas. This prevents API and web from drifting apart.

## `packages/config`

Shared environment variable parsing. Apps should fail fast if required secrets are missing.

## `packages/logger`

Shared logger facade. Start simple, swap to structured logging later.

## `packages/ui`

Reusable React components and UI utilities.

## `infra`

Local infrastructure and deployment notes.

## `docs`

Architecture decisions, product scope, runbooks, and onboarding notes.

## `scripts`

Developer scripts for setup, seeding, and maintenance.

