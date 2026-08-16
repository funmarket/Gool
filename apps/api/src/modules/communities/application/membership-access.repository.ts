import type { TransactionHandle } from '../../../application/unit-of-work.js';

export interface MembershipAccess {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'BANNED' | 'LEFT';
}

export interface MembershipAccessRepository {
  get(
    userId: string,
    communityId: string,
    tx?: TransactionHandle,
  ): Promise<MembershipAccess | null>;
}
