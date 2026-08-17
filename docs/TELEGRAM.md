# HOOMA Telegram Integration

## Mini App authentication

The Mini App sends the raw Telegram `initData` in:

```text
Authorization: tma <raw-init-data>
```

The API validates the signed payload with the bot token using `@tma.js/init-data-node`, enforces max auth age, and derives the trusted Telegram user from the validated payload. A user ID sent by the browser is not accepted as production identity.

`initDataUnsafe` is never used for server authorization.

## Development bypass

Local browser development may set:

```text
DEV_AUTH_BYPASS=true
DEV_TELEGRAM_USER_ID=100000001
VITE_DEV_AUTH_BYPASS=true
VITE_DEV_TELEGRAM_USER_ID=100000001
```

Production startup fails if `DEV_AUTH_BYPASS=true`.

## Theme

`ThemeProvider` combines Telegram ThemeParams with a user override:

- `TELEGRAM`: follow Telegram theme
- `LIGHT`: HOOMA light theme
- `DARK`: HOOMA dark theme

The local override updates immediately and the server-side user preference is the canonical persisted setting.

## Stars

HOOMA uses the Telegram Bot API for:

- `createInvoiceLink` with `XTR`
- `answerPreCheckoutQuery`
- `refundStarPayment`

The Mini App opens the returned link with Telegram's native `WebApp.openInvoice()` surface. The callback is not payment proof; `successful_payment` received by the backend is authoritative.

## Webhook security

Telegram webhook endpoint:

```text
POST /webhooks/telegram
```

HOOMA checks `X-Telegram-Bot-Api-Secret-Token` against `TELEGRAM_WEBHOOK_SECRET` before processing updates.

Configure the webhook on Telegram with a unique secret token. Do not expose the bot token in the Mini App or GitHub.

## Official references

- Telegram Mini Apps: https://core.telegram.org/bots/webapps
- Bot API: https://core.telegram.org/bots/api
- Telegram Stars payments: https://core.telegram.org/bots/payments-stars
