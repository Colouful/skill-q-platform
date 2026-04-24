"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Copy, PackagePlus, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ManifestAssetDraft = {
  kind: string;
  assetId: string;
  version: string;
  required: boolean;
  installPath: string;
  checksum: string;
  content: string;
};

const defaultAssets: ManifestAssetDraft[] = [
  {
    kind: "rule",
    assetId: "react-code-style",
    version: "1.0.0",
    required: true,
    installPath: ".agents/rules/react-code-style/RULE.md",
    checksum: "sha256-placeholder-rule",
    content: "# React 编码规范\n\n- 组件保持职责清晰。\n",
  },
  {
    kind: "skill",
    assetId: "execute-task",
    version: "1.0.0",
    required: true,
    installPath: ".agents/skills/execute-task/SKILL.md",
    checksum: "sha256-placeholder-skill",
    content: "# execute-task\n\n执行开发任务并完成验证。\n",
  },
  {
    kind: "role",
    assetId: "frontend-implementer",
    version: "1.0.0",
    required: true,
    installPath: ".agents/roles/frontend-implementer.md",
    checksum: "sha256-placeholder-role",
    content: "# 前端实现专家\n\n负责将已收敛方案落到前端代码。\n",
  },
  {
    kind: "flow",
    assetId: "prd-to-delivery",
    version: "1.0.0",
    required: true,
    installPath: ".agents/flows/prd-to-delivery.md",
    checksum: "sha256-placeholder-flow",
    content: "# 需求到交付流程\n\n需求分析 -> 实现 -> 测试 -> 评审 -> 归档。\n",
  },
];

export function ManifestEditorClient() {
  const [manifestId, setManifestId] = useState("enterprise-react-standard");
  const [displayName, setDisplayName] = useState("企业级 React 标准研发方案包");
  const [description, setDescription] = useState("适用于 React 中后台项目的 AI 规范开发方案。");
  const [version, setVersion] = useState("1.0.0");
  const [techStacks, setTechStacks] = useState("react");
  const [ides, setIdes] = useState("cursor,claude-code");
  const [scenarios, setScenarios] = useState("new-feature,bugfix,refactor");
  const [assets, setAssets] = useState<ManifestAssetDraft[]>(defaultAssets);
  const [message, setMessage] = useState("暂无提交记录");

  const payload = useMemo(
    () => ({
      id: manifestId,
      name: manifestId,
      displayName,
      description,
      version,
      status: "draft",
      techStacks: splitCsv(techStacks),
      ides: splitCsv(ides),
      scenarios: splitCsv(scenarios),
      installPolicy: { mode: "standard", allowOptionalFailure: true, conflictStrategy: "backup" },
      compatibility: { minCliVersion: "0.1.11" },
      assets: assets.map((asset, index) => ({
        ...asset,
        order: index,
      })),
    }),
    [assets, description, displayName, ides, manifestId, scenarios, techStacks, version],
  );

  async function saveManifest() {
    for (const asset of assets) {
      await fetch("/api/hub/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.assetId,
          kind: asset.kind,
          name: asset.assetId,
          displayName: asset.assetId,
          description: `${asset.kind} 资产`,
          status: "published",
          riskLevel: "L0",
          version: asset.version,
          content: asset.content,
          contentFormat: "markdown",
        }),
      });
    }
    const response = await fetch("/api/hub/manifests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    setMessage(json.message || (response.ok ? "Manifest 已保存" : "保存失败"));
  }

  async function publishManifest() {
    await saveManifest();
    const response = await fetch(`/api/hub/manifests/${encodeURIComponent(manifestId)}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version, releaseNote: "首次发布" }),
    });
    const json = await response.json();
    setMessage(json.message || (response.ok ? "Manifest 已发布" : "发布失败"));
  }

  function updateAsset(index: number, patch: Partial<ManifestAssetDraft>) {
    setAssets((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manifest 编辑器</h1>
          <p className="mt-2 text-sm text-muted-foreground">配置方案包基础信息、资产顺序、安装策略和 JSON 预览。</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={saveManifest}>
            <PackagePlus className="mr-2 size-4" />
            保存草稿
          </Button>
          <Button type="button" onClick={publishManifest}>
            <Rocket className="mr-2 size-4" />
            发布
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Manifest ID">
              <Input value={manifestId} onChange={(event) => setManifestId(event.target.value)} />
            </Field>
            <Field label="版本">
              <Input value={version} onChange={(event) => setVersion(event.target.value)} />
            </Field>
            <Field label="展示名称">
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </Field>
            <Field label="技术栈">
              <Input value={techStacks} onChange={(event) => setTechStacks(event.target.value)} />
            </Field>
            <Field label="IDE">
              <Input value={ides} onChange={(event) => setIdes(event.target.value)} />
            </Field>
            <Field label="场景">
              <Input value={scenarios} onChange={(event) => setScenarios(event.target.value)} />
            </Field>
          </div>
          <Field label="描述">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>

          <div className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium">资产编排</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setAssets((items) => [...items, defaultAssets[1]!])}>
                添加资产
              </Button>
            </div>
            <div className="space-y-3">
              {assets.map((asset, index) => (
                <div key={`${asset.assetId}-${index}`} className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                  <Input value={asset.kind} onChange={(event) => updateAsset(index, { kind: event.target.value })} aria-label="资产类型" />
                  <Input value={asset.assetId} onChange={(event) => updateAsset(index, { assetId: event.target.value })} aria-label="资产 ID" />
                  <Input value={asset.version} onChange={(event) => updateAsset(index, { version: event.target.value })} aria-label="资产版本" />
                  <Input className="sm:col-span-2" value={asset.installPath} onChange={(event) => updateAsset(index, { installPath: event.target.value })} aria-label="安装路径" />
                  <Input value={asset.checksum} onChange={(event) => updateAsset(index, { checksum: event.target.value })} aria-label="checksum" />
                  <Textarea className="sm:col-span-3" value={asset.content} onChange={(event) => updateAsset(index, { content: event.target.value })} aria-label="资产内容" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium">JSON 预览</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(payload, null, 2))}>
                <Copy className="mr-2 size-4" />
                复制
              </Button>
            </div>
            <pre className="max-h-[560px] overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(payload, null, 2)}</pre>
          </div>
          <div className="rounded-md border p-4 text-sm">状态：{message}</div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function splitCsv(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}
