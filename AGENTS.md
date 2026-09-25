# BuildTrack — agent notes

- Run: `docker compose -f docker-compose.base44.yml up -d`. Services: `db` (Postgres 16), `setup` (one-shot: `npm install`, `prisma generate`, `prisma db push`), `web` (`next dev` on port 3000).
- No lockfile and no migrations folder: the schema is applied with `prisma db push`. After editing `prisma/schema.prisma`, run `docker compose -f docker-compose.base44.yml run --rm setup` and then restart `web`.
- `package.json` references `prisma/seed.ts` (`db:seed`), but that file doesn't exist. The DB starts empty, so create an account through `/register`.
- `node_modules` lives in a named volume (not the host), so run npm through the containers.
- Optional env var `BUILDTRACK_ADMIN_USERNAMES` (comma-separated usernames) gates `/api/admin/featured`. It's not set by default.
- `next.config.ts` adds the Base44 preview origin to `allowedDevOrigins` only when `BASE44_PUBLIC_HOST_SUFFIX` is set.
- Health check: `curl localhost:3000/api/health`.
