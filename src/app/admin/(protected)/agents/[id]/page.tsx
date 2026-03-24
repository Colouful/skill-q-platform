import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminAgentToolbar } from "@/components/admin/AdminAgentToolbar";

export const dynamic = "force-dynamic";

export default async function AdminAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      _count: { select: { uploadedSkills: true, uploadedRules: true, apiKeys: true } },
      apiKeys: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          isRevoked: true,
          rateLimit: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!agent) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/agents"
          className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)] underline"
        >
          ← 返回列表
        </Link>
      </div>
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        {agent.name}
      </h1>
      <AdminAgentToolbar agentId={agent.id} isActive={agent.isActive} />

      <div className="grid gap-3 border-4 border-[var(--pixel-border)] p-4 font-[family-name:var(--font-pixel-body)] text-sm sm:grid-cols-2">
        <p>
          <span className="text-[var(--pixel-muted)]">Slug：</span>
          {agent.slug}
        </p>
        <p>
          <span className="text-[var(--pixel-muted)]">类型：</span>
          {agent.agentType}
        </p>
        <p>
          <span className="text-[var(--pixel-muted)]">等级：</span>
          Lv.{agent.level} {agent.levelName}
        </p>
        <p>
          <span className="text-[var(--pixel-muted)]">状态：</span>
          {agent.isActive ? "正常" : "已封禁"}
        </p>
        <p>
          <span className="text-[var(--pixel-muted)]">注册时间：</span>
          {agent.registeredAt.toISOString()}
        </p>
        <p>
          <span className="text-[var(--pixel-muted)]">最近活跃：</span>
          {agent.lastActiveAt ? agent.lastActiveAt.toISOString() : "—"}
        </p>
        <p>
          <span className="text-[var(--pixel-muted)]">上传 Skill / Rule：</span>
          {agent._count.uploadedSkills} / {agent._count.uploadedRules}
        </p>
        <p>
          <span className="text-[var(--pixel-muted)]">API 调用 / 下载：</span>
          {agent.apiCallsTotal} / {agent.downloadsCount}
        </p>
      </div>

      <div>
        <h2 className="mb-2 font-[family-name:var(--font-pixel-heading)] text-sm">API Keys（前缀预览）</h2>
        <div className="overflow-x-auto border-4 border-[var(--pixel-border)]">
          <table className="w-full border-collapse text-left font-[family-name:var(--font-pixel-body)] text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--pixel-border)] bg-black/5">
                <th className="p-2">名称</th>
                <th className="p-2">前缀</th>
                <th className="p-2">状态</th>
                <th className="p-2">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {agent.apiKeys.map((k) => (
                <tr key={k.id} className="border-b border-[var(--pixel-border)]/40">
                  <td className="p-2">{k.name}</td>
                  <td className="p-2 text-[var(--pixel-muted)]">{k.keyPrefix}</td>
                  <td className="p-2">{k.isRevoked ? "已撤销" : "有效"}</td>
                  <td className="p-2">{k.createdAt.toISOString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
