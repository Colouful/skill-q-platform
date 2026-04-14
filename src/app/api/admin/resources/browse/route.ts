import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { readStoredSupportedProfiles } from "@/lib/profile-options";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  resourceType: z.enum(["skill", "rule"]),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().optional(),
  q: z.string().optional(),
  registryStatus: z.enum(["missing-registry", "missing-manifest", "mismatch"]).optional(),
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
      registryStatus: url.searchParams.get("registryStatus") || undefined,
    });
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const { resourceType, page, pageSize, categoryId, q, registryStatus } = parsed.data;
    const skip = (page - 1) * pageSize;

    const qTrim = q?.trim();
    const registryWhere =
      registryStatus === "missing-registry"
        ? { OR: [{ registryId: null }, { registryId: "" }] }
        : registryStatus === "missing-manifest"
          ? { OR: [{ manifestId: null }, { manifestId: "" }] }
          : {};

    function mapRow<T extends {
      id: string;
      name: string;
      slug: string;
      registryId: string | null;
      manifestId: string | null;
      categoryId: string;
      category: { name: string; slug: string };
      tags: unknown;
      supportedProfiles: unknown;
      moderationStatus: string;
    }>(r: T) {
      const hasRegistryId = Boolean(r.registryId);
      const hasManifestId = Boolean(r.manifestId);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        registryId: r.registryId,
        manifestId: r.manifestId,
        categoryId: r.categoryId,
        categoryName: r.category.name,
        tags: Array.isArray(r.tags)
          ? r.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        supportedProfiles: readStoredSupportedProfiles(r.supportedProfiles).profiles,
        moderationStatus: r.moderationStatus,
        hasRegistryId,
        hasManifestId,
        isCanonicalReady: hasRegistryId && hasManifestId,
      };
    }

    function applyRegistryStatusFilter<
      T extends { registryId: string | null; manifestId: string | null }
    >(rows: T[]) {
      if (registryStatus !== "mismatch") {
        return rows;
      }
      return rows.filter(
        (row) =>
          Boolean(row.registryId) &&
          Boolean(row.manifestId) &&
          row.registryId !== row.manifestId,
      );
    }

    if (resourceType === "skill") {
      const where = {
        ...(categoryId ? { categoryId } : {}),
        ...registryWhere,
        ...(qTrim
          ? {
              OR: [{ name: { contains: qTrim } }, { slug: { contains: qTrim } }],
            }
          : {}),
      };
      const select = {
        id: true,
        name: true,
        slug: true,
        registryId: true,
        manifestId: true,
        categoryId: true,
        tags: true,
        supportedProfiles: true,
        moderationStatus: true,
        category: { select: { name: true, slug: true } },
      } as const;
      if (registryStatus === "mismatch") {
        const rows = applyRegistryStatusFilter(
          await prisma.skill.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            select,
          }),
        );
        const pagedRows = rows.slice(skip, skip + pageSize);
        return jsonOk({
          items: pagedRows.map(mapRow),
          total: rows.length,
          page,
          pageSize,
        });
      }
      const [total, rows] = await prisma.$transaction([
        prisma.skill.count({ where }),
        prisma.skill.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { updatedAt: "desc" },
          select,
        }),
      ]);
      return jsonOk({
        items: rows.map(mapRow),
        total,
        page,
        pageSize,
      });
    }

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...registryWhere,
      ...(qTrim
        ? {
            OR: [{ name: { contains: qTrim } }, { slug: { contains: qTrim } }],
          }
        : {}),
    };
    const select = {
      id: true,
      name: true,
      slug: true,
      registryId: true,
      manifestId: true,
      categoryId: true,
      tags: true,
      supportedProfiles: true,
      moderationStatus: true,
      category: { select: { name: true, slug: true } },
    } as const;
    if (registryStatus === "mismatch") {
      const rows = applyRegistryStatusFilter(
        await prisma.rule.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          select,
        }),
      );
      const pagedRows = rows.slice(skip, skip + pageSize);
      return jsonOk({
        items: pagedRows.map(mapRow),
        total: rows.length,
        page,
        pageSize,
      });
    }
    const [total, rows] = await prisma.$transaction([
      prisma.rule.count({ where }),
      prisma.rule.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        select,
      }),
    ]);
    return jsonOk({
      items: rows.map(mapRow),
      total,
      page,
      pageSize,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
