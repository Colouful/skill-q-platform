"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchApi } from "@/lib/client-api";
import { setHubActorToStorage } from "@/lib/hub-actor-client";
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
  const res = await fetchApi<{ loggedIn: boolean; agent: MeAgent | null }>(
    "/api/auth/session-summary",
  );
  if (res.code !== 0 || !res.data?.loggedIn || !res.data.agent) {
    return { loggedIn: false, agent: null };
  }
  return { loggedIn: true, agent: res.data.agent };
}

/**
 * 未登录：「加入特工局」→ /me；登录后：入口跳转特工档案（昵称在档案内修改）。
 */
export function HeaderAgentAuth({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [meAgent, setMeAgent] = useState<MeAgent | null>(null);
  const isAdminArea = pathname.startsWith("/admin");

  const refresh = useCallback(() => {
    void fetchAgentSession().then((r) => {
      setLoggedIn(r.loggedIn);
      setMeAgent(r.agent);
      if (r.loggedIn && r.agent?.name) {
        setHubActorToStorage(r.agent.name);
      }
    });
  }, []);

  useEffect(() => {
    if (isAdminArea) {
      setLoggedIn(false);
      setMeAgent(null);
      return;
    }
    refresh();
  }, [isAdminArea, refresh]);

  useEffect(() => {
    if (isAdminArea) return;
    const onSession = () => refresh();
    window.addEventListener("agent-session-changed", onSession);
    return () => window.removeEventListener("agent-session-changed", onSession);
  }, [isAdminArea, refresh]);

  if (isAdminArea) {
    return null;
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
    <Link
      href="/me"
      className={cn(
        "inline-flex max-w-[min(100%,16rem)] shrink-0 items-center gap-1.5 overflow-hidden rounded-sm border-4 border-[var(--pixel-border)] bg-[#fffef8] px-2 py-1 font-[family-name:var(--font-pixel-body)] text-[10px] font-bold leading-tight text-[var(--pixel-fg)] shadow-[4px_4px_0_0_var(--pixel-border)] transition hover:bg-[var(--pixel-cyan)]/12 sm:max-w-[18rem] sm:text-xs",
        className,
      )}
      title={meAgent ? `${meAgent.name} · ${meAgent.levelName}` : "特工局"}
    >
      {meAgent?.avatar ? (
        <img
          src={meAgent.avatar}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] object-cover"
        />
      ) : null}
      <span className="min-w-0 truncate">{meAgent?.name ?? "特工局"}</span>
      <span className="shrink-0 text-[var(--pixel-muted)]">Lv.{meAgent?.level ?? "—"}</span>
    </Link>
  );
}
