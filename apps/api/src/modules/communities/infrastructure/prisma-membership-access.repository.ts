import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { transactionClient } from '../../../infrastructure/database/unit-of-work.js';
import type { MembershipAccessRepository } from '../application/membership-access.repository.js';
import type { TransactionHandle } from '../../../application/unit-of-work.js';

export class PrismaMembershipAccessRepository implements MembershipAccessRepository {
  constructor(private readonly db: DatabaseClient) {}
  get(userId: string, communityId: string, tx?: TransactionHandle) {
    const client = tx ? transactionClient(tx) : this.db;
    return client.membership.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { id: true, role: true, status: true },
    });
  }
}
