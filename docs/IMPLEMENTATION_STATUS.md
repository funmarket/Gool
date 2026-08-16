# GOOL Implementation Status

## Status legend

- **Implemented**: real backend/domain code exists and the corresponding UI path exists where applicable.
- **Foundation**: architecture/schema is present but a later production capability is still planned.
- **Deployment gate**: external tooling step is required before production.

## Identity / Telegram — Implemented

- signed Telegram initData validation
- trusted user upsert
- profile/preferences
- dev bypass that fails production
- centralized Mini App auth header

## Communities — Implemented

- create public/private community
- public join and hashed invite join
- invite create/list/revoke
- community switcher
- members
- owner/admin/member authorization
- owner-only admin-role changes with audit
- explicit ownership transfer
- member ban with owner/admin hierarchy
- cash payment default

## Events / RSVP — Implemented

- Play and Watch event creation
- common Event update
- admin cancellation
- explicit `POST /api/v1/events/:eventId/cancel` route
- capacity/waitlist
- monotonic waitlist sequence with derived position
- Cash RSVP policies
- transactional cancellation + promotion
- pending payments cancelled on Event cancellation
- paid cash retained for explicit refund/void accounting

Type-specific fee/format/club editing after Event creation is intentionally not exposed yet; common Event metadata is editable.

## Play — Implemented

- team balancing
- 5v5 / 7v7 / 11v11 formation slots
- drag/drop builder
- publishable formations

## Watch — Implemented

- clubs
- Fan Hubs
- membership-aware hub browsing
- 250m check-in distance gate
- community/Fan Hub/Event consistency validation
- time-bounded venue deal visibility/unlocking

## Requests — Implemented

- soccer-specific request types
- expiry
- claims/unclaims
- row-lock quantity protection
- repeat-claim replacement without double-counting

## Ride — Implemented

- separate offers and requests
- seat requests/matching
- driver accept/decline
- Cash share intent after acceptance for paid rides
- Offer lifecycle start/complete/cancel
- live location authorization + expiry
- post-completion ratings

## FundMe — Implemented core

- create/list
- event attachment consistency
- Cash contributions
- idempotency
- paid totals derived from contributions
- goal automatically transitions to `FUNDED`
- eligible refund can reopen below-goal fundraiser
- deadlines block new contributions

Explicit organizer close/cancel UI is a later lifecycle enhancement; contributions are already blocked by non-OPEN status/deadline.

## Payments — Implemented V1

### Cash

- first-class accepted method
- PaymentIntent
- authorized cash confirmation
- payer self-confirm blocked
- CashSettlement history
- void/refund
- target-domain settlement
- admin reconciliation

### Telegram Stars

- digital products only
- server-owned price
- native Telegram invoice link
- pre-checkout verification
- `successful_payment` authoritative settlement
- webhook dedupe
- DigitalEntitlement
- admin refund

No card/Stripe/Flouci/crypto code exists in runtime source.

## Chat — Implemented MVP

- temporary Event room
- cursor message history
- post/delete authorization
- Mini App polling every few seconds

Push delivery is a future performance/UX enhancement, not a correctness dependency.

## Admin — Implemented

- managed community list
- dashboard aggregates
- payment reconciliation
- audit feed
- cash confirmation
- Stars digital product configuration/refund
- invites
- member ban
- Event cancellation

## Frontend — Functional application structure

Pages/routes exist for Home, Play, Watch, Community, Requests, Ride, FundMe, Events, formation, chat, check-in, members, admin, profile and settings. The design system and theme are established. Some production polish such as full empty/loading/error treatment on every page, accessibility pass and visual QA across Telegram clients remains pre-beta work.

## Foundation / scaling work

- `OutboxEvent` exists; publisher/worker is not yet deployed.
- `RateLimitStore` exists; current implementation is memory-only. `RATE_LIMIT_STORE=memory` is required explicitly in production and the API must stay at one replica until a Redis/Valkey adapter exists.
- geo-cell columns/indexes exist; large-scale proximity query optimization can be extended before city-scale data becomes large.
- location retention requires a scheduled hard-delete job.

## First-release foundation verification

The canonical source tree includes an npm-generated `package-lock.json` and the Prisma-generated `20260816141614_init` migration. The migration was reviewed as forward-only SQL, applied to clean Railway PostgreSQL over private networking, and verified as up to date. Repeated migration deploy reported no pending migrations.

The first-release foundation gates are:

1. zero vulnerabilities from `npm run security:check` after deliberate dependency updates;
2. a committed Prisma-generated initial migration applied to PostgreSQL;
3. a clean `npm run release:check`;
4. `npm run deploy:preflight` with zero blockers.

The initial migration is immutable after deployment. Future schema changes require new migrations, and the dependency lockfile must only be changed by npm.

## Source verification policy

Static source checks are useful but do not replace the dependency-backed release gate. The authoritative acceptance standard is the clean-install sequence documented in `docs/QUALITY_GATES.md`.
