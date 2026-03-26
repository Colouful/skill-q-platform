/**
 * Prisma 交互式事务默认 timeout 5s；含大 JSON（如 Skill/Rule 初始 files）写入时易触发 P2028。
 * @see https://www.prisma.io/docs/orm/prisma-client/queries/transactions#interactive-transactions
 */
export const PRISMA_TX_LARGE_WRITE = {
  maxWait: 10_000,
  timeout: 30_000,
} as const;
