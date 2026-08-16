# Migrations

Do not use `prisma db push` in production and do not hand-author an initial migration from memory.

Before the first deployment:

1. Start a clean PostgreSQL database.
2. Run `npm run db:migrate -- --name init`.
3. Review the generated SQL and add only the documented PostgreSQL CHECK constraints Prisma cannot express.
4. Run `npm run db:migrate:deploy` against a second clean database.
5. Commit the generated migration and `package-lock.json` together.

After a migration has been deployed, never edit it. Add a new migration instead.
