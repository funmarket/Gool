import { createPrismaClient } from '@gool/database';
export type DatabaseClient = ReturnType<typeof createPrismaClient>;
export function buildDatabase() {
  return createPrismaClient();
}
