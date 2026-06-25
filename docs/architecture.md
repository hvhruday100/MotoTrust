# MotoTrust MVP Architecture

## Recommendation

Use a modular monorepo with one NestJS API, one Next.js web app, and shared packages. Keep Firebase for identity and early media storage, Neon PostgreSQL for transactional data, and Upstash Redis for cache, rate limiting, and background coordination.

## Why This Is Enough For 10,000 Customers

- 10,000 customers is not a distributed-systems problem if the domain is modeled cleanly.
- PostgreSQL can easily handle the MVP transactional load with proper indexes and connection pooling.
- NestJS can scale horizontally behind a load balancer.
- A separate worker can absorb notification and media-proof processing.
- Redis can handle short-lived cache, rate limits, locks, and async retry state.
- Media files stay outside Postgres.

## Runtime Components

### Web App

Next.js serves:

- Customer booking flow.
- Customer account and digital history.
- Operations dashboard for service centers.

### API

NestJS owns all business rules:

- Authentication and authorization.
- Fixed-price package selection.
- Pickup/drop booking lifecycle.
- Service order tracking.
- Genuine parts recording.
- Proof media metadata.
- Digital service history.

### Database

Neon PostgreSQL stores:

- Users and customer profiles.
- Motorcycles.
- Bookings and service orders.
- Parts catalog and parts usage.
- Service proof metadata.
- Digital service history events.

### Redis

Upstash Redis supports:

- Rate limiting.
- Short-lived cache.
- Notification retry state.
- Idempotency keys for booking and payment actions.

### Firebase

Firebase supports:

- Customer and staff authentication.
- Optional MVP media storage until Cloudflare R2 is introduced.

## Scale Path

1. MVP: API, web, Neon, Firebase, Upstash.
2. Add worker deployment when notifications and media proof processing increase.
3. Add Cloudflare R2 for cheaper media storage.
4. Add read replicas and queue-based workflows only when measured load requires it.
5. Add Flutter mobile app under `apps/mobile` when the web flow is stable.

