# HOOMA Architecture

## Goal

HOOMA is a Telegram-first football community application. The architecture is deliberately modular so that Events, payments, ride matching, fundraising, chat, and future integrations do not acquire hidden cross-domain database dependencies.

## Dependency rule

The only supported request path is:

```text
React UI
-> feature/page code
-> central HTTP client
-> /api/v1 controllers
-> application services
-> domain policy + repository ports
-> infrastructure adapters
-> Prisma
-> PostgreSQL
```

Forbidden dependencies:

- React -> Prisma/database package
- controller -> Prisma or raw SQL
- application service -> Prisma
- Event/Ride/Fundraiser -> provider SDK
- provider webhook -> direct Event/Ride/Fundraiser SQL
- duplicated frontend fetch clients
- client-provided Telegram user identity as authorization

## Monorepo ownership

### `apps/api`

- `bootstrap/`: creates exactly one database client, repositories, adapters and application services.
- `http/`: generic middleware and `/api/v1` composition.
- `modules/<domain>/application`: services and repository interfaces.
- `modules/<domain>/domain`: pure policies/algorithms where useful.
- `modules/<domain>/infrastructure`: Prisma or external-provider implementations.
- `modules/<domain>/http`: controllers only.

### `apps/miniapp`

- `pages/`: user-facing vertical slices.
- `providers/`: cross-cutting React state such as active community and theme.
- `shared/api/http-client.ts`: the only raw `fetch()` owner.
- `lib/telegram.ts`: Telegram Mini App surface integration.
- `components/`: reusable presentation only.

### `packages/contracts`

Shared Zod request schemas and wire types, published inside the workspace as `@hooma/contracts`. Prisma-generated types must never be imported by the Mini App.

### `packages/database`

Prisma schema/client/seeding/migrations, published inside the workspace as `@hooma/database`. No frontend package imports this workspace.

## Domain ownership

### Identity

Owns Telegram authentication mapping, profile and user preference. It does not own community roles.

### Communities

Owns community membership, invites, owner/admin roles, active community authorization and community-level cash defaults. Raw invite secrets are returned once and only a SHA-256 hash is stored.

Ownership transfer is explicit. A current owner transfers to another active member and becomes an admin. Owner role cannot be silently demoted or banned.

### Events

Owns generic Event lifecycle, schedule, location, capacity, RSVP/waitlist and check-in attachment points. Play and Watch subtype data live in separate tables.

RSVP capacity mutations lock the Event row. Waitlist sequence is monotonic and visible position is derived; the queue is never renumbered.

Cancelling an Event cancels unpaid/pending RSVP payment intents in the same application transaction. Paid cash is never silently deleted; it must be explicitly voided/refunded so the audit trail remains intact.

### Play

Owns football-specific match settings, team balancing and formations. It does not own generic Event lifecycle.

### Watch

Owns club references, Places, Fan Hubs, venue deals and distance-gated check-ins. A Place is the physical business profile for cafes, lounges, and venues: photo, contact details, about text, address, houma, coordinates, menu preview, and owner-claim metadata. A Fan Hub is the Watch participation layer that may point at a Place and can be associated with clubs and Watch events.

Watch events persist their authoritative venue via `WatchEventDetails.fanHubId`, and a community-specific Fan Hub cannot be attached to a different community's Watch Event. Event detail/list projections should use the linked Place for venue profile fields instead of duplicating venue photo/contact/menu data on Event rows. Watch-owned Place UI routes live under `/watch/places`; compatibility routes may point at the same page but must not become a second Place system.

### Requests

Owns short-lived player/position/equipment/help Requests and claims. Claim replacement is concurrency-safe: the Request row is locked and the current user's prior claim is excluded from the aggregate before the new quantity is validated.

### Ride

Owns distinct RideOffer, RideRequest and RideMatch models. Seat allocation locks the RideOffer. Ride lifecycle is explicit (`OPEN/FULL -> IN_PROGRESS -> COMPLETED`, or cancellation). Ratings are available only after completion.

### Fundraising

Owns Fundraisers and contributions. Collected totals are derived from `PAID` contributions. A mutable `amountCollected` field is not authoritative. When paid totals reach the goal, status becomes `FUNDED`; eligible refunds can reopen it.

### Payments

Owns PaymentIntent state, cash settlement history, Telegram Stars receipts, provider webhook dedupe, digital products and entitlements. Current rails are only Cash and Telegram Stars.

Business domains store a reference to their PaymentIntent; PaymentIntent does not contain a set of polymorphic nullable target foreign keys.

### Chat

Owns temporary event rooms and messages. MVP delivery is polling-based; WebSocket/SSE is intentionally not required for correctness.

### Admin/Audit

Admin remains an internal technical permission concept. User-facing management UI uses Coach / Coach Control Room. Admin reads use normal authorization policy. Sensitive writes still call owning domain services. `AuditLog` is append-only from application perspective.

## Unit of work / transactions

`PrismaUnitOfWork` exposes one transaction handle to application services. When an operation crosses domain repositories, coordination happens in the application service and every repository uses the same transaction handle.

Examples:

```text
Cash confirmation
-> PaymentService
-> lock PaymentIntent
-> CashSettlement
-> target domain mark-paid
-> AuditLog + OutboxEvent
-> commit
```

```text
Event RSVP cancellation
-> lock Event
-> cancel RSVP/payment hold
-> promote first waitlisted user
-> create promoted cash intent when required
-> commit
```

## Pagination

Unbounded collection endpoints use opaque base64url cursors backed by deterministic tuple ordering. Current shared cursor shape is `(timestamp, id)`. The helper lives in `apps/api/src/infrastructure/database/cursor.ts`.

## Rate limiting

A `RateLimitStore` abstraction exists. Current implementation is in-memory and therefore production is limited to a single API replica until a shared Redis/Valkey store is added. Business correctness never depends on the rate-limit store.

## Asynchronous work

`OutboxEvent` is written in the same database transaction as important state changes. A future worker may publish notifications from the outbox after commit. External notification delivery must never be required for the original database transaction to be correct.
