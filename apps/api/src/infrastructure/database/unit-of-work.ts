import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@hooma/database';
import type { TransactionHandle, UnitOfWork } from '../../application/unit-of-work.js';

const transactionClients = new WeakMap<object, Prisma.TransactionClient>();

class PrismaTransactionHandle implements TransactionHandle {
  readonly transactionId = randomUUID();
}

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly db: PrismaClient) {}

  run<T>(work: (tx: TransactionHandle) => Promise<T>): Promise<T> {
    return this.db.$transaction(
      async (client) => {
        const handle = new PrismaTransactionHandle();
        transactionClients.set(handle, client);
        return work(handle);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

export function transactionClient(handle: TransactionHandle): Prisma.TransactionClient {
  const client = transactionClients.get(handle as object);
  if (!client) throw new Error('Invalid or expired transaction handle');
  return client;
}
