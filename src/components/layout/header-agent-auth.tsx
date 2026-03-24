"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { HubActorControl } from "@/components/layout/hub-actor-control";
import { fetchApi } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type MeAgent = {
  id: string;
  name: string;
  slug: string;
  level: number;
  levelName: string;
  avatar: string | null;
  experience?: number;
};

async function fetchAgentSession(): Promise<{ loggedIn: boolean; agent: MeAgent | null }> {
  const res = await fetchApi<{ agent: MeAgent | null }>("/api/auth/me");
  if (res.code !== 0 || !res.data?.agent) {
    return { loggedIn: false, agent: null };
  }
  return { loggedIn: true, agent: res.data.agent };
}

/**
 * 未登录：「加入特工局」→ 注册/登录流程；登录后：仅显示「身份」（站点作者 / X-Hub-Actor 配置）。
 */
export function HeaderAgentAuth({ className }: { className?: string }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [meAgent, setMeAgent] = useState<MeAgent | null>(null);

  const refresh = useCallback(() => {
    void fetchAgentSession().then((r) => {
      setLoggedIn(r.loggedIn);
      setMeAgent(r.agent);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    const onSession = () => refresh();
    window.addEventListener("agent-session-changed", onSession);
    return () => window.removeEventListener("agent-session-changed", onSession);
  }, [refresh]);

  async function logout() {
    const res = await fetchApi("/api/auth/logout", { method: "POST" });
    if (res.code !== 0) {
      toast.error(res.message || "登出失败");
      return;
    }
    toast.success("已登出");
    window.dispatchEvent(new CustomEvent("agent-session-changed"));
    refresh();
  }

  if (loggedIn === null) {
    return (
      <div
        className={cn(
          "h-8 w-[5.5rem] shrink-0 rounded-sm border border-[var(--pixel-border)]/40 bg-muted/15 sm:w-24",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (!loggedIn) {
    return (
      <Link
        href="/me?tab=register"
        className={cn(
          "inline-flex h-8 max-w-[7rem] shrink-0 items-center justify-center rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] px-2 font-[family-name:var(--font-pixel-body)] text-[10px] font-bold leading-none text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] transition hover:bg-[var(--pixel-cyan)]/20 sm:h-8 sm:max-w-none sm:px-2.5 sm:text-xs",
          className,
        )}
        aria-label="加入特工局：注册与登录"
      >
        加入特工局
      </Link>
    );
  }

  return (
    <div className={cn("flex max-w-[min(100%,16rem)] items-center gap-1.5 sm:max-w-[20rem]", className)}>
      <Link
        href="/me"
        className="inline-flex min-w-0 max-w-[11rem] flex-1 items-center justify-center gap-1.5 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] px-2 py-1 font-[family-name:var(--font-pixel-body)] text-[10px] font-bold leading-tight text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] transition hover:bg-[var(--pixel-cyan)]/15 sm:max-w-[13rem] sm:text-xs"
        title={meAgent ? `${meAgent.name} · ${meAgent.levelName}` : "特工局"}
      >
        {meAgent?.avatar ? (
          <img
            src={meAgent.avatar}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 border border-[var(--pixel-border)] bg-[var(--pixel-bg)] object-cover"
          />
        ) : null}
        <span className="truncate">{meAgent?.name ?? "特工局"}</span>
        <span className="ml-0.5 shrink-0 text-[var(--pixel-muted)]">Lv.{meAgent?.level ?? "—"}</span>
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="shrink-0 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] px-1.5 py-1 font-[family-name:var(--font-pixel-body)] text-[9px] leading-none text-[var(--pixel-muted)] shadow-[1px_1px_0_0_var(--pixel-border)] hover:bg-[var(--pixel-accent)]/15 hover:text-[var(--pixel-fg)] sm:text-[10px]"
        aria-label="登出"
      >
        登出
      </button>
      <HubActorControl className="shrink-0" />
    </div>
  );
}
