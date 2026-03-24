import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { ApiError, toApiResponse } from "@/lib/api-errors";
import { assertHubAuthForDeclaredAuthor } from "@/lib/hub-auth";
import { enforceUploadLoginPolicy } from "@/lib/upload-login-policy";
import { isPublishedModeration, MODERATION_STATUS } from "@/lib/moderation";
import { slugFromName } from "@/lib/skill-slug";
import { z } from "zod";

export const dynamic = "force-dynamic";

const forkBody = z.object({
  name: z.string().min(1).max(255).optional(),
  author: z.string().min(1).max(100).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const source = await prisma.rule.findUnique({
      where: { slug },
      include: { versions: { orderBy: { createdAt: "desc" } } },
    });
    if (!source) {
      throw new ApiError("Rule 不存在", 404);
    }
    if (!isPublishedModeration(source.moderationStatus)) {
      throw new ApiError("仅可复制已上架的 Rule", 400);
    }

    const gate = await enforceUploadLoginPolicy(req);
    if (gate.denied) {
      throw new ApiError(gate.message, 401);
    }
    const { auth } = gate;
    const raw = await req.json().catch(() => ({}));
    const parsed = forkBody.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;

    const baseName = b.name?.trim() || `${source.name} (Fork)`;
    const author = b.author?.trim() || source.author;

    assertHubAuthForDeclaredAuthor(req, author);

    let newSlug = slugFromName(baseName);
    const exists = await prisma.rule.findUnique({ where: { slug: newSlug } });
    if (exists) {
      newSlug = `${newSlug}-${crypto.randomUUID().slice(0, 8)}`;
    }

    const sorted = [...source.versions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const versionsCreate = sorted.map((v, i) => ({
      version: v.version,
      changelog: v.changelog,
      files: v.files as object,
      downloadUrl: v.downloadUrl,
      isLatest: i === 0,
      downloads: 0,
    }));

    const rule = await prisma.rule.create({
      data: {
        name: baseName,
        slug: newSlug,
        description: source.description,
        longDescription: source.longDescription,
        author,
        categoryId: source.categoryId,
        tags: source.tags ?? undefined,
        forkedFromRuleId: source.id,
        authorAgentId: auth.agent?.id ?? undefined,
        downloadPolicy: source.downloadPolicy,
        moderationStatus: MODERATION_STATUS.PENDING,
        downloads: 0,
        rating: 0,
        reviewCount: 0,
        isFeatured: false,
        versions: {
          create:
            versionsCreate.length > 0
              ? versionsCreate
              : [
                  {
                    version: "1.0.0",
                    changelog: "Fork 初始版本",
                    files: [],
                    isLatest: true,
                  },
                ],
        },
      },
      include: { category: true, versions: true },
    });

    return jsonOk(rule, "Fork 成功");
  } catch (e) {
    return toApiResponse(e);
  }
}
