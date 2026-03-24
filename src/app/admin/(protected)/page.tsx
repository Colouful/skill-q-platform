import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import {
  getAnalyticsHighlights,
  getAnalyticsOverview,
  getAnalyticsTrends,
} from "@/lib/admin-analytics-queries";
import { AdminDashboardCharts } from "@/components/admin/AdminDashboardCharts";
import { AdminDashboardHighlights } from "@/components/admin/AdminDashboardHighlights";
import { AdminDashboardRefreshBar } from "@/components/admin/AdminDashboardRefreshBar";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [skillN, ruleN, overview, trends, highlights] = await Promise.all([
    prisma.skill.count({ where: { moderationStatus: MODERATION_STATUS.PENDING } }),
    prisma.rule.count({ where: { moderationStatus: MODERATION_STATUS.PENDING } }),
    getAnalyticsOverview(),
    getAnalyticsTrends("7d"),
    getAnalyticsHighlights(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        概览
      </h1>

      <AdminDashboardRefreshBar />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3">
          <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
            待审 Skill
          </p>
          <p className="font-[family-name:var(--font-pixel-heading)] text-2xl text-[var(--pixel-accent)]">
            {skillN}
          </p>
          <Link
            href="/admin/skills"
            className="mt-2 inline-block font-[family-name:var(--font-pixel-body)] text-xs underline"
          >
            去处理
          </Link>
        </div>
        <div className="border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3">
          <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
            待审 Rule
          </p>
          <p className="font-[family-name:var(--font-pixel-heading)] text-2xl text-[var(--rule-accent)]">
            {ruleN}
          </p>
          <Link
            href="/admin/rules"
            className="mt-2 inline-block font-[family-name:var(--font-pixel-body)] text-xs underline"
          >
            去处理
          </Link>
        </div>
      </div>

      <AdminDashboardCharts overview={overview} trends={trends} />

      <AdminDashboardHighlights data={highlights} />

      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        更细维度见接口：GET /api/admin/analytics/overview、trends、categories、highlights
      </p>
    </div>
  );
}
