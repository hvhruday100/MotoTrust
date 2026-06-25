# Deployments

Initial deployment recommendation:

- Web: Vercel or Cloudflare Pages.
- API: Render, Fly.io, Railway, or a small container platform.
- Worker: Same provider as API, separate process.
- Database: Neon PostgreSQL.
- Redis: Upstash Redis.
- Media: Firebase Storage first, Cloudflare R2 later.

Keep API and worker as separate deployments even if they share code.

