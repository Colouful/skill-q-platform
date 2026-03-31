import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { catalogPublishStatusLabel, stringArrayFromJson } from "@/lib/catalog";
import { AI_SPEC_PACKAGE_SPEC, buildAiSpecInitCommand, buildAiSpecSyncCommand } from "@/lib/ai-spec-cli";
import { formatDateTimeShanghai } from "@/lib/date-format";

export const dynamic = "force-dynamic";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
}

export default async function AdminInstallPresetsPage() {
  const origin = siteOrigin();
  const items = await prisma.scenarioPackage.findMany({
    include: {
      entryRole: true,
      roles: { select: { id: true } },
      skills: { select: { id: true } },
      rules: { select: { id: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          安装预设
        </h1>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          汇总场景方案对应的远程 Manifest、安装命令和项目接入入口，便于运营和联调。
        </p>
      </div>

      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 text-sm text-[var(--pixel-muted)]">
            暂无场景方案。
          </div>
        ) : (
          items.map((item) => {
            const profiles = stringArrayFromJson(item.supportedProfiles);
            const profile = profiles[0] ?? "default";
            const ides = stringArrayFromJson(item.recommendedIdes);
            const manifestUrl = `${origin}/api/manifests/scenarios/${encodeURIComponent(item.slug)}`;
            const installUrl = `/install?scenario=${encodeURIComponent(item.slug)}`;
            const localManifestFilename = `${item.slug}.manifest.json`;
            const initCommand = buildAiSpecInitCommand({ profile, ides });
            const syncCommand = buildAiSpecSyncCommand({ manifestRef: manifestUrl });
            const localSyncCommand = buildAiSpecSyncCommand({ manifestRef: `./${localManifestFilename}` });

            return (
              <section
                key={item.id}
                className="space-y-4 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
                      {item.name}
                    </p>
                    <p className="text-sm text-[var(--pixel-muted)]">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--pixel-muted)]">
                    <p>状态：{catalogPublishStatusLabel(item.publishStatus)}</p>
                    <p>入口专家：{item.entryRole?.name ?? "未设置"}</p>
                    <p>
                      专家 {item.roles.length} · Skill {item.skills.length} · Rule {item.rules.length}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-[var(--pixel-muted)]">
                  <span>标识（Slug）：{item.slug}</span>
                  <span>Profile：{profile}</span>
                  <span>
                    更新时间：{formatDateTimeShanghai(item.updatedAt)}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-[var(--pixel-muted)]">
                    当前 CLI 发布包：
                    {" "}
                    <code className="font-mono text-[var(--pixel-fg)]">{AI_SPEC_PACKAGE_SPEC}</code>
                  </p>
                  <div>
                    <p className="mb-2 text-sm text-[var(--pixel-fg)]">Manifest</p>
                    <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                      {manifestUrl}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-[var(--pixel-fg)]">10.1 初始化安装</p>
                    <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                      {initCommand}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-[var(--pixel-fg)]">10.2 增量同步</p>
                    <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                      {syncCommand}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-[var(--pixel-fg)]">10.3 本地 manifest 同步</p>
                    <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                      {localSyncCommand}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={installUrl}
                    className="inline-flex items-center justify-center border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-3 py-2 text-sm text-[var(--pixel-fg)]"
                  >
                    打开项目接入
                  </Link>
                  <a
                    href={manifestUrl}
                    className="inline-flex items-center justify-center border-2 border-[var(--pixel-border)] px-3 py-2 text-sm text-[var(--pixel-fg)]"
                  >
                    打开 Manifest
                  </a>
                  <Link
                    href={`/scenarios/${encodeURIComponent(item.slug)}`}
                    className="inline-flex items-center justify-center border-2 border-[var(--pixel-border)] px-3 py-2 text-sm text-[var(--pixel-fg)]"
                  >
                    打开方案详情
                  </Link>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
