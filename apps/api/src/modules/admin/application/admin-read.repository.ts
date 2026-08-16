export type AdminPaymentStatus =
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'AWAITING_CASH'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface AdminReadRepository {
  listManagedCommunities(userId: string): Promise<unknown>;
  dashboard(communityId: string): Promise<unknown>;
  payments(
    communityId: string,
    input: {
      method?: 'CASH' | 'TELEGRAM_STARS';
      status?: AdminPaymentStatus;
      cursor?: string;
      limit: number;
    },
  ): Promise<unknown>;
  audit(communityId: string, input: { cursor?: string; limit: number }): Promise<unknown>;
}
