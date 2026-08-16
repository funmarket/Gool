import { PrismaClient } from '@prisma/client';
export { Prisma } from '@prisma/client';
export type * from '@prisma/client';

export function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}
