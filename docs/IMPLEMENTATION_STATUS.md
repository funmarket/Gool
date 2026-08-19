# HOOMA Implementation Status

_Last updated: 2026-08-18_

This document describes the current HOOMA source tree and should be treated as a current implementation/status reference, not as a product roadmap.

The runtime/source baseline was audited at commit `1259221` (`feat: update HOOMA to current local source of truth`). This documentation-only update does not change application runtime behavior.

## Product identity

- **Current application name:** HOOMA
- **Legacy application name:** GOOL
- GOOL must not be used as current user-facing branding.
- The canonical neighborhood/local-area field remains **houma**. This field is a domain term and is distinct from the HOOMA product name.
- The controlled technical namespace migration from `gool` / `@gool/*` to `hooma` / `@hooma/*` is complete for active package, workspace, import, build, configuration, runtime, and CSS identifiers. Intentional legacy identifiers remain only for compatibility, persistence, immutable history, or external resources.
- Historical Git commits and already-applied Prisma migrations should not be rewritten merely to remove legacy naming.

## Status legend

- **Implemented**: real backend/domain code exists and the corresponding UI path exists where applicable.
- **Implemented with integration issue**: the main domain exists, but a verified frontend/backend or data-association issue remains.
- **Partial**: meaningful implementation exists, but the feature is not production-complete.
- **Scaffold**: UI/foundation exists without the complete production backend/data path.
- **Planned**: product behavior has been defined but is not yet implemented in the current source.
- **Deployment / quality gate**: build, CI, external configuration, or infrastructure work is required before treating the source as release-clean.

## Identity / Telegram — Implemented core

- signed Telegram `initData` validation
- trusted Telegram user upsert
- profile/preferences
- development auth bypass that is disabled in production
- centralized Mini App auth header
- Telegram webhook support for payments

### Still needed

- a centralized HOOMA profile-completion/action guard is not yet implemented across all protected participation actions
- browse-first vs profile-required action policy should be made explicit and consistent across domains

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

### Naming note

The technical authorization role may remain `ADMIN` internally where useful, but current user-facing management terminology should use **Coach** / **Coach Control Room**.

## Events / RSVP — Implemented core

- Play and Watch event creation
- common Event update
- cancellation route and cancellation flow
- capacity/waitlist
- monotonic waitlist sequence with derived position
- Cash RSVP policies
- transactional cancellation + promotion
- pending payments cancelled on Event cancellation
- paid cash retained for explicit refund/void accounting

Type-specific fee/format/club editing after Event creation is intentionally not exposed yet; common Event metadata is editable.

## Home / Match Day — Implemented UI with known gaps

Current Home includes:

- HOOMA header/branding
- Match Day hero
- Events presentation
- Quick Actions
- HOOMA NOW placeholder

### Known gaps / regressions

- `HOOMA NOW` is still a placeholder and is not yet wired to the planned football-data feed.
- `ULTRAS` is not yet implemented in the current source.
- Home `Events -> See all` now routes to the combined Events landing page so both Play and Watch events can be browsed from one place.
- Quick Action status text for Requests/Ride/FundMe has returned in source even though the approved UI direction removed those counters/status labels.

## Play — Implemented core / Player Listings scaffold

Implemented:

- pickup-match flow
- team balancing
- 5v5 / 7v7 / 11v11 formation slots
- drag/drop builder
- publishable formations
- event detail / RSVP integration

Player Listings:

- Player Listings visual components exist
- Play contains a Players section
- the production Player Listings backend/data path is not yet implemented
- current Players content should therefore be treated as a scaffold, not a completed feature

## Watch / Places / Fan Hubs — Implemented core

Implemented backend/domain capabilities include:

- clubs
- Places as physical business/venue profiles with owner-claim metadata
- Place menu items, required photo URL, required public contact method, about/address/Houma fields
- Fan Hubs
- linked Place -> Fan Hub creation from the Mini App `Add a Place` flow
- authoritative fan-hub association on Watch events
- membership-aware hub browsing
- Place-backed Watch cards and Event Detail venue/profile/menu projection
- canonical Watch Places routes: `/watch/places`, `/watch/places/new`, `/watch/places/:placeId`
- dedicated Place Detail page with real upcoming Watch events queried by Place
- Watch feed collector tickets rendered through the supplied reusable empty-ticket shell
- 250m check-in distance gate
- community/Fan Hub/Event consistency validation
- time-bounded venue-deal visibility/unlocking

### Remaining Watch gaps

- Venue owner claims are recorded as pending, but there is not yet a Coach/Admin approval UI.
- Place photo capture intentionally accepts a URL. Native upload/storage is not part of the current Watch implementation.
- Venue deals exist in the backend, but the Mini App does not yet expose a complete owner-facing deal-management workflow.

## Teams — Implemented core

Current source includes real Teams backend, shared contracts, Prisma schema/migration support, routes, and Mini App pages/components.

Implemented capabilities include:

- team discovery
- team profiles
- team challenge creation
- challenge detail
- accept/decline flows according to role/authorization
- accepted game detail
- lineup/formation presentation
- Coach/team-management integration

The Teams schema was added through migration `20260816190000_add_teams`.

## Pitch — Scaffold / not production-complete

Pitch is present as a primary navigation destination and has real UI components for discovery/listing presentation.

Current limitation:

- there is no complete production Pitch listing backend/API in the current source
- `List your pitch` currently stores draft data locally rather than publishing a real listing
- users should not be led to believe a locally saved draft is a published venue

A complete Pitch domain/API is still required for public venue listing/discovery/contact behavior.

## ULTRAS — Planned

ULTRAS is part of the current HOOMA product direction but is not yet implemented in this source tree.

Planned behavior includes:

- supporter communities/fan pages linked to canonical recognized football clubs or national teams
- controlled global official-team selection rather than arbitrary free-text fake teams
- official team identity plus ULTRAS community identity
- vertical supporter-community banner feed
- Home ULTRAS banner entry above HOOMA NOW

## HOOMA NOW — Planned / placeholder only

The Home section exists visually, but the real football-data feed is not yet implemented.

Planned architecture remains:

`football provider -> HOOMA backend -> shared cache -> normalize/rank -> /api/v1/feed/trending -> Mini App`

Provider keys must never be exposed to the Mini App/frontend.

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
- Coach/internal reconciliation tooling

### Telegram Stars

- digital products only
- server-owned price
- native Telegram invoice link
- pre-checkout verification
- `successful_payment` authoritative settlement
- webhook dedupe
- DigitalEntitlement
- authorized refund flow

No Stripe/Flouci/crypto runtime rail is part of V1.

## Chat — Implemented MVP

- temporary Event room
- cursor message history
- post/delete authorization
- Mini App polling every few seconds

Push delivery is a future performance/UX enhancement, not a correctness dependency.

## Coach Control Room — Implemented core, terminology cleanup still needed

Current management capabilities include:

- managed community list
- dashboard aggregates
- payment reconciliation
- audit feed
- cash confirmation
- Stars digital-product configuration/refund
- invites
- member/community controls
- Event cancellation
- Teams management/challenge access

Some user-facing source still says `Admin` / `Owner / admin`. The current product terminology should be **Coach** / **Coach Control Room** while internal technical permission names may remain unchanged where appropriate.

## Frontend — Functional application structure

Current routes/pages include the major flows for:

- Home
- Play
- Watch
- Places
- Add a Place
- HOOMA/community
- Pitch
- Teams
- Team challenges/games/profiles
- Requests
- Ride
- FundMe
- Events
- formation
- chat
- check-in
- members
- Coach/internal management
- profile
- settings

The current locked bottom navigation is:

`Home | Play | Watch | HOOMA | Pitch`

The design system uses HOOMA's restrained vintage football/soccer heritage direction. Watch intentionally receives the strongest collector-ticket treatment; the wider product should not be treated as a generic vintage-ticket application.

## Known cleanup / maintainability findings

The latest source audit found cleanup work that remains after the completed GOOL -> HOOMA technical rename:

- duplicate/competing global CSS definitions exist in `apps/miniapp/src/index.css`
- `vintage-additions.css` appears to be an unintegrated/stale additions file
- `watch-vintage.css` appears to contain previous-generation Watch styling that needs reference verification before deletion
- multiple generations of event/ticket UI coexist and should be consolidated only after confirming actual usage
- three byte-identical HOOMA wordmark/logo assets currently exist in different paths
- frontend domain response types have drifted from backend/shared-contract reality in some areas
- automated test coverage is small relative to the amount of business logic
- `AdminPage.tsx` / Coach Control Room is becoming a large maintainability hotspot and should eventually be split by responsibility

Do not delete or consolidate any of these blindly; reference/import tracing is required first.

## Technical naming migration — Completed

The controlled GOOL -> HOOMA technical namespace migration is complete for active source identifiers.

Completed migration scope includes:

- root npm package `hooma`
- workspace packages `@hooma/api`, `@hooma/miniapp`, `@hooma/contracts`, and `@hooma/database`
- active TypeScript imports
- Railway build commands and runtime naming
- architecture and ESLint package-boundary rules
- active Mini App CSS identifier `.hooma-input`
- HOOMA browser-storage key with the legacy `gool-theme` compatibility fallback retained
- regenerated npm lockfile using the current HOOMA workspace manifests

Intentional legacy identifiers remain where migration would affect compatibility, persistence, immutable history, cryptographic metadata, or external resources. These include the legacy theme fallback, existing local database/volume identifiers, canonical GitHub repository/history references, persisted development identifiers such as `gool-central`, historical payment payload compatibility, and incidental package integrity hashes.

Migration validation performed in GitHub Codespaces included a clean `npm ci`, deployment preflight, Prisma schema validation and client generation, architecture checks, TypeScript checks, automated tests, production build, and migration deployment/status verification against a disposable PostgreSQL database.

Repository-wide lint, formatting, and npm security gates still contain separately identified baseline issues that were present outside the technical rename and must not be disguised as migration regressions.

## Foundation / scaling work

- `OutboxEvent` exists; publisher/worker is not yet deployed.
- `RateLimitStore` exists; current implementation is memory-only. `RATE_LIMIT_STORE=memory` is required explicitly in production and the API must stay at one replica until a Redis/Valkey adapter exists.
- geo-cell columns/indexes exist; large-scale proximity-query optimization can be extended before city-scale data becomes large.
- location retention requires a scheduled hard-delete job.

## Database / migrations

Current committed migrations include:

- `20260816141614_init`
- `20260816190000_add_teams`

Already-applied migrations are immutable. Future schema changes require new forward migrations. Do not rewrite migration history for branding cleanup.

The dependency lockfile must be regenerated/updated through npm rather than edited manually.

## Deployment / quality status

The repository includes Railway configurations for API and Mini App plus PostgreSQL deployment documentation.

### Current quality-gate warning

At the audited baseline commit `1259221`, GitHub CI failed at the `npm run lint` step. Earlier steps (`npm ci`, deploy preflight, DB validation/generation, architecture check) passed, but later CI stages were skipped after lint failed.

Therefore the audited baseline does **not** yet have confirmed green CI for:

- typecheck
- tests
- format check
- production build
- security check
- migration deploy/status gates

This pre-existing CI issue should be distinguished from any future failures caused by the GOOL -> HOOMA technical rename.

## Source verification policy

Static source checks are useful but do not replace the dependency-backed release gate. The authoritative acceptance standard remains the clean-install/quality sequence documented in `docs/QUALITY_GATES.md`.

Before treating a major refactor or rename as complete, run the complete quality gate and then perform a final case-insensitive repository search for legacy GOOL identifiers to classify any intentional historical exceptions.
