# Railway Deployment

GOOL is intended to run as two Railway services plus PostgreSQL.

## Service 1: API

Use `railway.api.json`.

Required environment:

```text
# APP_BASE_URL can be omitted for the first API boot; set it before Mini App browser traffic
APP_BASE_URL=https://<miniapp-public-host>
DATABASE_URL=<Railway pooled PostgreSQL URL>
DIRECT_DATABASE_URL=<Railway direct PostgreSQL URL>
TELEGRAM_BOT_TOKEN=<secret>
TELEGRAM_WEBHOOK_SECRET=<secret>
INIT_DATA_MAX_AGE_SECONDS=86400
DEV_AUTH_BYPASS=false
RATE_LIMIT_STORE=memory
```

The API start command sets `NODE_ENV=production`, runs `prisma migrate deploy`, and then starts the built API. Do not set `NODE_ENV=production` as a Railway service variable because Railway exposes service variables during build, and npm would omit dev dependencies that the TypeScript build needs. `DIRECT_DATABASE_URL` is intentionally required for migration operations; set both database URLs in Railway.

**Important:** v1 intentionally uses `RATE_LIMIT_STORE=memory`. `railway.api.json` pins `deploy.numReplicas` to exactly **1**, and deployment preflight rejects a different value. Do not enable autoscaling above one replica; adding replicas requires implementing and validating the existing `RateLimitStore` contract with Redis/Valkey first.

## Service 2: Mini App

Use `railway.miniapp.json`.

Environment:

```text
VITE_API_BASE_URL=https://<api-public-host>
VITE_DEV_AUTH_BYPASS=false
```

Do not expose bot tokens or database credentials to Vite variables.

## PostgreSQL

Use Railway PostgreSQL. Runtime API traffic should use the pooled `DATABASE_URL`. Prisma migration operations use `DIRECT_DATABASE_URL`.

## First deployment checklist

1. verify the npm-generated `package-lock.json` is committed
2. clear the dependency security gate (`npm run security:check`)
3. create/attach Railway PostgreSQL
4. generate and commit the real initial Prisma migration
5. run `npm run release:check` and `npm run deploy:preflight`
6. create API Railway service from `railway.api.json`
7. create Mini App service from `railway.miniapp.json`
8. set secrets/environment variables
9. deploy API and verify `/health` (the API can boot with `APP_BASE_URL` omitted; browser CORS remains fail-closed)
10. deploy Mini App and obtain its public URL
11. set `APP_BASE_URL` on the API to that exact Mini App origin and redeploy the API
12. set Telegram Mini App URL to the Mini App public URL
13. register the webhook with `API_BASE_URL=https://<api-host> npm run telegram:webhook:register`
14. perform a real Telegram auth smoke test
15. perform a small Stars test before enabling a paid digital product for users

## Rollback

Application rollback must not edit already-applied database migrations. Deploy a compatible application version or add a forward corrective migration.
