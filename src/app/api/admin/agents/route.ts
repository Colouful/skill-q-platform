import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  filter: z.enum(["all", "active", "inactive"]).default("all"),
});

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      q: url.searchParams.get("q") || undefined,
      filter: url.searchParams.get("filter") || undefined,
    });
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const { page, pageSize, q, filter } = parsed.data;
    const skip = (page - 1) * pageSize;

    const qTrim = q?.trim();
    const where = {
      ...(filter === "active" ? { isActive: true } : {}),
      ...(filter === "inactive" ? { isActive: false } : {}),
      ...(qTrim
        ? {
            OR: [
              { name: { contains: qTrim } },
              { slug: { contains: qTrim } },
            ],
          }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.agent.count({ where }),
      prisma.agent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { registeredAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          agentType: true,
          level: true,
          levelName: true,
          isActive: true,
          isVerified: true,
          registeredAt: true,
          lastActiveAt: true,
          uploadsCount: true,
          downloadsCount: true,
          apiCallsTotal: true,
        },
      }),
    ]);

    return jsonOk({ items, total, page, pageSize });
  } catch (e) {
    return toApiResponse(e);
  }
}
