import Link from "next/link";
import {
  getAdminRegistryOverview,
  type RegistryOverviewItem,
  type RegistryOverviewSection,
} from "@/lib/admin-registry-overview";

export const dynamic = "force-dynamic";

function statusClassName(status: RegistryOverviewItem["status"]) {
  switch (status) {
    case "ready":
      return "border-[#3a6b2e] bg-[#d7f6c7] text-[#234818]";
    case "mismatch":
      return "border-[var(--pixel-border)] bg-[var(--pixel-red)]/20 text-[var(--pixel-fg)]";
    default:
      return "border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/30 text-[var(--pixel-fg)]";
  }
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3">
      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">{value}</p>
    </div>
  );
}

function RegistrySection({ section }: { section: RegistryOverviewSection }) {
  return (
    <section className="space-y-4 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4">
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-pixel-heading)] text-base text-[var(--pixel-fg)]">
          {section.label}
        </h2>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          这里只看协议治理状态，不直接承担编辑。点击资源名称会回到对应管理入口。
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="总数" value={section.summary.total} />
        <SummaryCard label="已补 registryId" value={section.summary.hasRegistryId} />
        <SummaryCard label="已补 manifestId" value={section.summary.hasManifestId} />
        <SummaryCard label="已补齐" value={section.summary.canonicalReady} />
        <SummaryCard label="缺字段" value={section.summary.missingRegistryId + section.summary.missingManifestId} />
        <SummaryCard label="不一致" value={section.summary.mismatch} />
      </div>

      <div className="overflow-x-auto border-2 border-[var(--pixel-border)]">
        <table className="min-w-full border-collapse font-[family-name:var(--font-pixel-body)] text-sm">
          <thead className="bg-[var(--pixel-cyan)]/20 text-left">
            <tr>
              <th className="border-b-2 border-[var(--pixel-border)] px-3 py-2">名称</th>
              <th className="border-b-2 border-[var(--pixel-border)] px-3 py-2">slug</th>
              <th className="border-b-2 border-[var(--pixel-border)] px-3 py-2">registryId</th>
              <th className="border-b-2 border-[var(--pixel-border)] px-3 py-2">manifestId</th>
              <th className="border-b-2 border-[var(--pixel-border)] px-3 py-2">supportedProfiles</th>
              <th className="w-40 min-w-40 border-b-2 border-[var(--pixel-border)] px-3 py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.id} className="align-top odd:bg-[#fffef8] even:bg-[var(--pixel-yellow)]/10">
                <td className="border-b border-[var(--pixel-border)] px-3 py-2">
                  <Link href={item.editHref} className="underline decoration-dotted underline-offset-2">
                    {item.name}
                  </Link>
                </td>
                <td className="border-b border-[var(--pixel-border)] px-3 py-2">{item.slug}</td>
                <td className="border-b border-[var(--pixel-border)] px-3 py-2">
                  {item.registryId || <span className="text-[var(--pixel-accent)]">未设置</span>}
                </td>
                <td className="border-b border-[var(--pixel-border)] px-3 py-2">
                  {item.manifestId || <span className="text-[var(--pixel-accent)]">未设置</span>}
                </td>
                <td className="border-b border-[var(--pixel-border)] px-3 py-2">
                  {item.supportedProfiles.length > 0 ? item.supportedProfiles.join(", ") : "全部"}
                </td>
                <td className="w-40 min-w-40 border-b border-[var(--pixel-border)] px-3 py-2">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-sm border px-2 py-1 text-xs ${statusClassName(item.status)}`}
                  >
                    {item.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminRegistryOverviewPage() {
  const overview = await getAdminRegistryOverview();
  const sections = [overview.skills, overview.rules, overview.roles];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          注册表总览
        </h1>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          统一查看 Skill / Rule / Role 当前的协议完整度，帮助我们快速定位哪些资源还没稳定进入导出和安装契约。
        </p>
      </div>

      {sections.map((section) => (
        <RegistrySection key={section.resourceType} section={section} />
      ))}
    </div>
  );
}
