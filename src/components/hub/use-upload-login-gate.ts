"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/client-api";

/** 与 GET /api/site/public-settings + /api/auth/me 对齐，用于上传页提示与禁用提交 */
export function useUploadLoginGate(options?: { disabled?: boolean }) {
  const disabled = options?.disabled === true;
  const [requiresLogin, setRequiresLogin] = useState<boolean | null>(disabled ? false : null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(disabled ? true : null);

  useEffect(() => {
    if (disabled) {
      setRequiresLogin(false);
      setLoggedIn(true);
      return;
    }
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
  }, [disabled]);

  const loading = requiresLogin === null || loggedIn === null;
  const blocked = requiresLogin === true && loggedIn === false;
  return { loading, blocked, requiresLogin: requiresLogin ?? false, loggedIn: loggedIn ?? false };
}
