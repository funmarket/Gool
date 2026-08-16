# GOOL Security Model

## Secrets

Never commit:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- Railway database credentials
- future provider private keys

`.env` files are ignored. `.env.example` contains placeholders only.

## Authentication

Production requests under `/api/v1` require validated Telegram Mini App initData. The API constructs the authenticated user context after signature validation and user upsert.

Development bypass is explicit and production startup rejects it.

## Authorization

- Community membership gates domain reads/writes.
- Owner/admin checks occur in application services or transaction-aware repository policy where race safety requires it.
- Only owners can change admin roles or transfer ownership.
- Owners cannot be silently demoted/banned; transfer is explicit.
- Admins cannot ban another admin; owners can.
- Cash payer cannot self-confirm payment.
- Ride driver alone changes RideOffer lifecycle and accepts/declines riders.
- check-ins require Event membership and distance validation.

## Financial integrity

- amounts use integer minor units; no float storage
- Stars amount is server-authoritative
- payment settlement is idempotent
- cash proof has a dedicated settlement row
- paid history is refunded/voided, not deleted
- provider webhook event IDs are unique
- payment success is never inferred from a frontend callback

## Concurrency

Capacity, Request claims, Ride seats, owner changes and payment settlement use row locks and/or serializable transactions. Cross-domain writes share one UnitOfWork transaction handle.

## HTTP controls

- Helmet security headers
- restricted production CORS origin
- request-size limit
- request IDs
- centralized stable API error envelope
- rate limiting
- bounded query page sizes

## Rate-limit topology

Current store is in memory. Run one API replica until a shared Redis/Valkey `RateLimitStore` is implemented. This is a scaling limit, not a correctness dependency.

## Live location

Ride location data is limited to driver/accepted riders, has an explicit expiry, and should be hard-deleted by a periodic retention task.

## Audit

Sensitive actions write `AuditLog`, including cash settlement/void, Event updates/cancellation, member bans, admin role changes, ownership transfer, invites, and Stars refunds/configuration where implemented.
