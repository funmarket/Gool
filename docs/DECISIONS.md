# HOOMA Engineering Decisions

This file records decisions that should not be silently reversed while the production baseline is being established and evolved.

## Product and technical identity

The current and only active product name is **HOOMA**.

The active technical namespace is also HOOMA:

- root workspace name: `hooma`
- API workspace: `@hooma/api`
- Mini App workspace: `@hooma/miniapp`
- shared contracts: `@hooma/contracts`
- database package: `@hooma/database`
- active import specifiers and deployment workspace commands use `@hooma/*`
- runtime service/log identity uses HOOMA / `hooma-api`

Tracked source, configuration, documentation, development fixtures, browser-storage keys, package/workspace identifiers, service names, URLs, database names used by this repository, and repository paths must use HOOMA-only product identity. Historical Git commit metadata is not rewritten, but no retired product identifier may remain in the current tracked tree.

The canonical neighborhood/local-area field is `houma`. It is domain terminology and is distinct from the HOOMA product identity; do not rename it to `hooma`.

A naming cleanup must not be used as an excuse to redesign product behavior, rewrite already-applied migration semantics, reset databases, or rename external persistent infrastructure without a migration plan.

## Payment V1

The only supported payment methods are:

- `CASH` for real-world football/community obligations.
- `TELEGRAM_STARS` for eligible digital goods/services inside Telegram.

Credit cards and third-party/crypto rails are intentionally absent. A future payment rail must be introduced behind the Payments application boundary with its own verification/reconciliation design; it must not add provider SDKs or settlement logic to Events, Rides, Fundraising or React pages.

Cash acceptance is explicit on each applicable Event/Ride/Fundraiser and can inherit a community default at creation time. The saved resource policy is authoritative after creation.

## Payment and business state are separate

An RSVP, RideMatch or FundContribution is not considered paid merely because its business status is active. `PaymentIntent` owns payment lifecycle and the business entity keeps a reference to that intent. Cash confirmation creates an auditable `CashSettlement`; Telegram Stars settlement is authoritative only from verified server-side Telegram updates.

New Telegram Stars checkout payloads use the `hooma:stars:<paymentIntentId>` form. Settlement resolves the exact stored provider checkout ID rather than relying on a mutable display-brand prefix. Existing external payment records, if any, must be handled through explicit compatibility logic outside the active tracked product namespace rather than by retaining retired product labels in current source.

## Database identifiers and money

- application IDs: `cuid()` text
- Telegram user IDs: strings
- real-world money: integer minor units stored as PostgreSQL `BigInt`
- wire money: decimal integer strings when serialized from `BigInt`
- no floating-point money in persistence or settlement logic

Physical PostgreSQL database names, connection targets, and persistent volume names are operational identities. New HOOMA infrastructure must use HOOMA naming. Any rename of an already-running external resource requires an explicit data-preserving migration and rollback plan.

## Database migration baseline

The committed Prisma migrations are immutable once applied. Do not rewrite migration semantics merely for naming. Follow-up schema changes use new migrations.

Production uses `prisma migrate deploy`; never replace the migration chain with `prisma db push`.

## Runtime boundaries

The supported dependency path is:

```text
Mini App -> feature API adapter -> central HTTP client -> controllers -> application services
-> repository ports -> infrastructure adapters -> Prisma -> PostgreSQL
```

React never imports the database package. Pages do not own business-domain endpoints when a feature adapter exists. Controllers do not query Prisma. Application services do not import Prisma. Cross-domain operations are coordinated by application services through repository ports and one transaction handle.

## User-facing management terminology

`ADMIN` may remain an internal role/permission value where required by contracts and persistence. User-facing management surfaces use **Coach** / **Coach Control Room** rather than presenting Admin as the product role.

## Deployment topology

HOOMA deploys as two Railway services plus PostgreSQL:

1. API
2. Mini App static frontend
3. shared Railway PostgreSQL

The API may not also serve the production Mini App bundle. The current in-memory rate limiter means API replica count stays at one until a shared Redis/Valkey implementation is added.

## Quality gate

No deployment is considered ready until the clean-install release sequence passes: dependency install from the committed lockfile, architecture enforcement, Prisma validation/generation/migration, lint, typecheck, tests, formatting, production build, migration status, bundle budget and dependency security audit.

Mini App feature routes are lazy-loaded so feature code is not forced into initial bootstrap. The production build enforces a 500 kB raw initial-JavaScript budget and a separate 1 MB raw lazy-feature budget. Large visualization/map dependencies are intentionally absent from the first-release Mini App unless a source-level feature requires them.

The repository intentionally fails closed when the lockfile or required migration/environment state is inconsistent, and high-severity dependency audit findings block the production baseline.
