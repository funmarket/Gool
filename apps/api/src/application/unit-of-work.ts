export interface TransactionHandle {
  readonly transactionId: string;
}

export interface UnitOfWork {
  run<T>(work: (tx: TransactionHandle) => Promise<T>): Promise<T>;
}
