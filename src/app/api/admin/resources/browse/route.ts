import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  resourceType: z.enum(["skill", "rule"]),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().optional(),
  q: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      resourceType: url.searchParams.get("resourceType") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      categoryId: url.searchParams.get("categoryId") || undefined,
      q: url.searchParams.get("q") || undefined,
    });
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const { resourceType, page, pageSize, categoryId, q } = parsed.data;
    const skip = (page - 1) * pageSize;

    const qTrim = q?.trim();

    if (resourceType === "skill") {
      const where = {
        ...(categoryId ? { categoryId } : {}),
        ...(qTrim
          ? {
              OR: [
                { name: { contains: qTrim } },
                { slug: { contains: qTrim } },
              ],
            }
          : {}),
      };
      const [total, rows] = await prisma.$transaction([
        prisma.skill.count({ where }),
        prisma.skill.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
            moderationStatus: true,
            category: { select: { name: true, slug: true } },
          },
        }),
      ]);
      return jsonOk({
        items: rows.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          categoryId: r.categoryId,
          categoryName: r.category.name,
          moderationStatus: r.moderationStatus,
        })),
        total,
        page,
        pageSize,
      });
    }

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(qTrim
        ? {
            OR: [
              { name: { contains: qTrim } },
              { slug: { contains: qTrim } },
            ],
          }
        : {}),
    };
    const [total, rows] = await prisma.$transaction([
      prisma.rule.count({ where }),
      prisma.rule.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          moderationStatus: true,
          category: { select: { name: true, slug: true } },
        },
      }),
    ]);
    return jsonOk({
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        categoryId: r.categoryId,
        categoryName: r.category.name,
        moderationStatus: r.moderationStatus,
      })),
      total,
      page,
      pageSize,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
