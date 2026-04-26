import { describe, expect, it } from "vitest";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";
import { createHubRepository } from "@/server/hub/repository";

describe("MemoryTransactionManager", () => {
  it("成功时应提交内存写入", async () => {
    const repo = createHubRepository();
    const manager = new MemoryTransactionManager(repo);

    await manager.runInTransaction(async (tx) => {
      await tx.assets.createAsset({
        slug: "memory-transaction-asset",
        name: "内存事务资产",
        kind: "rule",
        scope: "platform",
      });
    });

    expect(repo.assets).toHaveLength(1);
    expect(repo.assets[0]?.slug).toBe("memory-transaction-asset");
  });

  it("失败时应回滚业务数据和审计日志", async () => {
    const repo = createHubRepository();
    const manager = new MemoryTransactionManager(repo);

    await expect(
      manager.runInTransaction(async (tx) => {
        const asset = await tx.assets.createAsset({
          slug: "rollback-asset",
          name: "回滚资产",
          kind: "rule",
          scope: "platform",
        });
        await tx.auditLogs.createAuditLog({
          targetType: "asset",
          targetId: asset.id,
          action: "create",
          operatorId: "system",
        });
        throw new Error("模拟失败");
      }),
    ).rejects.toThrow("模拟失败");

    expect(repo.assets).toHaveLength(0);
    await expect(manager.adapter.listAuditLogs()).resolves.toMatchObject({
      pagination: { total: 0 },
      items: [],
    });
  });
});
