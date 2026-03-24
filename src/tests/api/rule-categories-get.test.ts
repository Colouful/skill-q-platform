import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

import { GET } from "@/app/api/rule-categories/route";

describe("GET /api/rule-categories", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("只查询 resourceType=rule 并排序", async () => {
    findMany.mockResolvedValue([
      {
        id: "1",
        name: "业务规则",
        slug: "business-rules",
        description: null,
        icon: null,
        resourceType: "rule",
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const res = await GET();
    const json = (await res.json()) as { code: number; data: unknown[] };
    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { resourceType: "rule" },
        orderBy: { sortOrder: "asc" },
      }),
    );
  });
});
