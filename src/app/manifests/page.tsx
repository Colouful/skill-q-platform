import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function loadManifests() {
  try {
    return await (prisma as any).hubManifest.findMany({
      include: { assets: true, versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  } catch {
    return [];
  }
}

export default async function ManifestsPage() {
  const manifests = await loadManifests();

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manifest 方案包</h1>
          <p className="mt-2 text-sm text-muted-foreground">创建、发布并导出可被 br-ai-spec 安装的团队级方案包。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/manifests/analytics"
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-all hover:bg-muted"
          >
            <BarChart3 className="size-4" />
            运行分析
          </Link>
          <Link
            href="/manifests/new"
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            <Plus className="size-4" />
            新建 Manifest
          </Link>
        </div>
      </div>

      {manifests.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">暂无数据</div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">Manifest ID</th>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">资产数</th>
                <th className="px-4 py-3">最新版本</th>
                <th className="px-4 py-3">安装命令</th>
              </tr>
            </thead>
            <tbody>
              {manifests.map((manifest: any) => (
                <tr key={manifest.id} className="border-t">
                  <td className="px-4 py-3 font-mono">{manifest.manifestId}</td>
                  <td className="px-4 py-3">{manifest.displayName}</td>
                  <td className="px-4 py-3">{statusLabel(manifest.status)}</td>
                  <td className="px-4 py-3">{manifest.assets.length}</td>
                  <td className="px-4 py-3">{manifest.versions[0]?.version || "未发布"}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    npx @ex/ai-spec-auto hub install {manifest.manifestId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "草稿",
    submitted: "待审核",
    approved: "已审核",
    published: "已发布",
    deprecated: "已弃用",
    archived: "已归档",
  };
  return labels[status] || status;
}
