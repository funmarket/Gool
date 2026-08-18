# HOOMA Payments

## V1 rails

Only two payment methods exist in current runtime code:

- `CASH`
- `TELEGRAM_STARS`

There is no credit-card or crypto provider in v1.

## Purpose policy

```text
EVENT_FEE          -> CASH
RIDE_SHARE         -> CASH
FUND_CONTRIBUTION  -> CASH
DIGITAL_PRODUCT    -> TELEGRAM_STARS
```

`assertMethodAllowedForPurpose()` enforces the boundary server-side. React cannot override it.

## Four separate concepts

1. **Business obligation**: RSVP, RideMatch, or FundContribution owes money.
2. **Accepted method policy**: community/resource says Cash is allowed.
3. **PaymentIntent**: records the exact amount/currency and lifecycle.
4. **Settlement proof**: CashSettlement or TelegramStarPayment proves payment.

RSVP status and PaymentIntent status are intentionally separate.

## Cash

Typical flow:

```text
paid Play event
-> RSVP created/confirmed according to CashRsvpPolicy
-> PaymentIntent AWAITING_CASH
-> organizer/admin/owner physically receives cash
-> POST /api/v1/payments/:id/cash/confirm
-> lock payment
-> create one CashSettlement
-> mark PaymentIntent PAID
-> settle owning RSVP/Ride/Fund contribution
-> audit + outbox
```

The payer cannot confirm their own cash payment.

Void/refund does not erase history. It marks the settlement voided/refunded and updates the owning domain through the same application transaction.

Cash acceptance exists as:

- community default
- Event-specific payment method
- RideOffer-specific payment method
- Fundraiser-specific payment method

Changing a community default does not mutate already-created resources.

## RSVP and cash

`CashRsvpPolicy` supports:

- `CONFIRM_IMMEDIATELY`: seat can be confirmed while payment remains `AWAITING_CASH`.
- `REQUIRE_CASH_CONFIRMATION`: RSVP stays `PENDING_PAYMENT` until cash is confirmed.

Waitlisted users are not charged. When promoted, a cash PaymentIntent is created only then if the Event requires payment.

Event cancellation cancels pending cash intents. Already-paid cash is not silently reversed; an authorized user must explicitly void/refund it, preserving accounting history.

## Telegram Stars

Stars are for HOOMA digital products only. Current SKU: `SUPPORTER_BADGE`.

The price is configured server-side in `DigitalProduct`. The Mini App submits only `communityId`, SKU and an idempotency key; it cannot choose a Stars amount.

Flow:

```text
Mini App -> create Stars checkout
API -> Telegram createInvoiceLink (currency XTR)
Mini App -> Telegram.WebApp.openInvoice
Telegram -> pre_checkout_query webhook
HOOMA -> validate payload, amount, Telegram user and payment state
Telegram -> successful_payment webhook
HOOMA -> dedupe update -> store TelegramStarPayment -> PAID -> DigitalEntitlement
```

The `openInvoice()` callback is UI feedback only and never settles the database. The Mini App polls the HOOMA PaymentIntent after Telegram reports paid/pending so UI catches up with the authoritative webhook.

Refund:

```text
admin -> refund endpoint
HOOMA -> Telegram refundStarPayment
HOOMA -> idempotent database refund record
HOOMA -> revoke entitlement tied to that payment
```

The Telegram adapter treats Telegram's already-refunded result as idempotent so a database retry can reconcile an external refund that succeeded before a transient database failure.

## Idempotency

Dangerous client-created payment/contribution operations require `Idempotency-Key`. Telegram webhook processing is also deduplicated with provider event IDs and payment charge IDs.

## Future payment rails

Future crypto or local methods must implement a payment adapter/verification boundary and converge on the same settlement service. They must not add provider SDK calls to Event, Ride, Fundraiser, or frontend domain components.
