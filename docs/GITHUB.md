# GitHub Setup

Canonical repository: `funmarket/Gool`.

## First push

Do not initialize or upload a second generated codebase. The canonical cleaned `GOOL/` directory is the only source tree that should be committed.

After all pre-GitHub gates pass:

```bash
git init
git add .
git commit -m "feat: establish GOOL application foundation"
git branch -M main
git remote add origin git@github.com:funmarket/Gool.git
git push -u origin main
```

If using HTTPS, use normal GitHub credential tooling rather than placing a token in shell history.

## Required state before the first push

The repository must contain:

- npm-generated `package-lock.json`
- real Prisma initial migration
- no tracked `node_modules`, `dist`, coverage, environment secrets, logs, or TypeScript build-info files

Run:

```bash
npm run release:check
npm run deploy:preflight
```

No green release gate means no first production baseline.

## Branch discipline

Use feature branches and PRs after the initial repository import. Keep migration changes in the same PR as schema/application changes that require them.

Never commit `.env`, Telegram bot tokens, database passwords, or future payment-provider secrets.
