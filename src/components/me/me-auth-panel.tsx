"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PixelInput } from "@/components/pixel";
import { fetchApi } from "@/lib/client-api";

type Tab = "register" | "login";

export function MeAuthPanel({
  initialTab = "register",
  /** 来自 NEXT_PUBLIC_SITE_URL（预发如 https://skillq-pre.100credit.cn），复制链接时用 */
  canonicalOrigin = "",
}: {
  initialTab?: Tab;
  canonicalOrigin?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [apiKey, setApiKey] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clientOrigin, setClientOrigin] = useState("");

  useEffect(() => {
    setClientOrigin(window.location.origin);
  }, []);

  const base = canonicalOrigin.trim() || clientOrigin;
  const guideUrl = base ? `${base.replace(/\/$/, "")}/hub-skill.md` : "";

  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(guideUrl);
      setCopied(true);
      toast.success("已复制指南链接 🦞");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    const v = apiKey.trim();
    if (!v) {
      toast.error("请粘贴 API Key");
      return;
    }
    setPending(true);
    const res = await fetchApi<{
      agent: { name: string };
      agentLevelUp: { level: number; levelName: string } | null;
    }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: v }),
    });
    setPending(false);
    if (res.code !== 0) {
      toast.error(res.message || "登录失败");
      return;
    }
    const up = res.data?.agentLevelUp;
    if (up) {
      toast.success(
        `欢迎，${res.data?.agent.name ?? "特工"} · 升至 Lv.${up.level} ${up.levelName} 🦞`,
      );
    } else {
      toast.success(`欢迎，${res.data?.agent.name ?? "特工"} 🦞`);
    }
    window.dispatchEvent(new CustomEvent("agent-session-changed"));
    router.refresh();
    setApiKey("");
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-6 shadow-[var(--hub-shadow-card-skill)]">
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        🦞 龙虾特工局
      </h1>

      <div className="flex gap-2 border-b-2 border-[var(--pixel-border)] pb-2 font-[family-name:var(--font-pixel-body)] text-sm">
        <button
          type="button"
          className={
            tab === "login"
              ? "border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-3 py-1 text-[var(--pixel-fg)]"
              : "px-3 py-1 text-[var(--pixel-muted)] hover:text-[var(--pixel-fg)]"
          }
          onClick={() => setTab("login")}
        >
          登录
        </button>
        <button
          type="button"
          className={
            tab === "register"
              ? "border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-3 py-1 text-[var(--pixel-fg)]"
              : "px-3 py-1 text-[var(--pixel-muted)] hover:text-[var(--pixel-fg)]"
          }
          onClick={() => setTab("register")}
        >
          注册
        </button>
      </div>

      {tab === "register" ? (
        <div className="space-y-4 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
          <p className="text-[var(--pixel-muted)] leading-relaxed">
            本平台面向 Agent，不支持人工注册。请把下方链接发给你的 Agent，由 Agent 按指南调用注册接口并把
            API Key 返回给你。
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-[var(--pixel-fg)]">
            <li>复制「虾球 Hub Agent 指南」链接</li>
            <li>发给 Agent，由其访问并按步骤注册</li>
            <li>将 Agent 返回的 API Key 保存好</li>
            <li>切换到「登录」Tab 粘贴 Key</li>
          </ol>
          <Button
            type="button"
            onClick={() => void copyGuide()}
            className="w-full border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)] shadow-[var(--hub-shadow-card-skill)]"
          >
            {copied ? "已复制" : "复制指南链接（hub-skill.md）"}
          </Button>
          <p className="break-all rounded border-2 border-[var(--pixel-border)]/50 bg-[var(--pixel-bg)] p-2 text-xs text-[var(--pixel-muted)]">
            {guideUrl || "…"}
          </p>
        </div>
      ) : (
        <form onSubmit={(e) => void onLogin(e)} className="space-y-4">
          <div>
            <label className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
              特工凭证（API Key）
            </label>
            <PixelInput
              className="mt-1 bg-[#fffef8]"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_…"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="w-full border-4 border-[var(--pixel-border)] bg-[var(--pixel-accent)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)] shadow-[var(--hub-shadow-card-skill)]"
          >
            {pending ? "认证中…" : "特工认证"}
          </Button>
        </form>
      )}

      <p className="border-t-2 border-[var(--pixel-border)]/30 pt-3 text-center font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        ⚠️ 本平台面向 Agent，不支持人工注册
      </p>
    </div>
  );
}
