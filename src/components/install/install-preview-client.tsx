"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";
import { AdminOptionChecklist } from "@/components/admin/AdminOptionChecklist";
import { AI_SPEC_PACKAGE_SPEC, buildAiSpecSyncCommand } from "@/lib/ai-spec-cli";

type InstallOption = {
  slug: string;
  name: string;
};

type InstallScenario = {
  slug: string;
  name: string;
  description: string;
  isFeatured: boolean;
  supportedProfiles: string[];
  recommendedIdes: string[];
  entryRole: { name: string; slug: string } | null;
  roles: InstallOption[];
  skills: InstallOption[];
  rules: InstallOption[];
  directSkills: InstallOption[];
  directRules: InstallOption[];
  roleSkillMap: Record<string, InstallOption[]>;
  roleRuleMap: Record<string, InstallOption[]>;
};

type PreviewResponse = {
  manifest: {
    profile: string;
    ides: string[];
    scenario_packages: string[];
    roles: string[];
    skills: string[];
    rules: string[];
    entry_role: string | null;
  };
  warnings: string[];
  remoteManifestUrl: string | null;
  commands: {
    init: string;
    syncRemote: string;
    syncLocal: string;
  };
};

function joinCsv(items: string[]) {
  return items.join(", ");
}

function filterAvailableSlugs(values: string[], options: InstallOption[]): string[] {
  const optionSet = new Set(options.map((item) => item.slug));
  return values.filter((item) => optionSet.has(item));
}

function deriveScenarioAssetSlugs(
  scenario: InstallScenario,
  selectedRoleValues: string[],
): { skills: string[]; rules: string[] } {
  const skillSlugs = new Set(scenario.directSkills.map((item) => item.slug));
  const ruleSlugs = new Set(scenario.directRules.map((item) => item.slug));

  selectedRoleValues.forEach((roleSlug) => {
    (scenario.roleSkillMap[roleSlug] ?? []).forEach((skill) => skillSlugs.add(skill.slug));
    (scenario.roleRuleMap[roleSlug] ?? []).forEach((rule) => ruleSlugs.add(rule.slug));
  });

  return {
    skills: filterAvailableSlugs(Array.from(skillSlugs), scenario.skills),
    rules: filterAvailableSlugs(Array.from(ruleSlugs), scenario.rules),
  };
}

type InitialSelection = {
  scenarioSlug: string | null;
  profile: string | null;
  ides: string[];
  roles: string[];
  skills: string[];
  rules: string[];
  hasCustomProfile: boolean;
  hasCustomIdes: boolean;
  hasCustomRoles: boolean;
  hasCustomSkills: boolean;
  hasCustomRules: boolean;
};

export function InstallPreviewClient({
  scenarios,
  initialSelection,
}: {
  scenarios: InstallScenario[];
  initialSelection: InitialSelection;
}) {
  const pathname = usePathname();
  const initialAppliedRef = useRef(false);
  const [selectedScenarioSlug, setSelectedScenarioSlug] = useState(initialSelection.scenarioSlug ?? scenarios[0]?.slug ?? "");
  const selectedScenario = useMemo(
    () => scenarios.find((item) => item.slug === selectedScenarioSlug) ?? null,
    [scenarios, selectedScenarioSlug],
  );
  const [profile, setProfile] = useState("");
  const [selectedIdes, setSelectedIdes] = useState<Set<string>>(new Set());
  const [roleSlugs, setRoleSlugs] = useState<Set<string>>(new Set());
  const [skillSlugs, setSkillSlugs] = useState<Set<string>>(new Set());
  const [ruleSlugs, setRuleSlugs] = useState<Set<string>>(new Set());
  const [hasCustomRoleSelection, setHasCustomRoleSelection] = useState(initialSelection.hasCustomRoles);
  const [hasCustomSkillSelection, setHasCustomSkillSelection] = useState(initialSelection.hasCustomSkills);
  const [hasCustomRuleSelection, setHasCustomRuleSelection] = useState(initialSelection.hasCustomRules);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedScenario) return;
    const ideOptions = selectedScenario.recommendedIdes.length > 0 ? selectedScenario.recommendedIdes : ["default"];
    const nextRoleValues =
      !initialAppliedRef.current &&
      selectedScenario.slug === (initialSelection.scenarioSlug ?? selectedScenario.slug) &&
      initialSelection.hasCustomRoles
        ? filterAvailableSlugs(initialSelection.roles, selectedScenario.roles)
        : selectedScenario.roles.map((item) => item.slug);
    const derivedScenarioAssets = deriveScenarioAssetSlugs(selectedScenario, nextRoleValues);
    const useInitial =
      !initialAppliedRef.current &&
      selectedScenario.slug === (initialSelection.scenarioSlug ?? selectedScenario.slug);

    setProfile(
      useInitial && initialSelection.hasCustomProfile
        ? initialSelection.profile?.trim() || "default"
        : selectedScenario.supportedProfiles[0] ?? "default",
    );
    setSelectedIdes(
      new Set(
        useInitial && initialSelection.hasCustomIdes
          ? initialSelection.ides.filter((item) => ideOptions.includes(item))
          : ideOptions,
      ),
    );
    setRoleSlugs(new Set(nextRoleValues));
    setSkillSlugs(
      new Set(
        useInitial && initialSelection.hasCustomSkills
          ? filterAvailableSlugs(initialSelection.skills, selectedScenario.skills)
          : derivedScenarioAssets.skills,
      ),
    );
    setRuleSlugs(
      new Set(
        useInitial && initialSelection.hasCustomRules
          ? filterAvailableSlugs(initialSelection.rules, selectedScenario.rules)
          : derivedScenarioAssets.rules,
      ),
    );
    setHasCustomRoleSelection(useInitial ? initialSelection.hasCustomRoles : false);
    setHasCustomSkillSelection(useInitial ? initialSelection.hasCustomSkills : false);
    setHasCustomRuleSelection(useInitial ? initialSelection.hasCustomRules : false);

    if (useInitial) {
      initialAppliedRef.current = true;
    }
  }, [initialSelection, selectedScenario]);

  useEffect(() => {
    if (!selectedScenario) return;
    void refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedScenarioSlug,
    profile,
    hasCustomRoleSelection,
    hasCustomSkillSelection,
    hasCustomRuleSelection,
    joinCsv([...selectedIdes].sort()),
    joinCsv([...roleSlugs].sort()),
    joinCsv([...skillSlugs].sort()),
    joinCsv([...ruleSlugs].sort()),
  ]);

  useEffect(() => {
    if (!selectedScenario) return;

    const params = new URLSearchParams();
    params.set("scenario", selectedScenario.slug);
    params.set("profile", profile || "default");

    const ideValues = (selectedScenario.recommendedIdes.length > 0 ? selectedScenario.recommendedIdes : ["default"]).filter(
      (item) => selectedIdes.has(item),
    );
    const roleValues = selectedScenario.roles.filter((item) => roleSlugs.has(item.slug)).map((item) => item.slug);
    const skillValues = selectedScenario.skills.filter((item) => skillSlugs.has(item.slug)).map((item) => item.slug);
    const ruleValues = selectedScenario.rules.filter((item) => ruleSlugs.has(item.slug)).map((item) => item.slug);

    params.set("ides", ideValues.join(","));
    if (hasCustomRoleSelection) params.set("roles", roleValues.join(","));
    else params.delete("roles");
    if (hasCustomSkillSelection) params.set("skills", skillValues.join(","));
    else params.delete("skills");
    if (hasCustomRuleSelection) params.set("rules", ruleValues.join(","));
    else params.delete("rules");

    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [
    hasCustomRoleSelection,
    hasCustomRuleSelection,
    hasCustomSkillSelection,
    pathname,
    profile,
    roleSlugs,
    ruleSlugs,
    selectedIdes,
    selectedScenario,
    skillSlugs,
  ]);

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function syncAssetsFromRoles(nextRoleSet: Set<string>) {
    if (!selectedScenario) return;
    const derived = deriveScenarioAssetSlugs(selectedScenario, filterAvailableSlugs([...nextRoleSet], selectedScenario.roles));
    if (!hasCustomSkillSelection) setSkillSlugs(new Set(derived.skills));
    if (!hasCustomRuleSelection) setRuleSlugs(new Set(derived.rules));
  }

  function toggleRole(roleSlug: string) {
    setHasCustomRoleSelection(true);
    setRoleSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(roleSlug)) next.delete(roleSlug);
      else next.add(roleSlug);
      syncAssetsFromRoles(next);
      return next;
    });
  }

  function toggleSkill(skillSlug: string) {
    setHasCustomSkillSelection(true);
    toggle(setSkillSlugs, skillSlug);
  }

  function toggleRule(ruleSlug: string) {
    setHasCustomRuleSelection(true);
    toggle(setRuleSlugs, ruleSlug);
  }

  async function refreshPreview() {
    if (!selectedScenario) return;
    setLoading(true);
    const res = await fetchApi<PreviewResponse>("/api/install/preview", {
      method: "POST",
      body: JSON.stringify({
        profile,
        ides: [...selectedIdes],
        scenario_packages: [selectedScenario.slug],
        roles: [...roleSlugs],
        skills: [...skillSlugs],
        rules: [...ruleSlugs],
        customizeRoles: hasCustomRoleSelection,
        customizeSkills: hasCustomSkillSelection,
        customizeRules: hasCustomRuleSelection,
      }),
    });
    setLoading(false);
    if (res.code !== 0 || !res.data) {
      toast.error(res.message || "生成预览失败");
      return;
    }
    setPreview(res.data);
  }

  async function downloadManifest() {
    if (!selectedScenario) return;
    const res = await fetch("/api/install/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile,
        ides: [...selectedIdes],
        scenario_packages: [selectedScenario.slug],
        roles: [...roleSlugs],
        skills: [...skillSlugs],
        rules: [...ruleSlugs],
        customizeRoles: hasCustomRoleSelection,
        customizeSkills: hasCustomSkillSelection,
        customizeRules: hasCustomRuleSelection,
      }),
    });
    if (!res.ok) {
      toast.error("导出 manifest 失败");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedScenario.slug}.manifest.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!selectedScenario) {
    return null;
  }

  const roleOptions = selectedScenario.roles.map((item) => ({ id: item.slug, label: item.name, caption: item.slug }));
  const skillOptions = selectedScenario.skills.map((item) => ({ id: item.slug, label: item.name, caption: item.slug }));
  const ruleOptions = selectedScenario.rules.map((item) => ({ id: item.slug, label: item.name, caption: item.slug }));
  const localManifestFilename = `${selectedScenario.slug}.manifest.json`;
  const localSyncCommand = buildAiSpecSyncCommand({ manifestRef: `./${localManifestFilename}` });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="space-y-6">
        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            1. 选择场景方案
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {scenarios.map((scenario) => (
              <div
                key={scenario.slug}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedScenarioSlug(scenario.slug)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedScenarioSlug(scenario.slug);
                  }
                }}
                className={
                  scenario.slug === selectedScenarioSlug
                    ? "rounded-sm ring-4 ring-[var(--pixel-yellow)]"
                    : ""
                }
              >
                <div className="flex h-full flex-col gap-3 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 text-left shadow-[4px_4px_0_0_var(--pixel-border)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
                        场景方案
                        {scenario.isFeatured ? " · 推荐" : ""}
                      </p>
                      <h3 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
                        {scenario.name}
                      </h3>
                    </div>
                    <Link
                      href={`/scenarios/${encodeURIComponent(scenario.slug)}`}
                      className="shrink-0 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)] underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      详情
                    </Link>
                  </div>
                  <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                    {scenario.description}
                  </p>
                  <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
                    入口专家：{scenario.entryRole?.name ?? "未设置"}
                  </p>
                  <p className="mt-auto font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
                    专家 {scenario.roles.length} · 汇总 Skill {scenario.skills.length} · 汇总 Rule {scenario.rules.length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            2. 微调安装清单
          </h2>
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
            Skill / Rule 默认会随当前勾选的专家自动聚合；如果你手动勾选了 Skill / Rule，后续导出会优先使用你的手工选择。
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-[var(--pixel-fg)]">Profile</span>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="!rounded-none h-8 w-full border-4 border-[var(--pixel-border)] bg-transparent px-2.5 py-1 font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-fg)] outline-none md:text-sm"
              >
                {selectedScenario.supportedProfiles.length === 0 ? (
                  <option value="default">default</option>
                ) : (
                  selectedScenario.supportedProfiles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-sm text-[var(--pixel-fg)]">IDE</span>
              <div className="flex flex-wrap gap-2">
                {(selectedScenario.recommendedIdes.length > 0 ? selectedScenario.recommendedIdes : ["default"]).map((ide) => (
                  <label
                    key={ide}
                    className="inline-flex items-center gap-2 border-2 border-[var(--pixel-border)] px-3 py-1 text-sm text-[var(--pixel-fg)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIdes.has(ide)}
                      onChange={() => toggle(setSelectedIdes, ide)}
                      className="size-4 accent-[var(--pixel-accent)]"
                    />
                    {ide}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <AdminOptionChecklist
              title="专家"
              options={roleOptions}
              selected={roleSlugs}
              onToggle={toggleRole}
            />
            <AdminOptionChecklist
              title="汇总 Skill（可微调）"
              options={skillOptions}
              selected={skillSlugs}
              onToggle={toggleSkill}
            />
            <AdminOptionChecklist
              title="汇总 Rule（可微调）"
              options={ruleOptions}
              selected={ruleSlugs}
              onToggle={toggleRule}
            />
          </div>
        </section>
      </section>

      <aside className="space-y-4">
        <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              3. Manifest 预览
            </h2>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-[var(--pixel-border)]"
              onClick={() => void refreshPreview()}
              disabled={loading}
            >
              {loading ? "生成中…" : "刷新"}
            </Button>
          </div>
          <pre className="mt-4 overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
            {JSON.stringify(preview?.manifest ?? {}, null, 2)}
          </pre>
          {preview?.warnings && preview.warnings.length > 0 ? (
            <div className="mt-3 space-y-2 border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/15 p-3">
              <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                Warnings
              </p>
              {preview.warnings.map((warning) => (
                <p key={warning} className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
                  {warning}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            4. 执行安装
          </h2>
          <p className="mt-3 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
            当前 CLI 发布包：
            {" "}
            <code className="font-mono text-[var(--pixel-fg)]">{AI_SPEC_PACKAGE_SPEC}</code>
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                10.1 初始化安装
              </p>
              <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                {preview?.commands.init ?? ""}
              </pre>
            </div>
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                10.2 增量同步
              </p>
              <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                {preview?.commands.syncRemote ?? ""}
              </pre>
            </div>
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                10.3 本地 manifest 同步
              </p>
              <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                {preview?.commands.syncLocal || localSyncCommand}
              </pre>
            </div>
            <div className="flex flex-wrap gap-3">
              {preview?.remoteManifestUrl ? (
                <a
                  href={preview.remoteManifestUrl}
                  className="inline-flex items-center justify-center border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]"
                >
                  打开远程 Manifest
                </a>
              ) : null}
              <Button
                type="button"
                className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
                onClick={() => void downloadManifest()}
              >
                下载 {localManifestFilename}
              </Button>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
