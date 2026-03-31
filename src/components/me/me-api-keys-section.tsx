"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";
import { formatDateTimeShanghai } from "@/lib/date-format";

type KeyRow = {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  isRevoked: boolean;
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export function MeApiKeysSection() {
  const router = useRouter();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyOnce, setNewKeyOnce] = useState<string | null>(null);

  async function load() {
    const res = await fetchApi<{ keys: KeyRow[] }>("/api/auth/api-keys");
    setLoading(false);
    if (res.code !== 0) {
      toast.error(res.message || "加载失败");
      return;
    }
    setKeys(res.data?.keys ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createKey() {
    const res = await fetchApi<{ apiKey: string }>("/api/auth/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `extra-${Date.now()}` }),
    });
    if (res.code !== 0) {
      toast.error(res.message || "创建失败");
      return;
    }
    const raw = res.data?.apiKey;
    if (raw) {
      setNewKeyOnce(raw);
      void navigator.clipboard.writeText(raw).catch(() => {});
      toast.success("新 Key 已生成并尝试复制到剪贴板，请妥善保存");
    }
    void load();
    router.refresh();
  }

  async function renameKey(id: string, currentName: string) {
    const name = window.prompt("新的 Key 名称", currentName)?.trim();
    if (!name) return;
    const res = await fetchApi("/api/auth/api-keys/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    if (res.code !== 0) {
      toast.error(res.message || "改名失败");
      return;
    }
    toast.success("已更新名称");
    void load();
    router.refresh();
  }

  async function rotate(id: string) {
    if (!window.confirm("将生成新 Key，旧 Key 在 24 小时内仍可使用。确定轮换？")) return;
    const res = await fetchApi<{
      apiKey: string;
      previousKeyExpiresAt: string;
      message?: string;
    }>("/api/auth/api-keys/rotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.code !== 0) {
      toast.error(res.message || "轮换失败");
      return;
    }
    const raw = res.data?.apiKey;
    if (raw) {
      setNewKeyOnce(raw);
      void navigator.clipboard.writeText(raw).catch(() => {});
      toast.success(res.data?.message ?? "新 Key 已生成，旧 Key 24h 内仍可用");
    }
    void load();
    router.refresh();
  }

  async function revoke(id: string) {
    const res = await fetchApi("/api/auth/api-keys/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.code !== 0) {
      toast.error(res.message || "撤销失败");
      return;
    }
    toast.success("已撤销");
    setNewKeyOnce(null);
    void load();
    router.refresh();
  }

  return (
    <section className="space-y-3 border-t-2 border-[var(--pixel-border)]/30 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          特工凭证
        </h2>
        <Button
          type="button"
          size="sm"
          onClick={() => void createKey()}
          className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]"
        >
          新建 Key
        </Button>
      </div>

      {newKeyOnce && (
        <p className="break-all rounded border-2 border-[var(--pixel-accent)] bg-[var(--pixel-bg)] p-2 font-mono text-[10px] text-[var(--pixel-fg)]">
          仅此一次：{newKeyOnce}
        </p>
      )}

      {loading ? (
        <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          加载中…
        </p>
      ) : keys.length === 0 ? (
        <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          暂无记录
        </p>
      ) : (
        <ul className="space-y-2 font-[family-name:var(--font-pixel-body)] text-xs">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex flex-wrap items-center justify-between gap-2 border-2 border-[var(--pixel-border)]/40 bg-[var(--pixel-bg)] px-2 py-2"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[var(--pixel-fg)]">{k.name}</span>
                <span className="text-[var(--pixel-muted)]"> · {k.keyPrefix}</span>
                {k.description ? (
                  <p className="mt-0.5 text-[10px] text-[var(--pixel-muted)]">{k.description}</p>
                ) : null}
                {!k.isRevoked && k.expiresAt && new Date(k.expiresAt) > new Date() ? (
                  <span className="ml-1 text-[var(--pixel-muted)]">
                    （宽限至 {formatDateTimeShanghai(k.expiresAt)}）
                  </span>
                ) : null}
                {k.isRevoked && (
                  <span className="ml-1 text-[var(--pixel-accent)]">已撤销</span>
                )}
              </div>
              {!k.isRevoked && (
                <div className="flex shrink-0 flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-[var(--pixel-muted)] hover:text-[var(--pixel-fg)]"
                    onClick={() => void renameKey(k.id, k.name)}
                  >
                    改名
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-[var(--pixel-muted)] hover:text-[var(--pixel-cyan)]"
                    onClick={() => void rotate(k.id)}
                  >
                    轮换
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-[var(--pixel-muted)] hover:text-[var(--pixel-accent)]"
                    onClick={() => void revoke(k.id)}
                  >
                    撤销
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
