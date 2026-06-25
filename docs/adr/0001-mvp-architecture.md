# ADR 0001: MVP Architecture

## Status

Accepted

## Context

MotoTrust needs to prove the customer trust workflow quickly: transparent pricing, pickup/drop, genuine parts, service proof, and digital history.

The existing infrastructure is GitHub, VS Code, Codex, Neon PostgreSQL, Firebase, Upstash Redis, and Cloudflare with R2 deferred.

## Decision

Use a TypeScript monorepo with:

- NestJS for backend API.
- Next.js for web.
- Prisma with Neon PostgreSQL.
- Firebase for authentication and MVP media storage.
- Upstash Redis for cache, rate limits, and async coordination.
- Worker app for background jobs.

## Consequences

- The MVP remains simple enough for fast development.
- The system can scale to 10,000 customers without an early microservices split.
- Business logic remains centralized in the API.
- Flutter can be added later without changing backend structure.

