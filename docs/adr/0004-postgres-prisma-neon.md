---
status: accepted
date: 2026-10-30
---

# PostgreSQL through Prisma; Docker locally, Neon when hosted

> **In plain words:** The data lives in PostgreSQL, used through Prisma. A Docker copy runs on a developer's PC, and Neon hosts the online copy in Singapore. This database can lock a Pickup Window while an Order is placed, which stops two people booking the last space.

The data lives in PostgreSQL, accessed through Prisma (same major version for `prisma` and `@prisma/client`). Locally a Docker container `hoshikopi-db` on port 5434 holds the `hoshikopi`, `hoshikopi_test` and `hoshikopi_e2e` databases. When the demo is hosted (Phase 5), Neon in Singapore (`aws-ap-southeast-1`) holds production and preview databases, as for Hoshimono.

## Why

- Ordering needs transactions and row locks (Pickup Window Capacity, Star balance), which PostgreSQL does well.
- Prisma gives typed queries and migrations; raw SQL is allowed where Prisma cannot express a lock or a constraint.
- Neon is plain PostgreSQL with a free tier and branches per preview.

## Considered options

- **SQLite.** Rejected: no `SELECT ... FOR UPDATE`, and it differs from the hosted database.
- **Supabase.** Rejected: its extras (auth, storage, realtime) duplicate Better Auth and Vercel Blob.

## Consequences

- Two connection strings per hosted environment: pooled `DATABASE_URL` and direct `DIRECT_URL` for migrations.
- Tests refuse any database whose name does not end in `_test` or `_e2e`.
- No Neon-specific SQL, so moving hosts changes connection strings only.
