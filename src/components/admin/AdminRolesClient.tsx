"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PixelInput, PixelTextarea, pixelSelectClassName } from "@/components/pixel";
import { fetchApi } from "@/lib/client-api";
import { AdminOptionChecklist } from "@/components/admin/AdminOptionChecklist";
import { AdminSortableList, type AdminSortableListItem } from "@/components/admin/AdminSortableList";
import { catalogPublishStatusLabel, ROLE_STATUS, roleStatusLabel } from "@/lib/catalog";
import { RoleImportDropzone, type RoleImportPayload } from "@/components/admin/RoleImportDropzone";
import { formatDateTimeShanghai } from "@/lib/date-format";
import {
  buildRoleVersionFiles,
  normalizeRoleVersionFiles,
  suggestNextPatchVersion,
  type RoleVersionFileEntry,
} from "@/lib/role-version";

type Option = {
  id: string;
  name: string;
  slug: string;
};

type RoleRow = {
  id: string;
  name: string;
  slug: string;
  author: string;
  description: string;
  longDescription: string | null;
  publishStatus: string;
  roleStatus: string;
  supportedProfiles: string[];
  tags: string[];
  triggers: string[];
  preferredSkills: string[];
  reads: string[];
  writes: string[];
  handoffTo: string[];
  rolePositioning: string | null;
  workingPrinciples: string[];
  requiredSteps: string[];
  executionContract: string | null;
  outputStandard: string | null;
  prohibitedActions: string[];
  handoffNotes: string | null;
  skillIds: string[];
  ruleIds: string[];
  domainIds: string[];
  updatedAt: string;
};

type RoleVersionRow = {
  id: string;
  version: string;
  changelog: string | null;
  files: RoleVersionFileEntry[];
  downloadUrl: string | null;
  isLatest: boolean;
  createdAt: string;
};

type RoleMutationPayload = {
  role: {
    id: string;
    name: string;
    slug: string;
    author: string;
    description: string;
    longDescription: string | null;
    publishStatus: string;
    roleStatus: string;
    updatedAt?: string;
  };
};

function toggleOrderedId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function moveOrderedId(list: string[], id: string, direction: -1 | 1): string[] {
  const index = list.indexOf(id);
  if (index < 0) return list;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= list.length) return list;
  const next = [...list];
  const current = next[index]!;
  next[index] = next[nextIndex]!;
  next[nextIndex] = current;
  return next;
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinCsv(items: string[]): string {
  return items.join(", ");
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(items: string[]): string {
  return items.join("\n");
}

function slugifyDraft(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toSortableOptionItems(ids: string[], options: Option[]): AdminSortableListItem[] {
  return ids.map((id) => {
    const option = options.find((item) => item.id === id);
    return {
      id,
      title: option?.name ?? id,
      subtitle: option?.slug ?? "",
    };
  });
}

function buildRoleVersionDraftFiles(
  role: RoleRow,
  options: {
    skills: Option[];
    rules: Option[];
    domains: Option[];
  },
): RoleVersionFileEntry[] {
  return buildRoleVersionFiles({
    name: role.name,
    slug: role.slug,
    author: role.author,
    description: role.description,
    longDescription: role.longDescription,
    publishStatus: role.publishStatus,
    roleStatus: role.roleStatus,
    supportedProfiles: role.supportedProfiles,
    tags: role.tags,
    triggers: role.triggers,
    preferredSkills: role.preferredSkills,
    reads: role.reads,
    writes: role.writes,
    handoffTo: role.handoffTo,
    rolePositioning: role.rolePositioning,
    workingPrinciples: role.workingPrinciples,
    requiredSteps: role.requiredSteps,
    executionContract: role.executionContract,
    outputStandard: role.outputStandard,
    prohibitedActions: role.prohibitedActions,
    handoffNotes: role.handoffNotes,
    skillSlugs: role.skillIds
      .map((id) => options.skills.find((item) => item.id === id)?.slug)
      .filter(Boolean) as string[],
    ruleSlugs: role.ruleIds
      .map((id) => options.rules.find((item) => item.id === id)?.slug)
      .filter(Boolean) as string[],
    domainSlugs: role.domainIds
      .map((id) => options.domains.find((item) => item.id === id)?.slug)
      .filter(Boolean) as string[],
  });
}

const fixedTextareaClassName = "h-32 resize-none overflow-y-auto field-sizing-fixed";

export function AdminRolesClient({
  initialItems,
  skills,
  rules,
  domains,
}: {
  initialItems: RoleRow[];
  skills: Option[];
  rules: Option[];
  domains: Option[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("Hub Admin");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [publishStatus, setPublishStatus] = useState<string>("draft");
  const [roleStatus, setRoleStatus] = useState<string>(ROLE_STATUS.DRAFT);
  const [profilesText, setProfilesText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [triggersText, setTriggersText] = useState("");
  const [preferredSkillsText, setPreferredSkillsText] = useState("");
  const [readsText, setReadsText] = useState("");
  const [writesText, setWritesText] = useState("");
  const [handoffToText, setHandoffToText] = useState("");
  const [rolePositioning, setRolePositioning] = useState("");
  const [workingPrinciplesText, setWorkingPrinciplesText] = useState("");
  const [requiredStepsText, setRequiredStepsText] = useState("");
  const [executionContract, setExecutionContract] = useState("");
  const [outputStandard, setOutputStandard] = useState("");
  const [prohibitedActionsText, setProhibitedActionsText] = useState("");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [ruleIds, setRuleIds] = useState<string[]>([]);
  const [domainIds, setDomainIds] = useState<Set<string>>(new Set());
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionBusy, setVersionBusy] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleRow | null>(null);
  const [versions, setVersions] = useState<RoleVersionRow[]>([]);
  const [nextVersion, setNextVersion] = useState("1.0.0");
  const [versionChangelog, setVersionChangelog] = useState("");
  const [versionFilesText, setVersionFilesText] = useState("[]");
  const [versionIsLatest, setVersionIsLatest] = useState(true);
  const [importIssues, setImportIssues] = useState<string[]>([]);
  const [importUnmatchedDomains, setImportUnmatchedDomains] = useState<string[]>([]);
  const [importIgnoredMetaKeys, setImportIgnoredMetaKeys] = useState<string[]>([]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!versionsOpen || !activeRole) return;
    void loadVersions(activeRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionsOpen, activeRole?.id]);

  const skillOptions = useMemo(
    () => skills.map((item) => ({ id: item.id, label: item.name, caption: item.slug })),
    [skills],
  );
  const ruleOptions = useMemo(
    () => rules.map((item) => ({ id: item.id, label: item.name, caption: item.slug })),
    [rules],
  );
  const domainOptions = useMemo(
    () => domains.map((item) => ({ id: item.id, label: item.name, caption: item.slug })),
    [domains],
  );

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setAuthor("Hub Admin");
    setDescription("");
    setLongDescription("");
    setPublishStatus("draft");
    setRoleStatus(ROLE_STATUS.DRAFT);
    setProfilesText("");
    setTagsText("");
    setTriggersText("");
    setPreferredSkillsText("");
    setReadsText("");
    setWritesText("");
    setHandoffToText("");
    setRolePositioning("");
    setWorkingPrinciplesText("");
    setRequiredStepsText("");
    setExecutionContract("");
    setOutputStandard("");
    setProhibitedActionsText("");
    setHandoffNotes("");
    setSkillIds([]);
    setRuleIds([]);
    setDomainIds(new Set());
    setImportIssues([]);
    setImportUnmatchedDomains([]);
    setImportIgnoredMetaKeys([]);
  }

  function openVersions(item: RoleRow) {
    setActiveRole(item);
    setVersionsOpen(true);
    setVersionChangelog("");
    setVersionIsLatest(true);
  }

  async function loadVersions(item: RoleRow) {
    setVersionsLoading(true);
    const res = await fetchApi<RoleVersionRow[]>(`/api/roles/${encodeURIComponent(item.slug)}/versions`);
    setVersionsLoading(false);
    if (res.code !== 0 || !res.data) {
      toast.error(res.message || "读取版本失败");
      return;
    }
    const normalized = res.data.map((version) => ({
      ...version,
      files: normalizeRoleVersionFiles(version.files),
    }));
    setVersions(normalized);
    setNextVersion(suggestNextPatchVersion(normalized.map((version) => version.version)));
    setVersionFilesText(
      JSON.stringify(
        buildRoleVersionDraftFiles(item, { skills, rules, domains }),
        null,
        2,
      ),
    );
  }

  async function createVersion() {
    if (!activeRole) return;

    let files: RoleVersionFileEntry[] = [];
    try {
      const parsed = JSON.parse(versionFilesText);
      files = normalizeRoleVersionFiles(parsed);
    } catch {
      toast.error("版本文件 JSON 格式不正确");
      return;
    }

    if (files.length === 0) {
      toast.error("至少需要一个版本文件");
      return;
    }

    setVersionBusy(true);
    const res = await fetchApi<RoleVersionRow>(
      `/api/roles/${encodeURIComponent(activeRole.slug)}/versions`,
      {
        method: "POST",
        body: JSON.stringify({
          version: nextVersion,
          changelog: versionChangelog,
          files,
          isLatest: versionIsLatest,
        }),
      },
    );
    setVersionBusy(false);
    if (res.code !== 0) {
      toast.error(res.message || "创建版本失败");
      return;
    }
    toast.success("版本已创建");
    setVersionChangelog("");
    await loadVersions(activeRole);
    router.refresh();
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(item: RoleRow) {
    setEditingId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setAuthor(item.author);
    setDescription(item.description);
    setLongDescription(item.longDescription ?? "");
    setPublishStatus(item.publishStatus);
    setRoleStatus(item.roleStatus || ROLE_STATUS.DRAFT);
    setProfilesText(joinCsv(item.supportedProfiles));
    setTagsText(joinCsv(item.tags));
    setTriggersText(joinLines(item.triggers));
    setPreferredSkillsText(joinLines(item.preferredSkills));
    setReadsText(joinLines(item.reads));
    setWritesText(joinLines(item.writes));
    setHandoffToText(joinLines(item.handoffTo));
    setRolePositioning(item.rolePositioning ?? "");
    setWorkingPrinciplesText(joinLines(item.workingPrinciples));
    setRequiredStepsText(joinLines(item.requiredSteps));
    setExecutionContract(item.executionContract ?? "");
    setOutputStandard(item.outputStandard ?? "");
    setProhibitedActionsText(joinLines(item.prohibitedActions));
    setHandoffNotes(item.handoffNotes ?? "");
    setSkillIds(item.skillIds);
    setRuleIds(item.ruleIds);
    setDomainIds(new Set(item.domainIds));
    setImportIssues([]);
    setImportUnmatchedDomains([]);
    setImportIgnoredMetaKeys([]);
    setOpen(true);
  }

  function hasMeaningfulFormValue() {
    return !!(
      name.trim() ||
      slug.trim() ||
      description.trim() ||
      tagsText.trim() ||
      profilesText.trim() ||
      triggersText.trim() ||
      preferredSkillsText.trim() ||
      readsText.trim() ||
      writesText.trim() ||
      handoffToText.trim() ||
      rolePositioning.trim() ||
      workingPrinciplesText.trim() ||
      requiredStepsText.trim() ||
      executionContract.trim() ||
      outputStandard.trim() ||
      prohibitedActionsText.trim() ||
      handoffNotes.trim() ||
      domainIds.size > 0
    );
  }

  function applyRoleImport(payload: RoleImportPayload) {
    const shouldOverwrite =
      hasMeaningfulFormValue() &&
      window.confirm("将覆盖当前表单中的专家文本与元数据字段，是否继续？");
    if (!shouldOverwrite && hasMeaningfulFormValue()) return;

    setName(payload.roleData.name || payload.hints.name || "");
    setSlug(slugifyDraft(payload.roleData.slug || payload.hints.slug || ""));
    setDescription(payload.roleData.description || payload.hints.description || "");
    setRoleStatus(payload.roleData.roleStatus || payload.hints.roleStatus || ROLE_STATUS.DRAFT);
    setTriggersText(joinLines(payload.roleData.triggers));
    setPreferredSkillsText(joinLines(payload.roleData.preferredSkills));
    setReadsText(joinLines(payload.roleData.reads));
    setWritesText(joinLines(payload.roleData.writes));
    setHandoffToText(joinLines(payload.roleData.handoffTo));
    setRolePositioning(payload.sections.rolePositioning ?? "");
    setWorkingPrinciplesText(joinLines(payload.sections.workingPrinciples));
    setRequiredStepsText(joinLines(payload.sections.requiredSteps));
    setExecutionContract(payload.sections.executionContract ?? "");
    setOutputStandard(payload.sections.outputStandard ?? "");
    setProhibitedActionsText(joinLines(payload.sections.prohibitedActions));
    setHandoffNotes(payload.sections.handoffNotes ?? "");
    setDomainIds(new Set(payload.mappedDomainIds));
    setImportIssues(payload.issues);
    setImportUnmatchedDomains(payload.unmatchedDomains);
    setImportIgnoredMetaKeys(payload.ignoredMetaKeys);

    if (payload.issues.length > 0) {
      toast.message("已导入专家内容，请检查下方提示", { duration: 4000 });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name,
      slug,
      author,
      description,
      longDescription,
      publishStatus,
      roleStatus,
      supportedProfiles: splitCsv(profilesText),
      tags: splitCsv(tagsText),
      triggers: splitLines(triggersText),
      preferredSkills: splitLines(preferredSkillsText),
      reads: splitLines(readsText),
      writes: splitLines(writesText),
      handoffTo: splitLines(handoffToText),
      rolePositioning: rolePositioning || null,
      workingPrinciples: splitLines(workingPrinciplesText),
      requiredSteps: splitLines(requiredStepsText),
      executionContract: executionContract || null,
      outputStandard: outputStandard || null,
      prohibitedActions: splitLines(prohibitedActionsText),
      handoffNotes: handoffNotes || null,
      skillIds,
      ruleIds,
      domainIds: [...domainIds],
    };
    const endpoint = editingId ? "/api/admin/roles/update" : "/api/admin/roles";
    const res = await fetchApi<RoleMutationPayload>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.code !== 0) {
      toast.error(res.message || "保存失败");
      return;
    }
    const saved = res.data?.role;
    upsertItem({
      id: saved?.id ?? editingId ?? crypto.randomUUID(),
      name: saved?.name ?? name.trim(),
      slug: saved?.slug ?? slugifyDraft(slug || name),
      author: saved?.author ?? author.trim(),
      description: saved?.description ?? description,
      longDescription: saved?.longDescription ?? (longDescription || null),
      publishStatus: saved?.publishStatus ?? publishStatus,
      roleStatus: saved?.roleStatus ?? roleStatus,
      supportedProfiles: payload.supportedProfiles,
      tags: payload.tags,
      triggers: payload.triggers,
      preferredSkills: payload.preferredSkills,
      reads: payload.reads,
      writes: payload.writes,
      handoffTo: payload.handoffTo,
      rolePositioning: payload.rolePositioning,
      workingPrinciples: payload.workingPrinciples,
      requiredSteps: payload.requiredSteps,
      executionContract: payload.executionContract,
      outputStandard: payload.outputStandard,
      prohibitedActions: payload.prohibitedActions,
      handoffNotes: payload.handoffNotes,
      skillIds: payload.skillIds,
      ruleIds: payload.ruleIds,
      domainIds: payload.domainIds,
      updatedAt: saved?.updatedAt ?? new Date().toISOString(),
    });
    toast.success(editingId ? "专家已更新" : "专家已创建");
    setOpen(false);
    resetForm();
    router.refresh();
  }

  async function remove(item: RoleRow) {
    const ok = window.confirm(`确定删除专家「${item.name}」？该操作不可恢复。`);
    if (!ok) return;
    setBusy(true);
    const res = await fetchApi("/api/admin/roles/delete", {
      method: "POST",
      body: JSON.stringify({ id: item.id }),
    });
    setBusy(false);
    if (res.code !== 0) {
      toast.error(res.message || "删除失败");
      return;
    }
    toast.success("专家已删除");
    router.refresh();
  }

  async function togglePublish(item: RoleRow) {
    const nextStatus = item.publishStatus === "published" ? "draft" : "published";
    setBusy(true);
    const res = await fetchApi("/api/admin/roles/publish-status", {
      method: "POST",
      body: JSON.stringify({ id: item.id, publishStatus: nextStatus }),
    });
    setBusy(false);
    if (res.code !== 0) {
      toast.error(res.message || "状态更新失败");
      return;
    }
    toast.success(`专家已切换为 ${nextStatus}`);
    router.refresh();
  }

  const shouldShowLegacyLongDescription =
    !!editingId &&
    !!longDescription.trim() &&
    !rolePositioning.trim() &&
    !workingPrinciplesText.trim() &&
    !requiredStepsText.trim() &&
    !executionContract.trim() &&
    !outputStandard.trim() &&
    !prohibitedActionsText.trim() &&
    !handoffNotes.trim();

  const previewProfiles = splitCsv(profilesText);
  const previewTags = splitCsv(tagsText);
  const previewTriggers = splitLines(triggersText);
  const previewPreferredSkills = splitLines(preferredSkillsText);
  const previewReads = splitLines(readsText);
  const previewWrites = splitLines(writesText);
  const previewHandoffTo = splitLines(handoffToText);
  const previewWorkingPrinciples = splitLines(workingPrinciplesText);
  const previewRequiredSteps = splitLines(requiredStepsText);
  const previewProhibitedActions = splitLines(prohibitedActionsText);
  const orderedSkillItems = useMemo(() => toSortableOptionItems(skillIds, skills), [skillIds, skills]);
  const orderedRuleItems = useMemo(() => toSortableOptionItems(ruleIds, rules), [ruleIds, rules]);

  function upsertItem(nextItem: RoleRow) {
    setItems((prev) => {
      if (editingId) {
        return prev.map((item) => (item.id === nextItem.id ? nextItem : item));
      }
      return [nextItem, ...prev];
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          维护专家基础信息，以及与 Skill / Rule / 能力域的关联。
        </p>
        <Button
          type="button"
          onClick={openCreate}
          className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
        >
          新建专家
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>标识</TableHead>
            <TableHead>作者</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>Skill</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.slug}</TableCell>
              <TableCell>{item.author}</TableCell>
              <TableCell>{catalogPublishStatusLabel(item.publishStatus)}</TableCell>
              <TableCell>{item.skillIds.length}</TableCell>
              <TableCell>{item.ruleIds.length}</TableCell>
              <TableCell>{formatDateTimeShanghai(item.updatedAt)}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-[var(--pixel-border)]"
                  onClick={() => openEdit(item)}
                  disabled={busy}
                >
                  编辑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-[var(--pixel-border)]"
                  onClick={() => void togglePublish(item)}
                  disabled={busy}
                >
                  {item.publishStatus === "published" ? "转草稿" : "发布"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-[var(--pixel-border)]"
                  onClick={() => openVersions(item)}
                  disabled={busy}
                >
                  版本
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-[var(--pixel-border)] text-red-700"
                  onClick={() => void remove(item)}
                  disabled={busy}
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[92vh] w-[96vw] overflow-y-auto rounded-none border-4 border-[var(--pixel-border)] bg-[#fffef8] p-0 sm:!max-w-none"
          style={{ width: "min(96vw, 1600px)", maxWidth: "min(96vw, 1600px)" }}
        >
          <form onSubmit={save} className="space-y-6 p-6">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
                {editingId ? "编辑专家" : "新建专家"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
              <div className="space-y-6">
                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">从 Markdown / ZIP 导入</p>
                    <p className="text-xs text-[var(--pixel-muted)]">支持 br-ai-spec 专家模板文件，解析成功后只预填表单，不会直接创建专家。</p>
                  </div>
                  <RoleImportDropzone onParsed={applyRoleImport} />
                  {importIssues.length > 0 || importUnmatchedDomains.length > 0 || importIgnoredMetaKeys.length > 0 ? (
                    <div className="space-y-2 rounded-sm border-2 border-dashed border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/10 p-3 text-xs text-[var(--pixel-fg)]">
                      {importIssues.length > 0 ? (
                        <div className="space-y-1">
                          <p className="font-medium">解析提示</p>
                          <ul className="space-y-1 text-[var(--pixel-muted)]">
                            {importIssues.map((issue) => (
                              <li key={issue}>- {issue}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {importUnmatchedDomains.length > 0 ? (
                        <p className="text-[var(--pixel-muted)]">
                          未匹配能力域：{importUnmatchedDomains.join(" / ")}
                        </p>
                      ) : null}
                      {importIgnoredMetaKeys.length > 0 ? (
                        <p className="text-[var(--pixel-muted)]">
                          已忽略字段：{importIgnoredMetaKeys.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">基础信息</p>
                    <p className="text-xs text-[var(--pixel-muted)]">对齐专家 frontmatter 的基础身份字段。</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">名称</label>
                      <PixelInput
                        value={name}
                        onChange={(e) => {
                          const next = e.target.value;
                          setName(next);
                          if (!editingId) setSlug(slugifyDraft(next));
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">唯一标识（Slug）</label>
                      <PixelInput value={slug} onChange={(e) => setSlug(slugifyDraft(e.target.value))} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">作者</label>
                      <PixelInput value={author} onChange={(e) => setAuthor(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">Hub 发布状态</label>
                      <select
                        value={publishStatus}
                        onChange={(e) => setPublishStatus(e.target.value)}
                        className={pixelSelectClassName}
                      >
                        <option value="draft">草稿</option>
                        <option value="published">已发布</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">专家状态</label>
                      <select
                        value={roleStatus}
                        onChange={(e) => setRoleStatus(e.target.value)}
                        className={pixelSelectClassName}
                      >
                        <option value={ROLE_STATUS.DRAFT}>草稿</option>
                        <option value={ROLE_STATUS.ACTIVE}>启用中</option>
                        <option value={ROLE_STATUS.PLANNED}>规划中</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">适用 Profile（逗号分隔）</label>
                      <PixelInput value={profilesText} onChange={(e) => setProfilesText(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">简介</label>
                    <PixelTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className={fixedTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">标签（逗号分隔）</label>
                    <PixelInput value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
                  </div>
                </section>

                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">执行元数据</p>
                    <p className="text-xs text-[var(--pixel-muted)]">对应 triggers / preferred_skills / reads / writes / handoff_to。</p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <AdminOptionChecklist
                      title="关联 Skill"
                      options={skillOptions}
                      selected={new Set(skillIds)}
                      onToggle={(id) => setSkillIds((prev) => toggleOrderedId(prev, id))}
                      searchEnabled
                      searchPlaceholder="搜索名称或 slug"
                      minHeightClassName="min-h-72"
                      maxHeightClassName="max-h-72"
                    />
                    <AdminOptionChecklist
                      title="附带 Rule"
                      options={ruleOptions}
                      selected={new Set(ruleIds)}
                      onToggle={(id) => setRuleIds((prev) => toggleOrderedId(prev, id))}
                      searchEnabled
                      searchPlaceholder="搜索名称或 slug"
                      minHeightClassName="min-h-72"
                      maxHeightClassName="max-h-72"
                    />
                    <AdminOptionChecklist
                      title="能力域"
                      options={domainOptions}
                      selected={domainIds}
                      onToggle={(id) => toggle(setDomainIds, id)}
                    />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">触发场景（一行一项）</label>
                      <PixelTextarea value={triggersText} onChange={(e) => setTriggersText(e.target.value)} rows={5} className={fixedTextareaClassName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">优先技能（一行一项）</label>
                      <PixelTextarea value={preferredSkillsText} onChange={(e) => setPreferredSkillsText(e.target.value)} rows={5} className={fixedTextareaClassName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">读取内容（一行一项）</label>
                      <PixelTextarea value={readsText} onChange={(e) => setReadsText(e.target.value)} rows={5} className={fixedTextareaClassName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">产出内容（一行一项）</label>
                      <PixelTextarea value={writesText} onChange={(e) => setWritesText(e.target.value)} rows={5} className={fixedTextareaClassName} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">交接对象（一行一项）</label>
                    <PixelTextarea value={handoffToText} onChange={(e) => setHandoffToText(e.target.value)} rows={4} className={fixedTextareaClassName} />
                  </div>
                </section>

                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">专家正文</p>
                    <p className="text-xs text-[var(--pixel-muted)]">对应角色正文的结构化段落。</p>
                  </div>

                  {shouldShowLegacyLongDescription ? (
                    <div className="space-y-2 rounded-sm border-2 border-dashed border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/10 p-3">
                      <p className="text-xs text-[var(--pixel-fg)]">
                        该专家仍在使用旧版“详细说明”字段。下面展示原文供迁移参考，不会自动拆分到新结构。
                      </p>
                      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-[var(--pixel-muted)]">
                        {longDescription}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">角色定位</label>
                    <PixelTextarea value={rolePositioning} onChange={(e) => setRolePositioning(e.target.value)} rows={4} className={fixedTextareaClassName} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">工作原则（一行一条）</label>
                      <PixelTextarea value={workingPrinciplesText} onChange={(e) => setWorkingPrinciplesText(e.target.value)} rows={6} className={fixedTextareaClassName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">必做步骤（一行一步）</label>
                      <PixelTextarea value={requiredStepsText} onChange={(e) => setRequiredStepsText(e.target.value)} rows={6} className={fixedTextareaClassName} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">执行契约</label>
                    <PixelTextarea value={executionContract} onChange={(e) => setExecutionContract(e.target.value)} rows={5} className={fixedTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">输出标准</label>
                    <PixelTextarea value={outputStandard} onChange={(e) => setOutputStandard(e.target.value)} rows={5} className={fixedTextareaClassName} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">禁止事项（一行一条）</label>
                      <PixelTextarea value={prohibitedActionsText} onChange={(e) => setProhibitedActionsText(e.target.value)} rows={6} className={fixedTextareaClassName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">交接说明</label>
                      <PixelTextarea value={handoffNotes} onChange={(e) => setHandoffNotes(e.target.value)} rows={6} className={fixedTextareaClassName} />
                    </div>
                  </div>
                </section>

                <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--pixel-fg)]">Skill 顺序</p>
                    <AdminSortableList
                      items={orderedSkillItems}
                      emptyText="未选择 Skill"
                      onChange={(nextItems) => setSkillIds(nextItems.map((item) => item.id))}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-[var(--pixel-fg)]">Rule 顺序</p>
                    <AdminSortableList
                      items={orderedRuleItems}
                      emptyText="未选择 Rule"
                      onChange={(nextItems) => setRuleIds(nextItems.map((item) => item.id))}
                    />
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <section className="sticky top-0 space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">结构预览</p>
                    <p className="text-xs text-[var(--pixel-muted)]">用于快速检查当前专家结构是否接近 br-ai-spec 专家模板。</p>
                  </div>
                  <div className="space-y-3 border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3">
                    <div>
                      <p className="text-lg text-[var(--pixel-fg)]">{name || "未命名专家"}</p>
                      <p className="text-xs text-[var(--pixel-muted)]">{slug || "slug 未填写"}</p>
                    </div>
                    <div className="grid gap-2 text-xs text-[var(--pixel-muted)]">
                      <p>作者：{author || "未填写"}</p>
                      <p>Hub 发布状态：{catalogPublishStatusLabel(publishStatus)}</p>
                      <p>专家状态：{roleStatusLabel(roleStatus)}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">简介</p>
                      <p className="text-[var(--pixel-muted)]">{description || "未填写"}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">能力域</p>
                      <p className="text-[var(--pixel-muted)]">
                        {[...domainIds]
                          .map((id) => domains.find((item) => item.id === id)?.name)
                          .filter(Boolean)
                          .join(" / ") || "未选择"}
                      </p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">触发场景</p>
                      <p className="text-[var(--pixel-muted)]">{previewTriggers.join(" / ") || "未填写"}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">优先技能</p>
                      <p className="text-[var(--pixel-muted)]">{previewPreferredSkills.join(" / ") || "未填写"}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">读取/产出</p>
                      <p className="text-[var(--pixel-muted)]">读取 {previewReads.length} 项，产出 {previewWrites.length} 项</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">交接对象</p>
                      <p className="text-[var(--pixel-muted)]">{previewHandoffTo.join(" / ") || "未填写"}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">正文结构</p>
                      <ul className="space-y-1 text-[var(--pixel-muted)]">
                        <li>角色定位：{rolePositioning.trim() ? "已填写" : "未填写"}</li>
                        <li>工作原则：{previewWorkingPrinciples.length} 条</li>
                        <li>必做步骤：{previewRequiredSteps.length} 步</li>
                        <li>执行契约：{executionContract.trim() ? "已填写" : "未填写"}</li>
                        <li>输出标准：{outputStandard.trim() ? "已填写" : "未填写"}</li>
                        <li>禁止事项：{previewProhibitedActions.length} 条</li>
                        <li>交接说明：{handoffNotes.trim() ? "已填写" : "未填写"}</li>
                      </ul>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">Profile / 标签</p>
                      <p className="text-[var(--pixel-muted)]">
                        {previewProfiles.join(" / ") || "无 Profile"} ｜ {previewTags.join(" / ") || "无标签"}
                      </p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>

            <DialogFooter className="rounded-none border-t-4 border-[var(--pixel-border)] bg-[#f5ecd8]">
              <Button
                type="button"
                variant="outline"
                className="border-2 border-[var(--pixel-border)]"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
              >
                {busy ? "保存中…" : editingId ? "保存修改" : "创建专家"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={versionsOpen}
        onOpenChange={(nextOpen) => {
          setVersionsOpen(nextOpen);
          if (!nextOpen) {
            setActiveRole(null);
            setVersions([]);
          }
        }}
      >
        <DialogContent
          className="max-h-[92vh] w-[96vw] overflow-y-auto rounded-none border-4 border-[var(--pixel-border)] bg-[#fffef8] p-0 sm:!max-w-none"
          style={{ width: "min(96vw, 800px)", maxWidth: "min(96vw, 800px)" }}
        >
          <div className="space-y-6 p-6">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
                {activeRole ? `专家版本：${activeRole.name}` : "专家版本"}
              </DialogTitle>
            </DialogHeader>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--pixel-fg)]">现有版本</p>
                {versionsLoading ? (
                  <span className="text-xs text-[var(--pixel-muted)]">加载中…</span>
                ) : null}
              </div>
              <div className="space-y-2 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3">
                {versions.length === 0 ? (
                  <p className="text-sm text-[var(--pixel-muted)]">还没有版本记录。</p>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex flex-wrap items-start justify-between gap-3 border-2 border-[var(--pixel-border)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--pixel-fg)]">
                          {version.version}
                          {version.isLatest ? " · latest" : ""}
                        </p>
                        <p className="text-xs text-[var(--pixel-muted)]">
                          {version.changelog || "无变更说明"}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--pixel-muted)]">
                        {formatDateTimeShanghai(version.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
              <p className="text-sm text-[var(--pixel-fg)]">新建版本</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[var(--pixel-fg)]">版本号</label>
                  <PixelInput value={nextVersion} onChange={(e) => setNextVersion(e.target.value.trim())} />
                </div>
                <label className="flex items-center gap-2 pt-8 text-sm text-[var(--pixel-fg)]">
                  <input
                    type="checkbox"
                    checked={versionIsLatest}
                    onChange={(e) => setVersionIsLatest(e.target.checked)}
                    className="size-4 accent-[var(--pixel-accent)]"
                  />
                  标记为 latest
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--pixel-fg)]">变更说明</label>
                <PixelTextarea
                  value={versionChangelog}
                  onChange={(e) => setVersionChangelog(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[var(--pixel-fg)]">版本文件 JSON</label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 border-2 border-[var(--pixel-border)] px-2"
                    onClick={() => {
                      if (!activeRole) return;
                      setVersionFilesText(
                        JSON.stringify(
                          buildRoleVersionDraftFiles(activeRole, { skills, rules, domains }),
                          null,
                          2,
                        ),
                      );
                    }}
                  >
                    重新生成快照
                  </Button>
                </div>
                <PixelTextarea
                  value={versionFilesText}
                  onChange={(e) => setVersionFilesText(e.target.value)}
                  rows={14}
                  className="font-mono text-xs"
                />
              </div>
            </section>

            <DialogFooter className="rounded-none border-t-4 border-[var(--pixel-border)] bg-[#f5ecd8]">
              <Button
                type="button"
                variant="outline"
                className="border-2 border-[var(--pixel-border)]"
                onClick={() => setVersionsOpen(false)}
              >
                关闭
              </Button>
              <Button
                type="button"
                disabled={versionBusy || !activeRole}
                onClick={() => void createVersion()}
                className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
              >
                {versionBusy ? "创建中…" : "创建版本"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
