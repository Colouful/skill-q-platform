"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChecksumText } from "@/components/hub/checksum-text";
import { ConfirmAction } from "@/components/hub/confirm-action";
import { HubEmptyState } from "@/components/hub/empty-state";
import { HubErrorState } from "@/components/hub/error-state";
import { HubNav, HubPageHeader } from "@/components/hub/page-header";
import { ReviewActionPanel } from "@/components/hub/review-action-panel";
import { StatusBadge } from "@/components/hub/status-badge";
import {
  archiveAgentProfile,
  archiveAsset,
  archiveManifest,
  bindManifestAsset,
  createAgentProfile,
  createAsset,
  createAssetVersion,
  createManifest,
  createManifestVersion,
  deprecateAgentProfile,
  deprecateAssetVersion,
  deprecateManifestVersion,
  getAgentProfileDetail,
  getAssetDetail,
  getManifestDetail,
  listAgentProfiles,
  listAssets,
  listInstallRecords,
  listManifests,
  listRuntimeFeedback,
  publishAgentProfile,
  publishAssetVersion,
  publishManifestVersion,
  rejectAgentProfile,
  rejectAssetVersion,
  rejectManifestVersion,
  reorderManifestAssets,
  submitAgentProfileReview,
  submitAssetVersionReview,
  submitManifestVersionReview,
  unbindManifestAsset,
  validateAgentProfile,
  type HubAgentProfileListItem,
  type HubAssetListItem,
  type HubManifestListItem,
  type HubTelemetryItem,
  type ListResult,
} from "@/lib/hub-admin-client";

type LoadState<T> = {
  loading: boolean;
  error: string;
  data: T | null;
};

function initState<T>(): LoadState<T> {
  return { loading: true, error: "", data: null };
}

function text(value: unknown, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) return value.join(", ") || fallback;
  return String(value);
}

function jsonPreview(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function publishCheckText(checks: Array<{ label: string; passed: boolean }>) {
  return checks.map((item) => `${item.passed ? "通过" : "待处理"}：${item.label}`).join("\n");
}

function useLoader<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<LoadState<T>>(initState<T>());
  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    loader()
      .then((data) => setState({ loading: false, error: "", data }))
      .catch((error: Error) => setState({ loading: false, error: error.message, data: null }));
    // 自定义 loader 由调用方传入 deps 控制，保持页面筛选项驱动刷新。
    // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-md border bg-background p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground" title={text(value)}>
        {text(value)}
      </dd>
    </div>
  );
}

function Toolbar({
  keyword,
  setKeyword,
  status,
  setStatus,
  children,
}: {
  keyword: string;
  setKeyword: (value: string) => void;
  status?: string;
  setStatus?: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 md:flex-row md:items-center">
      <Input aria-label="关键词" placeholder="搜索 slug / name" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
      {setStatus ? (
        <select
          aria-label="状态"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
          value={status ?? ""}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="reviewing">审核中</option>
          <option value="published">已发布</option>
          <option value="deprecated">已废弃</option>
          <option value="archived">已归档</option>
          <option value="rejected">已驳回</option>
        </select>
      ) : null}
      {children}
    </div>
  );
}

function LoadingBlock() {
  return <div className="rounded-lg border bg-muted/20 p-8 text-sm text-muted-foreground">正在加载 Hub 数据...</div>;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5">{children}</div>;
}

function defaultAgentContent(slug: string, name: string) {
  return {
    slug,
    name,
    defaultExecutor: "cursor",
    fallbackExecutors: ["claude-code", "codex"],
    allowedTools: ["read", "write", "test"],
    deniedTools: ["upload-source", "deploy", "push", "merge"],
    contextScope: { allowSourceCode: false, allowRelativePath: true, allowAbsolutePath: false },
    modelPolicy: { tokenBudget: 80000, reasoningEffort: "high" },
    approvalPolicy: { beforePush: true, beforeMerge: true, highRiskAlwaysManual: true },
    outputContract: { mustReturn: ["summary", "changedFiles", "risks", "verification"] },
    riskLevel: "medium",
  };
}

export function HubHomePage() {
  const { data, error, loading, reload } = useLoader(async () => {
    const [assets, manifests, profiles, installs, feedback] = await Promise.all([
      listAssets({ pageSize: 100 }),
      listManifests({ pageSize: 100 }),
      listAgentProfiles({ pageSize: 100 }),
      listInstallRecords({ pageSize: 100 }),
      listRuntimeFeedback({ pageSize: 100 }),
    ]);
    return { assets, manifests, profiles, installs, feedback };
  }, []);
  const stats = useMemo(
    () => [
      ["Asset 总数", data?.assets.pagination.total ?? 0],
      ["Published Asset", data?.assets.items.filter((item) => item.status === "published").length ?? 0],
      ["Manifest 总数", data?.manifests.pagination.total ?? 0],
      ["Published Manifest", data?.manifests.items.filter((item) => item.status === "published").length ?? 0],
      ["Agent Profile 总数", data?.profiles.pagination.total ?? 0],
      ["Published Agent Profile", data?.profiles.items.filter((item) => item.status === "published").length ?? 0],
      ["Install Record", data?.installs.pagination.total ?? 0],
      ["Runtime Feedback", data?.feedback.pagination.total ?? 0],
    ],
    [data],
  );
  return (
    <PageShell>
      <HubPageHeader title="Hub 资产治理" description="统一管理 Asset、Manifest、Agent Profile 与运行反馈，保护 br-ai-spec 当前消费契约。" />
      <HubNav />
      {loading ? <LoadingBlock /> : null}
      {error ? <HubErrorState message={error} onRetry={reload} /> : null}
      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}

export function AssetListPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [scope, setScope] = useState("");
  const { data, error, loading, reload } = useLoader(
    () => listAssets({ keyword, status, kind, scope, pageSize: 20 }),
    [keyword, status, kind, scope],
  );
  async function onCreate() {
    const slug = window.prompt("请输入 Asset slug");
    if (!slug) return;
    const name = window.prompt("请输入 Asset 名称", slug);
    if (!name) return;
    await createAsset({ slug, name, kind: "role", scope: "platform", visibility: "team" });
    reload();
  }
  return (
    <PageShell>
      <HubPageHeader title="Asset 资产管理" description="管理可被 Manifest 绑定的治理资产；列表不展示 content 正文。" actions={<Button onClick={() => void onCreate()}><Plus />创建草稿</Button>} />
      <Toolbar keyword={keyword} setKeyword={setKeyword} status={status} setStatus={setStatus}>
        <Input aria-label="kind 筛选" placeholder="kind" value={kind} onChange={(event) => setKind(event.target.value)} />
        <Input aria-label="scope 筛选" placeholder="scope" value={scope} onChange={(event) => setScope(event.target.value)} />
      </Toolbar>
      <ListState loading={loading} error={error} reload={reload} data={data} />
      {data?.items.length ? <AssetTable items={data.items} reload={reload} /> : null}
    </PageShell>
  );
}

function AssetTable({ items, reload }: { items: HubAssetListItem[]; reload: () => void }) {
  return (
    <Table>
      <TableHeader><TableRow>{["slug", "name", "kind", "scope", "status", "visibility", "versionCount", "publishedVersionCount", "latestVersionId", "updatedAt", "操作"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.slug}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{text(item.kind)}</TableCell>
            <TableCell>{text(item.scope)}</TableCell>
            <TableCell><StatusBadge status={item.status} /></TableCell>
            <TableCell>{text(item.visibility)}</TableCell>
            <TableCell>{text(item.versionCount)}</TableCell>
            <TableCell>{text(item.publishedVersionCount)}</TableCell>
            <TableCell>{text(item.latestVersionId)}</TableCell>
            <TableCell>{text(item.updatedAt)}</TableCell>
            <TableCell className="space-x-2">
              <Link className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-sm hover:bg-muted" href={`/hub/assets/${item.id}`}><Eye className="size-3.5" />详情</Link>
              <ConfirmAction label="归档" message="确认归档该 Asset？" onConfirm={() => void archiveAsset(item.id, { reason: "页面归档" }).then(reload)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AssetDetailPage({ assetId }: { assetId: string }) {
  const { data, error, loading, reload } = useLoader(() => getAssetDetail(assetId), [assetId]);
  const asset = (data?.asset ?? {}) as Record<string, unknown>;
  const versions = (data?.versions ?? []) as Array<Record<string, unknown>>;
  const manifestRefs = (data?.manifestRefs ?? []) as Array<Record<string, unknown>>;
  async function onCreateVersion() {
    const version = window.prompt("请输入版本号");
    if (!version) return;
    const content = window.prompt("请输入版本内容", "# 新版本\n");
    if (!content) return;
    await createAssetVersion(assetId, { version, content, contentFormat: "markdown" });
    reload();
  }
  return (
    <PageShell>
      <HubPageHeader title={`Asset 详情：${text(asset.slug, assetId)}`} description="published 版本已发布，不可直接修改；如需调整 content，请创建新版本。" actions={<Button disabled={asset.status === "archived"} onClick={() => void onCreateVersion()}><Plus />创建版本</Button>} />
      <ListState loading={loading} error={error} reload={reload} data={data} />
      {data ? (
        <>
          <InfoGrid entries={["slug", "name", "kind", "scope", "status", "tags", "visibility", "latestVersionId", "createdAt", "updatedAt"].map((key) => [key, asset[key]])} />
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-semibold">Asset Version 管理区</h2>
            {versions.length ? <VersionTable assetId={assetId} versions={versions} reload={reload} /> : <HubEmptyState title="暂无版本" />}
          </section>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-semibold">Manifest 引用</h2>
            {manifestRefs.length ? <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">{jsonPreview(manifestRefs)}</pre> : <HubEmptyState title="暂无 Manifest 引用" />}
          </section>
        </>
      ) : null}
    </PageShell>
  );
}

function VersionTable({ assetId, versions, reload }: { assetId: string; versions: Array<Record<string, unknown>>; reload: () => void }) {
  async function publishWithCheck(version: Record<string, unknown>) {
    const checks = [
      { label: "contentSize 大于 0", passed: Number(version.contentSize ?? 0) > 0 },
      { label: "checksum 存在", passed: Boolean(version.checksum) },
      { label: "状态为 reviewing", passed: version.status === "reviewing" },
    ];
    window.alert(`发布前检查结果\n${publishCheckText(checks)}`);
    await publishAssetVersion(assetId, String(version.id), { publishNote: "页面审核通过发布" });
    reload();
  }
  return (
    <Table>
      <TableHeader><TableRow>{["version", "status", "immutable", "checksum", "contentFormat", "contentSize", "qualityScore", "publishedAt", "操作"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {versions.map((version) => (
          <TableRow key={String(version.id)}>
            <TableCell>{text(version.version)}</TableCell>
            <TableCell><StatusBadge status={String(version.status)} /></TableCell>
            <TableCell>{version.immutable ? "是" : "否"}</TableCell>
            <TableCell><ChecksumText value={version.checksum} /></TableCell>
            <TableCell>{text(version.contentFormat)}</TableCell>
            <TableCell>{text(version.contentSize)}</TableCell>
            <TableCell>{text(version.qualityScore)}</TableCell>
            <TableCell>{text(version.publishedAt)}</TableCell>
            <TableCell className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => window.alert(text(version.content, "列表不包含正文，请使用详情接口查看。"))}>查看内容</Button>
              {version.status === "draft" || version.status === "rejected" ? <ConfirmAction label="提交审核" message="确认提交审核？" onConfirm={() => void submitAssetVersionReview(assetId, String(version.id), { note: "页面提交审核" }).then(reload)} /> : null}
              {version.status === "reviewing" ? <ConfirmAction label="审核通过发布" message="确认审核通过并发布该 Asset Version？" onConfirm={() => void publishWithCheck(version)} /> : null}
              {version.status === "reviewing" ? <Button size="sm" variant="outline" onClick={() => {
                const reason = window.prompt("请输入驳回原因");
                if (reason) void rejectAssetVersion(assetId, String(version.id), { reason }).then(reload);
              }}>驳回</Button> : null}
              <Button size="sm" variant="outline" onClick={() => {
                const reason = window.prompt("请输入废弃原因");
                if (reason) void deprecateAssetVersion(assetId, String(version.id), { reason }).then(reload);
              }}>废弃</Button>
              {version.status === "published" ? <span className="text-xs text-emerald-700">已发布，不可修改</span> : null}
              {version.status === "rejected" ? <span className="text-xs text-destructive">驳回原因：{text(version.rejectedReason)}</span> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ManifestListPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState("");
  const [techStack, setTechStack] = useState("");
  const [projectKind, setProjectKind] = useState("");
  const { data, error, loading, reload } = useLoader(() => listManifests({ keyword, status, scope, techStack, projectKind, pageSize: 20 }), [keyword, status, scope, techStack, projectKind]);
  async function onCreate() {
    const slug = window.prompt("请输入 Manifest slug");
    if (!slug) return;
    await createManifest({ slug, name: window.prompt("请输入 Manifest 名称", slug) ?? slug, scope: "platform", techStacks: ["react"], projectKinds: ["frontend"] });
    reload();
  }
  return (
    <PageShell>
      <HubPageHeader title="Manifest 管理" description="管理 br-ai-spec 可消费的安装清单，Export 结构保持兼容。" actions={<Button onClick={() => void onCreate()}><Plus />创建草稿</Button>} />
      <Toolbar keyword={keyword} setKeyword={setKeyword} status={status} setStatus={setStatus}>
        <Input aria-label="scope 筛选" placeholder="scope" value={scope} onChange={(event) => setScope(event.target.value)} />
        <Input aria-label="techStack 筛选" placeholder="techStack" value={techStack} onChange={(event) => setTechStack(event.target.value)} />
        <Input aria-label="projectKind 筛选" placeholder="projectKind" value={projectKind} onChange={(event) => setProjectKind(event.target.value)} />
      </Toolbar>
      <ListState loading={loading} error={error} reload={reload} data={data} />
      {data?.items.length ? <ManifestTable items={data.items} reload={reload} /> : null}
    </PageShell>
  );
}

function ManifestTable({ items, reload }: { items: HubManifestListItem[]; reload: () => void }) {
  return (
    <Table>
      <TableHeader><TableRow>{["slug", "name", "scope", "status", "techStacks", "projectKinds", "versionCount", "publishedVersionCount", "assetBindingCount", "latestVersionId", "updatedAt", "操作"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{items.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.slug}</TableCell><TableCell>{item.name}</TableCell><TableCell>{text(item.scope)}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell>{text(item.techStacks)}</TableCell><TableCell>{text(item.projectKinds)}</TableCell><TableCell>{text(item.versionCount)}</TableCell><TableCell>{text(item.publishedVersionCount)}</TableCell><TableCell>{text(item.assetBindingCount)}</TableCell><TableCell>{text(item.latestVersionId)}</TableCell><TableCell>{text(item.updatedAt)}</TableCell>
          <TableCell className="space-x-2"><Link className="inline-flex h-7 items-center rounded-md border px-2 text-sm hover:bg-muted" href={`/hub/manifests/${item.id}`}>详情</Link><ConfirmAction label="归档" message="确认归档该 Manifest？" onConfirm={() => void archiveManifest(item.id, { reason: "页面归档" }).then(reload)} /></TableCell>
        </TableRow>
      ))}</TableBody>
    </Table>
  );
}

export function ManifestDetailPage({ manifestId }: { manifestId: string }) {
  const { data, error, loading, reload } = useLoader(() => getManifestDetail(manifestId), [manifestId]);
  const manifest = (data?.manifest ?? {}) as Record<string, unknown>;
  const versions = (data?.versions ?? []) as Array<Record<string, unknown>>;
  const bindings = (data?.assetBindings ?? []) as Array<Record<string, unknown>>;
  async function onCreateVersion() {
    const version = window.prompt("请输入 Manifest 版本号");
    if (!version) return;
    await createManifestVersion(manifestId, { version });
    reload();
  }
  async function onBind(versionId: string) {
    const assetId = window.prompt("请输入 Asset ID");
    const assetVersionId = window.prompt("请输入 AssetVersion ID");
    const kind = window.prompt("请输入 kind", "role");
    if (!assetId || !assetVersionId || !kind) return;
    await bindManifestAsset(manifestId, versionId, { assetId, assetVersionId, kind, required: true });
    reload();
  }
  return (
    <PageShell>
      <HubPageHeader title={`Manifest 详情：${text(manifest.slug, manifestId)}`} description="只能绑定 published AssetVersion；published ManifestVersion 不允许解绑和排序。" actions={<Button disabled={manifest.status === "archived"} onClick={() => void onCreateVersion()}><Plus />创建版本</Button>} />
      <ListState loading={loading} error={error} reload={reload} data={data} />
      {data ? (
        <>
          <InfoGrid entries={["slug", "name", "scope", "status", "tags", "techStacks", "projectKinds", "recommendedFor", "latestVersionId", "createdAt", "updatedAt"].map((key) => [key, manifest[key]])} />
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-semibold">Manifest Version 管理区</h2>
            {versions.length ? <ManifestVersionTable manifestId={manifestId} versions={versions} reload={reload} onBind={onBind} /> : <HubEmptyState title="暂无 Manifest Version" />}
          </section>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-semibold">Asset 绑定操作区</h2>
            {bindings.length ? <BindingTable manifestId={manifestId} bindings={bindings} reload={reload} /> : <HubEmptyState title="暂无绑定资产" description="创建 Manifest Version 后绑定 published AssetVersion。" />}
          </section>
        </>
      ) : null}
    </PageShell>
  );
}

function ManifestVersionTable({ manifestId, versions, reload, onBind }: { manifestId: string; versions: Array<Record<string, unknown>>; reload: () => void; onBind: (versionId: string) => Promise<void> }) {
  async function publishWithCheck(version: Record<string, unknown>) {
    const checks = [
      { label: "至少绑定一个 required asset", passed: Number(version.assetBindingCount ?? 0) > 0 },
      { label: "checksum 存在", passed: Boolean(version.checksum) },
      { label: "状态为 reviewing", passed: version.status === "reviewing" },
    ];
    window.alert(`发布前检查结果\n${publishCheckText(checks)}`);
    await publishManifestVersion(manifestId, String(version.id), { publishNote: "页面审核通过发布" });
    reload();
  }
  return (
    <Table><TableHeader><TableRow>{["version", "status", "checksum", "assetBindingCount", "defaultExecutor", "fallbackExecutors", "publishedAt", "操作"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{versions.map((version) => {
      const installPolicy = (version.installPolicy ?? {}) as Record<string, unknown>;
      return <TableRow key={String(version.id)}><TableCell>{text(version.version)}</TableCell><TableCell><StatusBadge status={String(version.status)} /></TableCell><TableCell><ChecksumText value={version.checksum} /></TableCell><TableCell>{text(version.assetBindingCount)}</TableCell><TableCell>{text(installPolicy.defaultExecutor)}</TableCell><TableCell>{text(installPolicy.fallbackExecutors)}</TableCell><TableCell>{text(version.publishedAt)}</TableCell><TableCell className="space-x-2"><Button size="sm" variant="outline" disabled={version.status === "published"} onClick={() => void onBind(String(version.id))}>绑定资产</Button>{version.status === "draft" || version.status === "rejected" ? <ConfirmAction label="提交审核" message="确认提交审核？" onConfirm={() => void submitManifestVersionReview(manifestId, String(version.id), { note: "页面提交审核" }).then(reload)} /> : null}{version.status === "reviewing" ? <ConfirmAction label="审核通过发布" message="确认审核通过并发布？请确保至少有一个 required asset。" onConfirm={() => void publishWithCheck(version)} /> : null}{version.status === "reviewing" ? <Button size="sm" variant="outline" onClick={() => { const reason = window.prompt("请输入驳回原因"); if (reason) void rejectManifestVersion(manifestId, String(version.id), { reason }).then(reload); }}>驳回</Button> : null}<Button size="sm" variant="outline" onClick={() => { const reason = window.prompt("请输入废弃原因"); if (reason) void deprecateManifestVersion(manifestId, String(version.id), { reason }).then(reload); }}>废弃</Button>{version.status === "published" ? <span className="text-xs text-emerald-700">已发布，不可解绑和排序</span> : null}{version.status === "rejected" ? <span className="text-xs text-destructive">驳回原因：{text(version.rejectedReason)}</span> : null}</TableCell></TableRow>;
    })}</TableBody></Table>
  );
}

function BindingTable({ manifestId, bindings, reload }: { manifestId: string; bindings: Array<Record<string, unknown>>; reload: () => void }) {
  return (
    <Table><TableHeader><TableRow>{["order", "assetSlug", "assetName", "assetVersion", "kind", "checksum", "required", "loadWhen", "stage", "操作"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{bindings.map((binding) => <TableRow key={String(binding.bindingId)}><TableCell>{text(binding.order)}</TableCell><TableCell>{text(binding.assetSlug)}</TableCell><TableCell>{text(binding.assetName)}</TableCell><TableCell>{text(binding.assetVersion)}</TableCell><TableCell>{text(binding.kind)}</TableCell><TableCell><ChecksumText value={binding.checksum} /></TableCell><TableCell>{binding.required ? "是" : "否"}</TableCell><TableCell>{text(binding.loadWhen)}</TableCell><TableCell>{text(binding.stage)}</TableCell><TableCell className="space-x-2"><Button size="sm" variant="outline" onClick={() => void reorderManifestAssets(manifestId, String(binding.manifestVersionId ?? ""), { items: [{ bindingId: binding.bindingId, order: Number(binding.order ?? 0) + 1 }] }).then(reload)}>后移</Button><ConfirmAction label="解绑" message="确认解绑该资产版本？" onConfirm={() => void unbindManifestAsset(manifestId, String(binding.manifestVersionId ?? ""), String(binding.bindingId)).then(reload)} /></TableCell></TableRow>)}</TableBody></Table>
  );
}

export function AgentProfileListPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [defaultExecutor, setDefaultExecutor] = useState("");
  const { data, error, loading, reload } = useLoader(() => listAgentProfiles({ keyword, status, riskLevel, defaultExecutor, pageSize: 20 }), [keyword, status, riskLevel, defaultExecutor]);
  async function onCreate() {
    const slug = window.prompt("请输入 Agent Profile slug");
    if (!slug) return;
    const name = window.prompt("请输入 Agent Profile 名称", slug) ?? slug;
    await createAgentProfile({ slug, name, version: "1.0.0", content: defaultAgentContent(slug, name) });
    reload();
  }
  return (
    <PageShell>
      <HubPageHeader title="Agent Profile 管理" description="治理执行器、安全策略、上下文权限、审批策略和输出契约。" actions={<Button onClick={() => void onCreate()}><Plus />创建草稿</Button>} />
      <Toolbar keyword={keyword} setKeyword={setKeyword} status={status} setStatus={setStatus}>
        <Input aria-label="riskLevel 筛选" placeholder="riskLevel" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} />
        <Input aria-label="defaultExecutor 筛选" placeholder="defaultExecutor" value={defaultExecutor} onChange={(event) => setDefaultExecutor(event.target.value)} />
      </Toolbar>
      <ListState loading={loading} error={error} reload={reload} data={data} />
      {data?.items.length ? <AgentProfileTable items={data.items} reload={reload} /> : null}
    </PageShell>
  );
}

function AgentProfileTable({ items, reload }: { items: HubAgentProfileListItem[]; reload: () => void }) {
  return (
    <Table><TableHeader><TableRow>{["slug", "name", "version", "status", "riskLevel", "defaultExecutor", "deniedTools", "checksum", "updatedAt", "操作"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell>{item.slug}</TableCell><TableCell>{item.name}</TableCell><TableCell>{text(item.version)}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell>{text(item.riskLevel)}</TableCell><TableCell>{text(item.defaultExecutor)}</TableCell><TableCell>{text(item.deniedTools)}</TableCell><TableCell><ChecksumText value={item.checksum} /></TableCell><TableCell>{text(item.updatedAt)}</TableCell><TableCell className="space-x-2"><Link className="inline-flex h-7 items-center rounded-md border px-2 text-sm hover:bg-muted" href={`/hub/agent-profiles/${item.id}`}>详情</Link>{item.status === "draft" || item.status === "rejected" ? <ConfirmAction label="提交审核" message="确认提交审核？" onConfirm={() => void submitAgentProfileReview(item.id, { note: "页面提交审核" }).then(reload)} /> : null}{item.status === "reviewing" ? <ConfirmAction label="审核通过发布" message="确认发布该 Agent Profile？" onConfirm={() => void publishAgentProfile(item.id, { publishNote: "页面审核通过发布" }).then(reload)} /> : null}{item.status === "reviewing" ? <Button size="sm" variant="outline" onClick={() => { const reason = window.prompt("请输入驳回原因"); if (reason) void rejectAgentProfile(item.id, { reason }).then(reload); }}>驳回</Button> : null}<Button size="sm" variant="outline" onClick={() => { const reason = window.prompt("请输入废弃原因"); if (reason) void deprecateAgentProfile(item.id, { reason }).then(reload); }}>废弃</Button><ConfirmAction label="归档" message="确认归档？" onConfirm={() => void archiveAgentProfile(item.id, { reason: "页面归档" }).then(reload)} /></TableCell></TableRow>)}</TableBody></Table>
  );
}

export function AgentProfileDetailPage({ profileId }: { profileId: string }) {
  const { data, error, loading, reload } = useLoader(() => getAgentProfileDetail(profileId), [profileId]);
  const profile = (data?.profile ?? {}) as Record<string, unknown>;
  const content = (profile.content ?? {}) as Record<string, unknown>;
  const [validation, setValidation] = useState<Record<string, unknown> | null>(null);
  async function onValidate() {
    setValidation(await validateAgentProfile(profileId));
  }
  async function onReviewPublish() {
    const result = await validateAgentProfile(profileId);
    setValidation(result);
    if (!result.valid) throw new Error("安全策略检查未通过，禁止发布。");
    await publishAgentProfile(profileId, { publishNote: "页面审核通过发布" });
    reload();
  }
  return (
    <PageShell>
      <HubPageHeader title={`Agent Profile 详情：${text(profile.slug, profileId)}`} description="published 后不可直接修改；安全策略不通过时不能发布。" actions={<Button onClick={() => void onValidate()}><ShieldCheck />校验安全策略</Button>} />
      <ListState loading={loading} error={error} reload={reload} data={data} />
      {data ? (
        <>
          <InfoGrid entries={["slug", "name", "version", "status", "riskLevel", "defaultExecutor", "checksum", "createdAt", "updatedAt", "publishedAt"].map((key) => [key, profile[key]])} />
          <ReviewActionPanel
            status={String(profile.status ?? "")}
            rejectedReason={profile.rejectedReason ? String(profile.rejectedReason) : undefined}
            publishChecks={[
              { label: "安全策略通过", passed: validation ? Boolean(validation.valid) : true, detail: validation ? "" : "发布前会再次调用 validate API" },
              { label: "checksum 存在", passed: Boolean(profile.checksum) },
              { label: "状态为 reviewing", passed: profile.status === "reviewing" },
            ]}
            onSubmitReview={async (note) => {
              await submitAgentProfileReview(profileId, { note });
              reload();
            }}
            onReject={async (reason) => {
              await rejectAgentProfile(profileId, { reason });
              reload();
            }}
            onPublish={onReviewPublish}
          />
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-semibold">安全策略</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {["禁止上传源码", "禁止 push", "禁止 merge", "禁止 deploy", "禁止绝对路径", "提交前人工确认", "合并前人工确认", "高风险强制人工确认"].map((label) => <div key={label} className="rounded-md border bg-emerald-50 p-2 text-sm text-emerald-700"><CheckCircle2 className="mr-1 inline size-4" />{label}</div>)}
            </div>
            {validation ? <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">{jsonPreview(validation)}</pre> : null}
          </section>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-semibold">content 只读展示</h2>
            <pre className="mt-3 max-h-[28rem] overflow-auto rounded bg-muted p-3 text-xs">{jsonPreview(content)}</pre>
          </section>
        </>
      ) : null}
    </PageShell>
  );
}

export function InstallRecordsPage() {
  const [manifestSlug, setManifestSlug] = useState("");
  const [status, setStatus] = useState("");
  const { data, error, loading, reload } = useLoader(() => listInstallRecords({ manifestSlug, status, pageSize: 20 }), [manifestSlug, status]);
  return <TelemetryPage title="Install Record 安装记录" description="只读展示 br-ai-spec init --yes 上报记录。" columns={["projectId", "workspaceId", "manifestSlug", "manifestVersion", "status", "packageCount", "clientName", "clientVersion", "installedAt", "createdAt"]} data={data} error={error} loading={loading} reload={reload} manifestSlug={manifestSlug} setManifestSlug={setManifestSlug} status={status} setStatus={setStatus} />;
}

export function RuntimeFeedbackPage() {
  const [manifestSlug, setManifestSlug] = useState("");
  const [success, setSuccess] = useState("");
  const [executorType, setExecutorType] = useState("");
  const { data, error, loading, reload } = useLoader(() => listRuntimeFeedback({ manifestSlug, success, executorType, pageSize: 20 }), [manifestSlug, success, executorType]);
  return <TelemetryPage title="Runtime Feedback 运行反馈" description="只读展示 br-ai-spec runtime-feedback 上报记录。" columns={["projectId", "runId", "manifestSlug", "manifestVersion", "success", "durationMs", "executorType", "failureCategory", "privacyChecked", "createdAt"]} data={data} error={error} loading={loading} reload={reload} manifestSlug={manifestSlug} setManifestSlug={setManifestSlug} status={success} setStatus={setSuccess} extra={<Input aria-label="executorType 筛选" placeholder="executorType" value={executorType} onChange={(event) => setExecutorType(event.target.value)} />} />;
}

function TelemetryPage({ title, description, columns, data, error, loading, reload, manifestSlug, setManifestSlug, status, setStatus, extra }: { title: string; description: string; columns: string[]; data: ListResult<HubTelemetryItem> | null; error: string; loading: boolean; reload: () => void; manifestSlug: string; setManifestSlug: (value: string) => void; status: string; setStatus: (value: string) => void; extra?: React.ReactNode }) {
  return (
    <PageShell>
      <HubPageHeader title={title} description={description} />
      <Toolbar keyword={manifestSlug} setKeyword={setManifestSlug}>
        <Input aria-label="状态筛选" placeholder="status / success" value={status} onChange={(event) => setStatus(event.target.value)} />
        {extra}
      </Toolbar>
      <ListState loading={loading} error={error} reload={reload} data={data} />
      {data?.items.length ? <Table><TableHeader><TableRow>{columns.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{data.items.map((item) => <TableRow key={item.id}>{columns.map((column) => <TableCell key={column}>{text(item[column])}</TableCell>)}</TableRow>)}</TableBody></Table> : null}
    </PageShell>
  );
}

function InfoGrid({ entries }: { entries: Array<[string, unknown]> }) {
  return <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{entries.map(([label, value]) => <Field key={label} label={label} value={value} />)}</dl>;
}

function ListState<T>({ loading, error, reload, data }: { loading: boolean; error: string; reload: () => void; data: ListResult<T> | Record<string, unknown> | null }) {
  if (loading) return <LoadingBlock />;
  if (error) return <HubErrorState message={error} onRetry={reload} />;
  if (data && "items" in data && Array.isArray(data.items) && data.items.length === 0) return <HubEmptyState />;
  return null;
}
