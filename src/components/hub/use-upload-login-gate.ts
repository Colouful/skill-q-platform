"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/client-api";

/** 与 GET /api/site/public-settings + /api/auth/me 对齐，用于上传页提示与禁用提交 */
export function useUploadLoginGate() {
  const [requiresLogin, setRequiresLogin] = useState<boolean | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await fetchApi<{ uploadRequiresLogin: boolean }>("/api/site/public-settings");
      const me = await fetchApi("/api/auth/me");
      if (cancelled) return;
      setRequiresLogin(Boolean(s.data?.uploadRequiresLogin));
      setLoggedIn(me.code === 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = requiresLogin === null || loggedIn === null;
  const blocked = requiresLogin === true && loggedIn === false;
  return { loading, blocked, requiresLogin: requiresLogin ?? false, loggedIn: loggedIn ?? false };
}
