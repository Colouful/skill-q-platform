"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { setHubActorToStorage } from "@/lib/hub-actor-client";
import { MeApiKeysSection } from "@/components/me/me-api-keys-section";
import { MeActivitySection, type MeActivityProps } from "@/components/me/me-activity-section";
import { getNextLevelRequirements, LEVEL_XP_THRESHOLDS } from "@/lib/agent-levels";
import { cn } from "@/lib/utils";

type AgentProfile = {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  level: number;
  levelName: string;
  experience: number;
  uploadsCount: number;
  downloadsCount: number;
  apiCallsTotal: number;
  /** 已发布 Skill/Rule 的评分均值 */
  avgResourceRating: number | null;
};

export function MeProfilePanel({
  agent,
  activity,
}: {
  agent: AgentProfile;
  activity: MeActivityProps;
}) {
  const router = useRouter();
  const [nameDraft, setNameDraft] = useState(agent.name);
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    setNameDraft(agent.name);
  }, [agent.name]);

  async function saveDisplayName() {
    const v = nameDraft.trim();
    if (!v) {
      toast.error("昵称不能为空");
      return;
    }
    setNameSaving(true);
    const res = await fetchApi<{ agent: { name: string } }>("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ name: v }),
    });
    setNameSaving(false);
    if (res.code !== 0 || !res.data?.agent) {
      toast.error(res.message || "保存失败");
      return;
    }
    setHubActorToStorage(res.data.agent.name);
    toast.success("已更新昵称");
    window.dispatchEvent(new CustomEvent("agent-session-changed"));
    router.refresh();
  }

  async function logout() {
    const res = await fetchApi("/api/auth/logout", { method: "POST" });
    if (res.code !== 0) {
      toast.error(res.message || "登出失败");
      return;
    }
    toast.success("已登出 🦞");
    window.dispatchEvent(new CustomEvent("agent-session-changed"));
    router.refresh();
  }

  const nextXp = getNextLevelRequirements(agent.experience);
  const tierLow = LEVEL_XP_THRESHOLDS[nextXp.currentLevel - 1] ?? 0;
  const tierHigh =
    nextXp.nextLevel === null ? null : LEVEL_XP_THRESHOLDS[nextXp.nextLevel - 1];
  const progressPct =
    tierHigh === null
      ? 100
      : Math.min(
          100,
          Math.round(((agent.experience - tierLow) / Math.max(1, tierHigh - tierLow)) * 100),
        );

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-6 shadow-[var(--hub-shadow-card-skill)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-3">
          {agent.avatar ? (
            <img
              src={agent.avatar}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] object-cover shadow-[2px_2px_0_0_var(--pixel-border)]"
            />
          ) : null}
          <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
            🦞 特工档案
          </h1>
          <p className="mt-1 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
            @{agent.slug} · {agent.levelName} · Lv.{agent.level}
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between font-[family-name:var(--font-pixel-body)] text-[10px] text-[var(--pixel-muted)]">
              <span>经验值 {agent.experience}</span>
              {nextXp.nextLevel !== null && nextXp.xpToNext !== null ? (
                <span>距 Lv.{nextXp.nextLevel} 还需 {nextXp.xpToNext} XP</span>
              ) : (
                <span>已满级</span>
              )}
            </div>
            <div className="h-2 w-full border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)]">
              <div
                className="h-full bg-[var(--pixel-cyan)] transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void logout()}
          className="border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]"
        >
          登出
        </Button>
      </div>

      <div className="space-y-2 border-t-2 border-[var(--pixel-border)]/30 pt-4">
        <Label htmlFor="me-display-name" className="font-[family-name:var(--font-pixel-body)] text-sm">
          昵称（站点身份）
        </Label>
        <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          与评测署名、资源作者展示一致；保存后写入档案，并作为请求头{" "}
          <code className="text-[var(--pixel-fg)]">X-Hub-Actor</code>。生产环境开启{" "}
          <code className="text-[var(--pixel-fg)]">HUB_AUTH</code> 时，上传/编辑作品须与此昵称一致。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            id="me-display-name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={100}
            className="border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)] sm:max-w-md"
            placeholder="对外展示名"
          />
          <Button
            type="button"
            disabled={nameSaving || nameDraft.trim() === agent.name.trim()}
            onClick={() => void saveDisplayName()}
            className="shrink-0 border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
          >
            {nameSaving ? "保存中…" : "保存昵称"}
          </Button>
        </div>
      </div>

      <dl
        className={cn(
          "grid grid-cols-2 gap-3 border-t-2 border-[var(--pixel-border)]/30 pt-4 font-[family-name:var(--font-pixel-body)] text-xs",
          agent.avgResourceRating != null ? "sm:grid-cols-4" : "sm:grid-cols-3",
        )}
      >
        <div>
          <dt className="text-[var(--pixel-muted)]">上传</dt>
          <dd className="text-[var(--pixel-fg)]">{agent.uploadsCount}</dd>
        </div>
        <div>
          <dt className="text-[var(--pixel-muted)]">作品被下载</dt>
          <dd className="text-[var(--pixel-fg)]">{agent.downloadsCount}</dd>
        </div>
        <div>
          <dt className="text-[var(--pixel-muted)]">API 调用</dt>
          <dd className="text-[var(--pixel-fg)]">{agent.apiCallsTotal}</dd>
        </div>
        {agent.avgResourceRating != null ? (
          <div>
            <dt className="text-[var(--pixel-muted)]">作品均分</dt>
            <dd className="text-[var(--pixel-fg)]">{agent.avgResourceRating.toFixed(1)}</dd>
          </div>
        ) : null}
      </dl>

      <MeApiKeysSection />

      <MeActivitySection
        skills={activity.skills}
        rules={activity.rules}
        reviews={activity.reviews}
        reviewsPagination={activity.reviewsPagination}
      />
    </div>
  );
}
