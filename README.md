<p align="center">
  <img src="apps/miniapp/public/brand/gool-wordmark.png" alt="GOOL" width="180" />
</p>

# GOOL

GOOL is a Telegram Mini App for football communities: pickup matches, watch events, Fan Hubs, requests, rides, fundraising, team formation, temporary event chat, community administration, and cash-first real-world payments.

## Current payment scope

GOOL v1 intentionally supports only:

- **Cash** for real-world obligations such as match fees, ride shares, and fundraiser contributions.
- **Telegram Stars** for digital goods and services sold inside Telegram.

There is no card, Stripe, Flouci, TON, Solana, or generic crypto runtime in the current source tree. Future payment rails must be added behind the payment application boundary rather than directly inside Event, Ride, or FundMe code.

## Architecture

```text
Telegram Mini App / React
  -> feature pages and hooks
  -> shared/api/http-client.ts
  -> /api/v1/*
  -> HTTP controllers
  -> application services
  -> repository interfaces / domain policies
  -> Prisma repository implementations
  -> Prisma
  -> PostgreSQL
```

The API is an Express + TypeScript service. The Mini App is React + Vite + Tailwind. Shared request contracts live in `@gool/contracts`. PostgreSQL ownership lives in `@gool/database`.

See [Architecture](docs/ARCHITECTURE.md), [Engineering Decisions](docs/DECISIONS.md), [Database](docs/DATABASE.md), [Payments](docs/PAYMENTS.md), [Security](docs/SECURITY.md), and [Quality Gates](docs/QUALITY_GATES.md).

## Repository layout

```text
GOOL/
├── apps/
│   ├── api/                 # HTTP, services, domain ports, Prisma adapters
│   └── miniapp/             # Telegram Mini App React UI
├── packages/
│   ├── contracts/           # Zod wire contracts shared by API and UI
│   └── database/            # Prisma schema, client, seed, migrations
├── tests/                   # pure/domain tests; DB integration suite grows here
├── docs/                    # architecture and operations documentation
├── scripts/                 # release, architecture and bundle gates
├── .github/workflows/ci.yml
├── railway.api.json
└── railway.miniapp.json
```

Generated output (`node_modules`, `dist`, `*.tsbuildinfo`, coverage) is not source and must not be committed.

## Implemented vertical slices

- Telegram initData authentication and user upsert
- profile and theme preference
- community create/join/invite/switch/member/admin/ownership flows
- Events backbone with Play and Watch extensions
- RSVP capacity, cash policy, FIFO waitlist sequence, promotion, cancellation
- cash PaymentIntent, authorized receipt confirmation, void/refund audit history
- Telegram Stars digital product, invoice, pre-checkout, server webhook settlement, entitlement and refund
- player/equipment/help Requests with concurrency-safe claims
- Ride offers, Ride requests, seat matching, paid cash shares, ride lifecycle, live-location TTL, ratings
- FundMe with derived paid totals, cash contributions, idempotency and funded-state calculation
- Watch/Fan Hubs, club filtering, distance-gated check-in and venue deals
- team balancing and drag/drop 5v5, 7v7 and 11v11 formation builder
- temporary Event chat with cursor pagination and polling UI
- admin dashboard, payment reconciliation and audit feed
- Telegram-aware light/dark theme system
- route-level Mini App code splitting with a build-enforced initial JavaScript budget

The detailed implementation matrix is in [IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## Local prerequisites

- Node.js 24 (`.nvmrc` is the project baseline; package engines remain compatible with Node 22-24)
- npm 10+
- PostgreSQL 16+
- a Telegram bot token for real Mini App auth/Stars testing

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Create local configuration:

```bash
cp .env.example .env
cp apps/miniapp/.env.example apps/miniapp/.env
```

Install the committed dependency graph and generate Prisma Client:

```bash
npm ci
npm run architecture:check
npm run db:generate
```

`npm run db:validate` requires both `DATABASE_URL` and `DIRECT_DATABASE_URL`.

## Initial migration gate

The repository contains the Prisma-generated `20260816141614_init` migration. It was generated from the checked-in datamodel, reviewed as forward-only SQL, applied to a clean Railway PostgreSQL database over private networking, and verified with `prisma migrate status`.

Validate the committed migration chain with:

```bash
npm run db:validate
npm run db:migrate:deploy
npm run db:migration:check
```

For later production deployments use only `npm run db:migrate:deploy`. Never use `prisma db push` in production and never edit a migration after it has shipped.

## Development

```bash
npm run dev
```

Default local URLs:

- Mini App: `http://localhost:5173`
- API: `http://localhost:3000`
- Health: `http://localhost:3000/health`

Local browser development can use the explicit dev auth bypass from the example env files. The API refuses to start in production if `DEV_AUTH_BYPASS=true`.

## Quality and release gates

The normal source gate is:

```bash
npm run architecture:check
npm run lint
npm run typecheck
npm run test
npm run format:check
npm run build
```

The production Mini App build fails if initial JavaScript exceeds 500 kB raw or any lazy feature chunk exceeds 1 MB raw. Security is also a release gate:

```bash
npm run security:check
```

The first-push/deployment gate additionally requires the real migration and environment-backed Prisma validation:

```bash
npm run db:validate
npm run db:migration:check
npm run deploy:preflight
```

`npm run release:check` is the authoritative clean-install release sequence and is cross-platform.

## Current first-push status

- `package-lock.json`: present and generated by npm.
- application source gate: passes on the canonical Windows development tree.
- initial Prisma migration: committed and applied to Railway PostgreSQL; migration status is up to date and repeated deploy is idempotent.
- dependency security audit: zero vulnerabilities; do not use `npm audit fix --force`.

Rerun `npm run release:check` and `npm run deploy:preflight` with the real deployment environment after every release change.

## Deployment

GOOL is designed as two Railway services sharing one PostgreSQL database:

1. `@gool/api` using `railway.api.json`
2. `@gool/miniapp` using `railway.miniapp.json`

The API start command deploys committed migrations before starting the server. Telegram secrets live only in Railway/local environment variables, never in GitHub.

See [RAILWAY.md](docs/RAILWAY.md) and [GITHUB.md](docs/GITHUB.md).

## License / ownership

Private application source. Add an explicit license only if/when the project owner chooses one.
