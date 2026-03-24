import type { PrismaClient } from "../src/generated/prisma";
import { MODERATION_STATUS } from "../src/lib/moderation";
import { syncRuleReviewStats } from "../src/lib/skill-review-stats";

const RULE_CATEGORIES: { name: string; slug: string; sortOrder: number }[] = [
  { name: "规则集", slug: "rule-sets", sortOrder: 0 },
  { name: "决策表", slug: "decision-tables", sortOrder: 1 },
  { name: "评分卡", slug: "scorecards", sortOrder: 2 },
  { name: "流程模板", slug: "workflow-templates", sortOrder: 3 },
  { name: "风控策略", slug: "risk-control", sortOrder: 4 },
  { name: "业务规则", slug: "business-rules", sortOrder: 5 },
  { name: "合规规则", slug: "compliance-rules", sortOrder: 6 },
  { name: "数据验证", slug: "data-validation", sortOrder: 7 },
  { name: "路由规则", slug: "routing-rules", sortOrder: 8 },
  { name: "转换规则", slug: "transformation-rules", sortOrder: 9 },
];

export async function seedRules(prisma: PrismaClient) {
  for (const c of RULE_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        slug_resourceType: { slug: c.slug, resourceType: "rule" },
      },
      create: {
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        resourceType: "rule",
      },
      update: { name: c.name, sortOrder: c.sortOrder },
    });
  }

  const biz = await prisma.category.findUniqueOrThrow({
    where: { slug_resourceType: { slug: "business-rules", resourceType: "rule" } },
  });

  const samples = [
    {
      slug: "order-approval-v1",
      name: "订单审批规则",
      description: "示例：根据金额与信用分路由审批路径。",
      author: "虾球Hub",
    },
    {
      slug: "discount-tier-json",
      name: "会员折扣阶梯",
      description: "示例：JSON 配置的折扣与积分倍率。",
      author: "虾球Hub",
    },
    {
      slug: "api-rate-limit-yaml",
      name: "接口限流模板",
      description: "示例：YAML 描述的按 IP / 用户限流。",
      author: "虾球Hub",
    },
    {
      slug: "kyc-checklist",
      name: "KYC 合规清单",
      description: "示例：合规字段校验与阻断条件。",
      author: "虾球Hub",
    },
    {
      slug: "route-by-region",
      name: "地域路由规则",
      description: "示例：按用户区域选择下游集群。",
      author: "虾球Hub",
    },
  ];

  for (const s of samples) {
    const existing = await prisma.rule.findUnique({ where: { slug: s.slug } });
    if (existing) continue;

    const rule = await prisma.rule.create({
      data: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        author: s.author,
        categoryId: biz.id,
        isFeatured: true,
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        tags: ["demo", "rule"],
        versions: {
          create: {
            version: "1.0.0",
            changelog: "种子版本",
            files: [
              {
                name: "RULE.md",
                path: "RULE.md",
                content: `---\nname: ${s.slug}\n---\n\n# ${s.name}\n\n示例 Rule 包。`,
              },
            ],
            isLatest: true,
          },
        },
      },
    });

    await prisma.review.create({
      data: {
        resourceType: "rule",
        resourceId: rule.id,
        ruleId: rule.id,
        rating: 5,
        content: "示例评测：规则结构清晰。",
        author: "种子用户",
        isHelpful: 1,
      },
    });
    await syncRuleReviewStats(rule.id);
  }

  console.log("Seeded rule categories:", RULE_CATEGORIES.length);
}
