# HOOMA First-Release Gate

Keep this checklist green from the canonical repository source tree before every release.

## Repository baseline already established

- HOOMA is canonical for user-facing branding and active technical workspace/import identifiers.
- Active workspaces are `@hooma/api`, `@hooma/miniapp`, `@hooma/contracts`, and `@hooma/database`.
- Legacy identifiers may remain only where required for compatibility, persistence, immutable history, or external resources awaiting a controlled migration.
- The `houma` neighborhood/local-area domain field is intentional and must remain unchanged.
- runtime payment rails are Cash + Telegram Stars only.
- API and Mini App are separate Railway services.
- `package-lock.json` must be synchronized with package manifests before the HOOMA technical-rebrand branch is merged.
- route-level Mini App lazy loading and an initial-bundle budget are source-enforced.
- release/bootstrap scripts are cross-platform Node scripts.
- v1 intentionally uses the in-memory rate-limit store and `railway.api.json` pins the API to one replica.
- Telegram webhook registration is repeatable through `npm run telegram:webhook:register`.
- `npm run deploy:preflight` fails closed on missing required release artifacts/environment.

## Completed foundation gates

### 1. Dependency security audit

The reviewed dependency baseline uses the commands below when dependency versions need to be reproduced or updated:

```bash
npm install --save-dev --save-exact concurrently@10.0.5
npm -w @hooma/miniapp install --save-dev --save-exact vite@7.3.6
npm -w @hooma/database install --save-dev --save-exact prisma@6.19.3
npm -w @hooma/database install --save --save-exact @prisma/client@6.19.3
npm run security:check
```

The Prisma CLI and client stay on the same version. Do not use `npm audit fix --force`.

### 2. Real initial Prisma migration

The Prisma-generated `20260816141614_init` migration is committed. Applied migration files are immutable; do not edit them for branding. Production migration checks continue to use the committed chain.

### 3. Clean-install gate

After any release change:

```bash
npm run release:check
npm run deploy:preflight
```

Both commands must pass, or any known pre-existing failure must be explicitly distinguished from a regression before merge. Review Vite output as well; warnings are not ignored merely because the build exits zero.

## Release bootstrap

Once the dependency graph is security-clean and PostgreSQL is available, set both database URLs and run:

```bash
npm run bootstrap:first-release
```

Bootstrap validates the committed migration chain, uses the committed lockfile through `npm ci`, and does not rewrite dependency resolution.
