import { type Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest, publicAgentSummary } from "@/lib/agent-auth";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { assertHubAuthForResourceAuthor } from "@/lib/hub-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchBody = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  longDescription: z.string().nullable().optional(),
  author: z.string().min(1).max(100).optional(),
  categorySlug: z.string().min(1).optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  /** 乐观锁：须与当前 Rule.updatedAt 的 ISO 时间一致 */
  expectedUpdatedAt: z.string().optional(),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthFromRequest(req);
    const { slug } = await ctx.params;
    const rule = await prisma.rule.findUnique({
      where: { slug },
      include: {
        category: true,
        versions: { orderBy: { createdAt: "desc" } },
        reviews: {
          where: { resourceType: "rule" },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!rule) {
      return jsonErr("Rule 不存在", 404);
    }
    return jsonOk({
      ...rule,
      currentAgent: auth.agent ? publicAgentSummary(auth.agent) : null,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const existing = await prisma.rule.findUnique({ where: { slug } });
    if (!existing) {
      return jsonErr("Rule 不存在", 404);
    }

    assertHubAuthForResourceAuthor(req, existing.author);

    const raw = await req.json();
    const parsed = patchBody.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;

    if (b.expectedUpdatedAt !== undefined) {
      const sent = Date.parse(b.expectedUpdatedAt);
      if (Number.isNaN(sent) || sent !== existing.updatedAt.getTime()) {
        return jsonErr("内容已被他人修改，请刷新后重试", 409);
      }
    }

    const data: Prisma.RuleUpdateInput = {};
    if (b.name !== undefined) data.name = b.name.trim();
    if (b.description !== undefined) data.description = b.description;
    if (b.longDescription !== undefined) data.longDescription = b.longDescription;
    if (b.author !== undefined) data.author = b.author.trim();
    if (b.isFeatured !== undefined) data.isFeatured = b.isFeatured;
    if (b.tags !== undefined) {
      data.tags = b.tags.length ? b.tags : [];
    }

    if (b.categorySlug !== undefined) {
      const cat = await prisma.category.findUnique({
        where: { slug_resourceType: { slug: b.categorySlug, resourceType: "rule" } },
      });
      if (!cat) {
        return jsonErr("分类不存在", 400);
      }
      data.category = { connect: { id: cat.id } };
    }

    const rule = await prisma.rule.update({
      where: { slug },
      data,
      include: { category: true },
    });

    return jsonOk(rule, "更新成功");
  } catch (e) {
    return toApiResponse(e);
  }
}
