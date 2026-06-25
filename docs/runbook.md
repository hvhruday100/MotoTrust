# Runbook

## Local Setup

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm dev
```

## Database Migration

```bash
pnpm db:migrate
```

## Production Deployment Checklist

- Set `DATABASE_URL` to Neon pooled connection string.
- Set Firebase Admin SDK env values.
- Set Upstash Redis REST URL and token.
- Configure CORS to the production web domain.
- Run Prisma migrations before starting the API.
- Confirm `/api/health` returns `status: ok`.

