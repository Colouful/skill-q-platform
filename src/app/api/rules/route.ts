import { type Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { checkApiRateLimit, getRequestIp, rateLimitResponseHeaders } from "@/lib/api-rate-limit";
import { getAuthFromRequest, publicAgentSummary } from "@/lib/agent-auth";
import { applyExperienceDelta, XP_UPLOAD_RESOURCE } from "@/lib/agent-experience";
import { rateLimitForAgentLevel } from "@/lib/agent-levels";
import { assertHubAuthForDeclaredAuthor } from "@/lib/hub-auth";
import { slugFromName } from "@/lib/skill-slug";
import { MODERATION_STATUS } from "@/lib/moderation";
import { getDefaultDownloadPolicy, getResourceUploadRequiresModeration } from "@/lib/system-config";
import { enforceUploadLoginPolicy } from "@/lib/upload-login-policy";
import { z } from "zod";

export const dynamic = "force-dynamic";

const fileEntry = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string().optional(),
});

const downloadPolicyEnum = z.enum(["public", "login", "author"]);

const postBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  author: z.string().min(1).max(100),
  categorySlug: z.string().min(1),
  longDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  downloadPolicy: downloadPolicyEnum.optional(),
  initialFiles: z.array(fileEntry).max(200).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromRequest(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const categorySlug = searchParams.get("category")?.trim();
    const q = searchParams.get("q")?.trim();

    const where: Prisma.RuleWhereInput = {
      moderationStatus: MODERATION_STATUS.PUBLISHED,
    };
    if (categorySlug) {
      where.category = { slug: categorySlug, resourceType: "rule" };
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { slug: { contains: q } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.rule.count({ where }),
      prisma.rule.findMany({
        where,
        include: { category: true },
        orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return jsonOk({
      items,
      total,
      page,
      pageSize,
      currentAgent: auth.agent ? publicAgentSummary(auth.agent) : null,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const gate = await enforceUploadLoginPolicy(req);
    if (gate.denied) {
      return jsonErr(gate.message, 401);
    }
    const { auth } = gate;
    const ip = getRequestIp(req);
    const rl = auth.agent
      ? await checkApiRateLimit(`api:rules:create:agent:${auth.agent.id}`, {
          max: rateLimitForAgentLevel(auth.agent.level),
          windowMs: 60 * 60 * 1000,
        })
      : await checkApiRateLimit(`api:rules:create:${ip}`, { max: 30, windowMs: 60_000 });
    if (!rl.ok) {
      return jsonErr("创建请求过于频繁，请稍后再试", 429, 1, { headers: rateLimitResponseHeaders(rl) });
    }

    const raw = await req.json();
    const parsed = postBody.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;

    assertHubAuthForDeclaredAuthor(req, b.author);

    const category = await prisma.category.findUnique({
      where: { slug_resourceType: { slug: b.categorySlug, resourceType: "rule" } },
    });
    if (!category) {
      return jsonErr("Rule 分类不存在", 400);
    }

    let slug = slugFromName(b.name);
    const exists = await prisma.rule.findUnique({ where: { slug } });
    if (exists) {
      slug = `${slug}-${crypto.randomUUID().slice(0, 8)}`;
    }

    const tagsJson: Prisma.InputJsonValue =
      b.tags && b.tags.length > 0 ? b.tags : [];

    const initialFiles =
      b.initialFiles && b.initialFiles.length > 0 ? b.initialFiles : [];

    const defaultPolicy = await getDefaultDownloadPolicy();
    const requiresModeration = await getResourceUploadRequiresModeration();
    const initialModeration = requiresModeration
      ? MODERATION_STATUS.PENDING
      : MODERATION_STATUS.PUBLISHED;

    let agentLevelUp: { level: number; levelName: string } | null = null;
    const rule = await prisma.$transaction(async (tx) => {
      const r = await tx.rule.create({
        data: {
          name: b.name.trim(),
          slug,
          description: b.description,
          longDescription: b.longDescription?.trim() || null,
          author: b.author.trim(),
          categoryId: category.id,
          tags: tagsJson,
          downloadPolicy: b.downloadPolicy ?? defaultPolicy,
          moderationStatus: initialModeration,
          authorAgentId: auth.agent?.id ?? undefined,
          versions: {
            create: {
              version: "1.0.0",
              changelog: initialFiles.length ? "从 Markdown 或 ZIP 导入的初始版本" : "初始版本",
              files: initialFiles,
              isLatest: true,
            },
          },
        },
        include: { category: true, versions: true },
      });
      if (auth.agent) {
        await tx.agent.update({
          where: { id: auth.agent.id },
          data: { uploadsCount: { increment: 1 } },
        });
        const xp = await applyExperienceDelta(tx, auth.agent.id, XP_UPLOAD_RESOURCE);
        if (xp?.leveledUp) {
          agentLevelUp = { level: xp.level, levelName: xp.levelName };
        }
      }
      return r;
    });

    return jsonOk({ rule, agentLevelUp }, "创建成功", { headers: rateLimitResponseHeaders(rl) });
  } catch (e) {
    return toApiResponse(e);
  }
}
