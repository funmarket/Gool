# HOOMA Database

PostgreSQL is the system of record. Prisma schema: `packages/database/prisma/schema.prisma`.

The application/database workspace package is `@hooma/database`. Physical PostgreSQL database names and persistent volume names are operational identities and are not changed merely for application branding; any physical rename requires an explicit data-preserving migration and rollback plan.

## Identifier strategy

- application primary keys: Prisma `cuid()` stored as PostgreSQL text
- Telegram user IDs: string (`VarChar(32)`), avoiding JavaScript number precision issues
- money: integer minor units (`BigInt`) for real-world obligations; Stars use integer `XTR`
- coordinates: fixed decimal latitude/longitude where persisted
- `houma`: canonical neighborhood/local-area domain field; it is not a legacy brand identifier and must remain `houma`

## Core models

### Identity

`User`, `PlayerProfile`, `UserPreference`

### Football reference

`FootballClub`

### Communities

`Community`, `Membership`, `CommunityInvite`

Membership lifecycle uses status rather than soft deletion. Community invites store `codeHash` and a non-secret prefix; raw invite codes are never stored.

### Events

`Event`, `PlayEventDetails`, `WatchEventDetails`, `EventRsvp`

Common Event fields stay on `Event`. Play/Watch-specific data stay in subtype tables. Event RSVP has a monotonic `waitlistSequence`; UI queue position is derived.

### Requests

`Request`, `RequestClaim`

Claim totals derive from active claims rather than an authoritative mutable claimed counter.

### Rides

`RideOffer`, `RideRequest`, `RideMatch`, `RideLocationPing`, `RideRating`

Live location rows have an `expiresAt` field and are privacy-sensitive transient data.

### FundMe

`Fundraiser`, `FundContribution`

Fundraiser collected amount is calculated as the sum of `PAID` contributions. Contribution idempotency is scoped by fundraiser + contributor + idempotency key.

### Payments

`PaymentIntent`, `PaymentAttempt`, `CashSettlement`, `TelegramStarPayment`, `ProviderWebhookEvent`, `CommunityPaymentDefault`, `EventPaymentMethod`, `RideOfferPaymentMethod`, `FundraiserPaymentMethod`, `DigitalProduct`, `DigitalEntitlement`

Cash and Telegram Stars are deliberately different proofs of settlement but converge at the Payment application service.

Historical provider checkout IDs and financial records are persistence data. Do not rewrite them solely to replace a legacy brand prefix.

### Play formations

`Formation`, `FormationSlot`

### Watch/Fan Hub

`Place`, `PlaceOwnerClaim`, `PlaceMenuItem`, `FanHub`, `FanHubClub`, `WatchEventDetails.fanHubId`, `VenueDeal`, `CheckIn`

`Place` is the physical business/venue profile: name, category, photo, contact details, address, city, houma, coordinates, owner-claim status, and menu preview items. A `FanHub` can link to a `Place` when that physical location hosts watch events. Watch events attach to `FanHub` through `WatchEventDetails.fanHubId`, while venue profile details are projected through the linked Place.

### Chat

`EventChatRoom`, `EventChatMessage`

### Operations

`AuditLog`, `OutboxEvent`, `IdempotencyRecord`

## Lifecycle and deletion

Soft-delete long-lived content where historical reference matters: Community/Event/Request/Ride/Fundraiser/FanHub/VenueDeal/ChatMessage/Formation and user-facing long-lived objects where the schema exposes `deletedAt`.

Status lifecycle is used for memberships, RSVPs, claims, Ride matches, contributions and payments. Financial receipts, webhook history and audit records must not be physically deleted through application APIs.

Ride location pings are transient and should be hard-deleted after `expiresAt` by an operations job.

## Locking invariants

- RSVP/capacity: lock `Event`
- Request quantity claims: lock `Request`
- Ride seats/status: lock `RideOffer`
- membership ownership transfer/owner-sensitive changes: lock `Community`
- cash/Stars settlement: lock `PaymentIntent`
- webhook event: unique provider event ID plus transactional processing

Serializable transactions are used for concurrency-sensitive operations where practical.

## Money range

Wire contracts restrict minor-unit amounts to the JavaScript safe-integer range while PostgreSQL stores them as `BigInt`. This avoids an `Int` overflow and keeps current UI conversion exact.

## Migration policy

The committed migration chain is authoritative. Applied migrations are immutable, including during a product rebrand. Do not edit historical migration SQL or migration metadata to replace legacy names.

For new schema changes:

```bash
npm run db:migrate -- --name <migration-name>
npm run db:migration:check
```

Production uses `npm run db:migrate:deploy` only. Never use `prisma db push` as a production migration substitute.
