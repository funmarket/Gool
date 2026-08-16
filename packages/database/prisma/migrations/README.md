# Migrations

The Prisma-generated `20260816141614_init` migration is the immutable production baseline. Do not use `prisma db push` in production and do not hand-author migrations from memory.

For every new schema change:

1. Update `schema.prisma`.
2. Run `npm run db:migrate -- --name <change>` against development PostgreSQL.
3. Review the generated SQL and add only documented PostgreSQL constraints Prisma cannot express.
4. Run `npm run db:migrate:deploy` and `npm run db:migration:check` against a clean verification database.
5. Commit the schema and generated migration together.

After a migration has been deployed, never edit it. Add a new migration instead.
