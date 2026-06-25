# MotoTrust API

NestJS backend for MotoTrust.

## Responsibilities

- Validate Firebase ID tokens.
- Own service booking and service order workflows.
- Enforce fixed pricing and genuine parts rules.
- Persist domain data through Prisma.
- Issue signed media URLs for CCTV/video proof.
- Publish background jobs for notifications and proof processing.

## Module Layout

- `auth`: Firebase auth verification and role guards.
- `users`: Internal user records mapped to Firebase users.
- `customers`: Customer profiles and preferences.
- `motorcycles`: Customer motorcycle registry.
- `bookings`: Pickup/drop slot booking lifecycle.
- `service-orders`: Work orders, task tracking, proof workflow.
- `pricing`: Fixed service packages and price rules.
- `parts`: Genuine parts catalog and usage records.
- `media-proofs`: CCTV/video proof metadata and signed access.
- `service-history`: Immutable service history timeline.
- `notifications`: SMS, email, WhatsApp, and push notification boundary.
- `health`: Health and readiness checks.

