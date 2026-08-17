# GOOL Engineering Decisions

This file records decisions that should not be silently reversed while the first production baseline is being established.

## Product name

The public product name is **HOOMA** for the first-release user experience.

The technical baseline remains hybrid until after the first stable release:

- user-facing app copy, browser title, brand assets, bot-facing copy, and generated product labels use **HOOMA**.
- package scopes, source paths, API namespaces, database names, deployment files, and import specifiers remain `gool` / `@gool/*`.

A full internal rename is intentionally deferred because it touches package workspaces, lockfile metadata, deployment config, database names, and service identifiers. Do not perform a full internal rename as part of ordinary UI work.

## Payment V1

The only supported payment methods are:

- `CASH` for real-world football/community obligations.
- `TELEGRAM_STARS` for eligible digital goods/services inside Telegram.

Credit cards and third-party/crypto rails are intentionally absent. A future payment rail must be introduced behind the Payments application boundary with its own verification/reconciliation design; it must not add provider SDKs or settlement logic to Events, Rides, Fundraising or React pages.

Cash acceptance is explicit on each applicable Event/Ride/Fundraiser and can inherit a community default at creation time. The saved resource policy is authoritative after creation.

## Payment and business state are separate

An RSVP, RideMatch or FundContribution is not considered paid merely because its business status is active. `PaymentIntent` owns payment lifecycle and the business entity keeps a reference to that intent. Cash confirmation creates an auditable `CashSettlement`; Telegram Stars settlement is authoritative only from verified server-side Telegram updates.

## Database identifiers and money

- application IDs: `cuid()` text
- Telegram user IDs: strings
- real-world money: integer minor units stored as PostgreSQL `BigInt`
- wire money: decimal integer strings when serialized from `BigInt`
- no floating-point money in persistence or settlement logic

## Database migration baseline

No synthetic or hand-written baseline migration is accepted just to make the repository look deployable. The initial migration must be generated from the checked-in Prisma schema against a fresh PostgreSQL database, reviewed, validated, and committed before deployment.

After a migration ships, it is immutable; follow-up changes use new migrations.

## Runtime boundaries

The supported dependency path is:

```text
Mini App -> central HTTP client -> controllers -> application services
-> repository ports -> infrastructure adapters -> Prisma -> PostgreSQL
```

React never imports the database package. Controllers do not query Prisma. Application services do not import Prisma. Cross-domain operations are coordinated by application services through repository ports and one transaction handle.

## Deployment topology

HOOMA deploys as two Railway services plus PostgreSQL:

1. API
2. Mini App static frontend
3. shared Railway PostgreSQL

The API may not also serve the production Mini App bundle. The current in-memory rate limiter means API replica count stays at one until a shared Redis/Valkey implementation is added.

## Quality gate

No deployment is considered ready until the clean-install release sequence passes: dependency install from the committed lockfile, architecture enforcement, Prisma validation/generation/migration, lint, typecheck, tests, formatting, production build, migration status, bundle budget and dependency security audit.

Mini App feature routes are lazy-loaded so feature code is not forced into initial bootstrap. The production build enforces a 500 kB raw initial-JavaScript budget and a separate 1 MB raw lazy-feature budget. Large visualization/map dependencies are intentionally absent from the first-release Mini App unless a source-level feature requires them.

The repository intentionally fails closed when the lockfile or real initial migration is missing, and high-severity dependency audit findings block the first production baseline.
