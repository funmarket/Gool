import { createPrismaClient } from '@hooma/database';
export type DatabaseClient = ReturnType<typeof createPrismaClient>;
export function buildDatabase() {
  return createPrismaClient();
}
