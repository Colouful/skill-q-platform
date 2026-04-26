import type { HubTransactionContext } from "./transaction-context";

export interface TransactionManagerPort {
  runInTransaction<T>(handler: (tx: HubTransactionContext) => Promise<T>): Promise<T>;
}
