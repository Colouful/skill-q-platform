import { PrismaHubRepository } from "../repositories/prisma/prisma-hub-repository";
import type { PrismaTransactionalHubClientLike } from "../repositories/repository-types";
import type { HubTransactionContext } from "./transaction-context";
import type { TransactionManagerPort } from "./transaction-manager-port";

export class PrismaTransactionManager implements TransactionManagerPort {
  constructor(private readonly prisma: PrismaTransactionalHubClientLike) {}

  runInTransaction<T>(handler: (tx: HubTransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (client) => {
      const repository = new PrismaHubRepository(client);
      return handler({
        assets: repository,
        assetVersions: repository,
        manifests: repository,
        manifestVersions: repository,
        manifestAssetBindings: repository,
        agentProfiles: repository,
        auditLogs: repository,
      });
    });
  }
}
