import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowLeft, BarChart3, ShieldAlert } from "lucide-react";
import { getHubAnalytics } from "@/lib/hub-analytics";

export const dynamic = "force-dynamic";

export default async function ManifestAnalyticsPage() {
  const analytics = await getHubAnalytics();
  const topManifests = analytics.manifests.slice(0, 8);
  const topAssets = analytics.assets.slice(0, 10);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/manifests"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            返回 Manifest
          </Link>
          <h1 className="text-2xl font-semibold">运行效果分析</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            汇总 Manifest 安装记录、Runtime Event 运行事件和资产调用数据，评估方案包真实效果。
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={<BarChart3 className="size-4" />} label="安装项目" value={analytics.summary.installedProjects} />
        <Metric icon={<Activity className="size-4" />} label="运行次数" value={analytics.summary.runCount} />
        <Metric label="成功率" value={`${Math.round(analytics.summary.successRate * 100)}%`} />
        <Metric icon={<ShieldAlert className="size-4" />} label="高风险资产" value={analytics.summary.highRiskAssetCount} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-md border">
          <div className="border-b bg-muted px-4 py-3">
            <h2 className="text-sm font-semibold">Manifest 效果排行</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3">方案包</th>
                <th className="px-4 py-3">安装项目</th>
                <th className="px-4 py-3">运行</th>
                <th className="px-4 py-3">成功率</th>
                <th className="px-4 py-3">推荐</th>
              </tr>
            </thead>
            <tbody>
              {topManifests.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                    暂无运行数据
                  </td>
                </tr>
              ) : (
                topManifests.map((manifest) => (
                  <tr key={manifest.manifestId} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{manifest.displayName}</div>
                      <div className="font-mono text-xs text-muted-foreground">{manifest.manifestId}</div>
                    </td>
                    <td className="px-4 py-3">{manifest.installedProjects}</td>
                    <td className="px-4 py-3">{manifest.runCount}</td>
                    <td className="px-4 py-3">{Math.round(manifest.successRate * 100)}%</td>
                    <td className="px-4 py-3">{manifest.recommendationGrade}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border">
          <div className="border-b bg-muted px-4 py-3">
            <h2 className="text-sm font-semibold">治理提醒</h2>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <InfoLine label="失败方案包" value={analytics.governance.failingManifests.length} />
            <InfoLine label="高风险资产" value={analytics.governance.riskyAssets.length} />
            <InfoLine label="已发布未安装" value={analytics.governance.uninstalledPublishedManifests.length} />
            <div>
              <div className="mb-2 text-xs text-muted-foreground">常见失败原因</div>
              {analytics.governance.topFailureReasons.length === 0 ? (
                <div className="text-muted-foreground">暂无失败记录</div>
              ) : (
                <ul className="space-y-2">
                  {analytics.governance.topFailureReasons.map((item) => (
                    <li key={item.reason} className="flex justify-between gap-3">
                      <span>{item.reason}</span>
                      <span className="font-mono">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-md border">
        <div className="border-b bg-muted px-4 py-3">
          <h2 className="text-sm font-semibold">资产使用效果</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-4 py-3">资产</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">覆盖项目</th>
              <th className="px-4 py-3">运行</th>
              <th className="px-4 py-3">成功率</th>
              <th className="px-4 py-3">风险</th>
            </tr>
          </thead>
          <tbody>
            {topAssets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                  暂无资产数据
                </td>
              </tr>
            ) : (
              topAssets.map((asset) => (
                <tr key={`${asset.kind}:${asset.assetId}`} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{asset.displayName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{asset.assetId}</div>
                  </td>
                  <td className="px-4 py-3">{asset.kind}</td>
                  <td className="px-4 py-3">{asset.projectCoverage}</td>
                  <td className="px-4 py-3">{asset.runCount}</td>
                  <td className="px-4 py-3">{Math.round(asset.successRate * 100)}%</td>
                  <td className="px-4 py-3">{asset.riskLevel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}
