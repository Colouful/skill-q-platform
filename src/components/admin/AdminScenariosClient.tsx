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
import { catalogPublishStatusLabel } from "@/lib/catalog";
import { formatDateTimeShanghai } from "@/lib/date-format";

type Option = {
  id: string;
  name: string;
  slug: string;
};

type RoleOption = Option & {
  skillIds: string[];
  ruleIds: string[];
};

type ScenarioRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  publishStatus: string;
  supportedProfiles: string[];
  recommendedIdes: string[];
  tags: string[];
  entryRoleId: string | null;
  isFeatured: boolean;
  roleItems: { id: string; isOptional: boolean }[];
  skillIds: string[];
  ruleIds: string[];
  domainIds: string[];
  updatedAt: string;
};

type ScenarioMutationPayload = {
  scenario: {
    id: string;
    name: string;
    slug: string;
    description: string;
    longDescription: string | null;
    publishStatus: string;
    entryRoleId: string | null;
    isFeatured: boolean;
    updatedAt?: string;
  };
};

type SortableRoleItem = AdminSortableListItem & {
  isOptional: boolean;
};

const fixedTextareaClassName = "h-32 resize-none overflow-y-auto field-sizing-fixed";

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

function toggleOrderedRole(
  list: { id: string; isOptional: boolean }[],
  id: string,
): { id: string; isOptional: boolean }[] {
  return list.some((item) => item.id === id)
    ? list.filter((item) => item.id !== id)
    : [...list, { id, isOptional: false }];
}

function moveOrderedRole(
  list: { id: string; isOptional: boolean }[],
  id: string,
  direction: -1 | 1,
): { id: string; isOptional: boolean }[] {
  const index = list.findIndex((item) => item.id === id);
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

export function AdminScenariosClient({
  initialItems,
  roles,
  skills,
  rules,
  domains,
}: {
  initialItems: ScenarioRow[];
  roles: RoleOption[];
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
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [publishStatus, setPublishStatus] = useState("draft");
  const [profilesText, setProfilesText] = useState("");
  const [idesText, setIdesText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [entryRoleId, setEntryRoleId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [roleItems, setRoleItems] = useState<{ id: string; isOptional: boolean }[]>([]);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [ruleIds, setRuleIds] = useState<string[]>([]);
  const [domainIds, setDomainIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const roleOptions = useMemo(
    () => roles.map((item) => ({ id: item.id, label: item.name, caption: item.slug })),
    [roles],
  );
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
  const orderedRoleItems = useMemo<SortableRoleItem[]>(
    () =>
      roleItems.map((item) => {
        const option = roles.find((role) => role.id === item.id);
        return {
          id: item.id,
          title: option?.name ?? item.id,
          subtitle: option?.slug ?? "",
          isOptional: item.isOptional,
        };
      }),
    [roleItems, roles],
  );
  const orderedSkillItems = useMemo(() => toSortableOptionItems(skillIds, skills), [skillIds, skills]);
  const orderedRuleItems = useMemo(() => toSortableOptionItems(ruleIds, rules), [ruleIds, rules]);
  const selectedRoleDetails = useMemo(
    () =>
      roleItems
        .map((item) => {
          const role = roles.find((candidate) => candidate.id === item.id);
          if (!role) return null;
          return {
            ...role,
            isOptional: item.isOptional,
          };
        })
        .filter(Boolean) as Array<RoleOption & { isOptional: boolean }>,
    [roleItems, roles],
  );
  const selectedDomainNames = useMemo(
    () =>
      [...domainIds]
        .map((id) => domains.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [domainIds, domains],
  );
  const previewProfiles = useMemo(() => splitCsv(profilesText), [profilesText]);
  const previewIdes = useMemo(() => splitCsv(idesText), [idesText]);
  const previewTags = useMemo(() => splitCsv(tagsText), [tagsText]);
  const aggregatedRoleSkillIds = useMemo(
    () => Array.from(new Set(selectedRoleDetails.flatMap((role) => role.skillIds))),
    [selectedRoleDetails],
  );
  const aggregatedRoleRuleIds = useMemo(
    () => Array.from(new Set(selectedRoleDetails.flatMap((role) => role.ruleIds))),
    [selectedRoleDetails],
  );
  const resolvedSkillIds = useMemo(
    () => Array.from(new Set([...aggregatedRoleSkillIds, ...skillIds])),
    [aggregatedRoleSkillIds, skillIds],
  );
  const resolvedRuleIds = useMemo(
    () => Array.from(new Set([...aggregatedRoleRuleIds, ...ruleIds])),
    [aggregatedRoleRuleIds, ruleIds],
  );
  const previewEntryRole = useMemo(
    () => roles.find((role) => role.id === entryRoleId) ?? null,
    [entryRoleId, roles],
  );
  const aggregatedSkillNames = useMemo(
    () =>
      resolvedSkillIds
        .map((id) => skills.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [resolvedSkillIds, skills],
  );
  const aggregatedRuleNames = useMemo(
    () =>
      resolvedRuleIds
        .map((id) => rules.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [resolvedRuleIds, rules],
  );
  const directSkillNames = useMemo(
    () =>
      skillIds
        .map((id) => skills.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [skillIds, skills],
  );
  const directRuleNames = useMemo(
    () =>
      ruleIds
        .map((id) => rules.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [ruleIds, rules],
  );

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setLongDescription("");
    setPublishStatus("draft");
    setProfilesText("");
    setIdesText("");
    setTagsText("");
    setEntryRoleId("");
    setIsFeatured(false);
    setRoleItems([]);
    setSkillIds([]);
    setRuleIds([]);
    setDomainIds(new Set());
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

  function openEdit(item: ScenarioRow) {
    setEditingId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description);
    setLongDescription(item.longDescription ?? "");
    setPublishStatus(item.publishStatus);
    setProfilesText(joinCsv(item.supportedProfiles));
    setIdesText(joinCsv(item.recommendedIdes));
    setTagsText(joinCsv(item.tags));
    setEntryRoleId(item.entryRoleId ?? "");
    setIsFeatured(item.isFeatured);
    setRoleItems(item.roleItems);
    setSkillIds(item.skillIds);
    setRuleIds(item.ruleIds);
    setDomainIds(new Set(item.domainIds));
    setOpen(true);
  }

  function upsertItem(nextItem: ScenarioRow) {
    setItems((prev) => {
      if (editingId) {
        return prev.map((item) => (item.id === nextItem.id ? nextItem : item));
      }
      return [nextItem, ...prev];
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name,
      slug,
      description,
      longDescription,
      publishStatus,
      supportedProfiles: splitCsv(profilesText),
      recommendedIdes: splitCsv(idesText),
      tags: splitCsv(tagsText),
      entryRoleId: entryRoleId || null,
      isFeatured,
      roles: roleItems,
      skills: skillIds,
      rules: ruleIds,
      domainIds: [...domainIds],
    };
    const endpoint = editingId ? "/api/admin/scenarios/update" : "/api/admin/scenarios";
    const res = await fetchApi<ScenarioMutationPayload>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.code !== 0) {
      toast.error(res.message || "保存失败");
      return;
    }
    const saved = res.data?.scenario;
    upsertItem({
      id: saved?.id ?? editingId ?? crypto.randomUUID(),
      name: saved?.name ?? name.trim(),
      slug: saved?.slug ?? slugifyDraft(slug || name),
      description: saved?.description ?? description,
      longDescription: saved?.longDescription ?? (longDescription || null),
      publishStatus: saved?.publishStatus ?? publishStatus,
      supportedProfiles: payload.supportedProfiles,
      recommendedIdes: payload.recommendedIdes,
      tags: payload.tags,
      entryRoleId: saved?.entryRoleId ?? payload.entryRoleId,
      isFeatured: saved?.isFeatured ?? isFeatured,
      roleItems: payload.roles,
      skillIds: payload.skills,
      ruleIds: payload.rules,
      domainIds: payload.domainIds,
      updatedAt: saved?.updatedAt ?? new Date().toISOString(),
    });
    toast.success(editingId ? "场景方案已更新" : "场景方案已创建");
    setOpen(false);
    resetForm();
    router.refresh();
  }

  async function remove(item: ScenarioRow) {
    const ok = window.confirm(`确定删除场景方案「${item.name}」？该操作不可恢复。`);
    if (!ok) return;
    setBusy(true);
    const res = await fetchApi("/api/admin/scenarios/delete", {
      method: "POST",
      body: JSON.stringify({ id: item.id }),
    });
    setBusy(false);
    if (res.code !== 0) {
      toast.error(res.message || "删除失败");
      return;
    }
    toast.success("场景方案已删除");
    router.refresh();
  }

  async function togglePublish(item: ScenarioRow) {
    const nextStatus = item.publishStatus === "published" ? "draft" : "published";
    setBusy(true);
    const res = await fetchApi("/api/admin/scenarios/publish-status", {
      method: "POST",
      body: JSON.stringify({ id: item.id, publishStatus: nextStatus }),
    });
    setBusy(false);
    if (res.code !== 0) {
      toast.error(res.message || "状态更新失败");
      return;
    }
    toast.success(`场景方案已切换为 ${nextStatus}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          维护场景方案与入口专家、专家链；Skill / Rule 默认会从专家自动聚合，这里只补充少量场景专属资产。
        </p>
        <Button
          type="button"
          onClick={openCreate}
          className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
        >
          新建场景方案
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>标识</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>入口专家</TableHead>
            <TableHead>专家</TableHead>
            <TableHead>补充 Skill</TableHead>
            <TableHead>补充 Rule</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.slug}</TableCell>
              <TableCell>{catalogPublishStatusLabel(item.publishStatus)}</TableCell>
              <TableCell>{roles.find((role) => role.id === item.entryRoleId)?.name ?? "未设置"}</TableCell>
              <TableCell>{item.roleItems.length}</TableCell>
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
          style={{ width: "min(96vw, 1480px)", maxWidth: "min(96vw, 1480px)" }}
        >
          <form onSubmit={save} className="space-y-6 p-6">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
                {editingId ? "编辑场景方案" : "新建场景方案"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="space-y-6">
                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">基础信息</p>
                    <p className="text-xs text-[var(--pixel-muted)]">定义场景名称、入口专家和发布状态。</p>
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
                      <label className="text-sm text-[var(--pixel-fg)]">发布状态</label>
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
                      <label className="text-sm text-[var(--pixel-fg)]">入口专家</label>
                      <select
                        value={entryRoleId}
                        onChange={(e) => setEntryRoleId(e.target.value)}
                        className={pixelSelectClassName}
                      >
                        <option value="">未设置</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">简介</label>
                    <PixelTextarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      required
                      className={fixedTextareaClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--pixel-fg)]">详细说明</label>
                    <PixelTextarea
                      value={longDescription}
                      onChange={(e) => setLongDescription(e.target.value)}
                      rows={6}
                      className={fixedTextareaClassName}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">适用 Profile（逗号分隔）</label>
                      <PixelInput value={profilesText} onChange={(e) => setProfilesText(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">推荐 IDE（逗号分隔）</label>
                      <PixelInput value={idesText} onChange={(e) => setIdesText(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--pixel-fg)]">标签（逗号分隔）</label>
                      <PixelInput value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 pt-8 text-sm text-[var(--pixel-fg)]">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="size-4 accent-[var(--pixel-accent)]"
                      />
                      首页推荐
                    </label>
                  </div>
                </section>

                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">场景结构</p>
                    <p className="text-xs text-[var(--pixel-muted)]">主配置是专家链，Skill / Rule 默认会从专家自动聚合。</p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <AdminOptionChecklist
                      title="专家链"
                      options={roleOptions}
                      selected={new Set(roleItems.map((item) => item.id))}
                      onToggle={(id) => setRoleItems((prev) => toggleOrderedRole(prev, id))}
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
                    <AdminOptionChecklist
                      title="补充 Skill（可选）"
                      options={skillOptions}
                      selected={new Set(skillIds)}
                      onToggle={(id) => setSkillIds((prev) => toggleOrderedId(prev, id))}
                      searchEnabled
                      searchPlaceholder="搜索名称或 slug"
                      minHeightClassName="min-h-72"
                      maxHeightClassName="max-h-72"
                    />
                    <AdminOptionChecklist
                      title="补充 Rule（可选）"
                      options={ruleOptions}
                      selected={new Set(ruleIds)}
                      onToggle={(id) => setRuleIds((prev) => toggleOrderedId(prev, id))}
                      searchEnabled
                      searchPlaceholder="搜索名称或 slug"
                      minHeightClassName="min-h-72"
                      maxHeightClassName="max-h-72"
                    />
                  </div>
                </section>

                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">顺序与补充项</p>
                    <p className="text-xs text-[var(--pixel-muted)]">用于调优执行顺序，以及补少量场景专属资产。</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--pixel-fg)]">专家链顺序 / 可选项</p>
                    <AdminSortableList
                      items={orderedRoleItems}
                      emptyText="未选择专家"
                      onChange={(nextItems) =>
                        setRoleItems(nextItems.map((item) => ({ id: item.id, isOptional: item.isOptional })))
                      }
                      renderActions={(item) => (
                        <label className="inline-flex items-center gap-2 text-xs text-[var(--pixel-fg)]">
                          <input
                            type="checkbox"
                            checked={item.isOptional}
                            onChange={(e) =>
                              setRoleItems((prev) =>
                                prev.map((current) =>
                                  current.id === item.id
                                    ? { ...current, isOptional: e.target.checked }
                                    : current,
                                ),
                              )
                            }
                            className="size-4 accent-[var(--pixel-accent)]"
                          />
                          可选
                        </label>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm text-[var(--pixel-fg)]">补充 Skill 顺序</p>
                      <AdminSortableList
                        items={orderedSkillItems}
                        emptyText="未选择补充 Skill"
                        onChange={(nextItems) => setSkillIds(nextItems.map((item) => item.id))}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-[var(--pixel-fg)]">补充 Rule 顺序</p>
                      <AdminSortableList
                        items={orderedRuleItems}
                        emptyText="未选择补充 Rule"
                        onChange={(nextItems) => setRuleIds(nextItems.map((item) => item.id))}
                      />
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="sticky top-0 space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">结构预览</p>
                    <p className="text-xs text-[var(--pixel-muted)]">保存前先检查场景结构、入口专家以及从专家自动汇总出的安装资产。</p>
                  </div>

                  <div className="space-y-3 border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3">
                    <div>
                      <p className="text-lg text-[var(--pixel-fg)]">{name || "未命名场景方案"}</p>
                      <p className="text-xs text-[var(--pixel-muted)]">{slug || "slug 未填写"}</p>
                    </div>

                    <div className="grid gap-2 text-xs text-[var(--pixel-muted)]">
                      <p>发布状态：{catalogPublishStatusLabel(publishStatus)}</p>
                      <p>入口专家：{previewEntryRole?.name ?? "未设置"}</p>
                      <p>首页推荐：{isFeatured ? "是" : "否"}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">简介</p>
                      <p className="text-[var(--pixel-muted)]">{description || "未填写"}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">Profile / IDE</p>
                      <p className="text-[var(--pixel-muted)]">
                        {previewProfiles.join(" / ") || "未填写 Profile"} | {previewIdes.join(" / ") || "未填写 IDE"}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">标签</p>
                      <p className="text-[var(--pixel-muted)]">{previewTags.join(" / ") || "未填写"}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">能力域</p>
                      <p className="text-[var(--pixel-muted)]">{selectedDomainNames.join(" / ") || "未选择"}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">专家链</p>
                      {selectedRoleDetails.length > 0 ? (
                        <ul className="space-y-1 text-[var(--pixel-muted)]">
                          {selectedRoleDetails.map((role, index) => (
                            <li key={role.id}>
                              {index + 1}. {role.name}
                              {role.id === entryRoleId ? "（入口）" : ""}
                              {role.isOptional ? "（可选）" : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[var(--pixel-muted)]">未选择专家</p>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">Skill 汇总</p>
                      <p className="text-[var(--pixel-muted)]">
                        自动聚合 {aggregatedRoleSkillIds.length} 个，补充 {skillIds.length} 个，共 {resolvedSkillIds.length} 个
                      </p>
                      <p className="text-[var(--pixel-muted)]">{aggregatedSkillNames.join(" / ") || "暂无 Skill"}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">Rule 汇总</p>
                      <p className="text-[var(--pixel-muted)]">
                        自动聚合 {aggregatedRoleRuleIds.length} 个，补充 {ruleIds.length} 个，共 {resolvedRuleIds.length} 个
                      </p>
                      <p className="text-[var(--pixel-muted)]">{aggregatedRuleNames.join(" / ") || "暂无 Rule"}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--pixel-fg)]">补充项</p>
                      <p className="text-[var(--pixel-muted)]">
                        补充 Skill：{directSkillNames.join(" / ") || "无"}
                      </p>
                      <p className="text-[var(--pixel-muted)]">
                        补充 Rule：{directRuleNames.join(" / ") || "无"}
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
                {busy ? "保存中…" : editingId ? "保存修改" : "创建场景方案"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
